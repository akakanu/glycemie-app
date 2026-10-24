#!/usr/bin/env bash
# Affiche l'IP publique de sortie du cluster (celle que voit MongoDB Atlas).
# Un pod éphémère interroge un service d'écho d'IP : aucun droit Azure supplémentaire n'est nécessaire
# (l'IP de sortie vit dans le groupe technique d'AKS, inaccessible à l'identité GitHub).
set -euo pipefail

readonly IMAGE="curlimages/curl:8.23.0"

for url in https://api.ipify.org https://ifconfig.me/ip; do
  ip=$(kubectl run "egress-ip-$RANDOM" -n default --image="$IMAGE" --restart=Never \
    --rm -i --quiet --command -- curl -fsS --retry 5 --max-time 10 "$url" 2>/dev/null | tr -d '[:space:]') || true
  if [[ "$ip" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ ]]; then
    echo "$ip"
    exit 0
  fi
done

echo "Impossible de déterminer l'IP de sortie du cluster." >&2
exit 1
