#!/usr/bin/env bash
# Affiche l'IP publique de sortie du cluster (celle que voit MongoDB Atlas).
# Un pod éphémère interroge un service d'écho d'IP : aucun droit Azure supplémentaire n'est nécessaire
# (l'IP de sortie vit dans le groupe technique d'AKS, inaccessible à l'identité GitHub).
#
# Pas de « kubectl run -i » : curl se termine souvent avant que kubectl ne s'attache au pod,
# et la sortie arrive alors en double. On attend la fin du pod, puis on lit ses logs.
set -euo pipefail

readonly IMAGE="curlimages/curl:8.23.0"
readonly NAMESPACE="default"

for url in https://api.ipify.org https://ifconfig.me/ip; do
  pod="egress-ip-$RANDOM"
  kubectl run "$pod" -n "$NAMESPACE" --image="$IMAGE" --restart=Never \
    --command -- curl -fsS --retry 5 --max-time 10 "$url" > /dev/null

  if kubectl wait "pod/$pod" -n "$NAMESPACE" --for=jsonpath='{.status.phase}'=Succeeded --timeout=120s > /dev/null 2>&1; then
    ip=$(kubectl logs "pod/$pod" -n "$NAMESPACE" | tr -d '[:space:]')
  else
    echo "Le pod de sonde n'a pas abouti avec ${url} :" >&2
    kubectl logs "pod/$pod" -n "$NAMESPACE" >&2 || true
    ip=""
  fi
  kubectl delete pod "$pod" -n "$NAMESPACE" --wait=false > /dev/null 2>&1 || true

  if [[ "$ip" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ ]]; then
    echo "$ip"
    exit 0
  fi
done

echo "Impossible de déterminer l'IP de sortie du cluster." >&2
exit 1
