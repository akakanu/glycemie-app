#!/usr/bin/env bash
# Installe la plateforme du cluster : CRD Gateway API, Traefik, cert-manager et émetteurs Let's Encrypt.
# Idempotent : peut être relancé sans effet de bord.
#
# Variables requises : LETSENCRYPT_EMAIL, HOST. Versions lues dans k8s/platform/versions.env.
set -euo pipefail

: "${LETSENCRYPT_EMAIL:?LETSENCRYPT_EMAIL manquant}"
: "${HOST:?HOST manquant}"

cd "$(dirname "$0")/.."
# shellcheck source=k8s/platform/versions.env
source k8s/platform/versions.env

echo "::group::CRD Gateway API ${GATEWAY_API_VERSION}"
# Avant Traefik et cert-manager : cert-manager doit trouver les CRD à son démarrage.
kubectl apply --server-side -f \
  "https://github.com/kubernetes-sigs/gateway-api/releases/download/${GATEWAY_API_VERSION}/standard-install.yaml"
kubectl wait --for=condition=Established --timeout=60s \
  crd/gateways.gateway.networking.k8s.io crd/httproutes.gateway.networking.k8s.io
echo "::endgroup::"

echo "::group::Traefik ${TRAEFIK_CHART_VERSION}"
helm upgrade --install traefik traefik --repo https://traefik.github.io/charts \
  --version "$TRAEFIK_CHART_VERSION" --namespace traefik --create-namespace \
  -f k8s/platform/traefik-values.yaml --wait --timeout 5m
echo "::endgroup::"

echo "::group::cert-manager ${CERT_MANAGER_VERSION}"
helm upgrade --install cert-manager cert-manager --repo https://charts.jetstack.io \
  --version "$CERT_MANAGER_VERSION" --namespace cert-manager --create-namespace \
  -f k8s/platform/cert-manager-values.yaml --wait --timeout 5m
# shellcheck disable=SC2016 # variables volontairement non développées : envsubst les remplace
envsubst '${LETSENCRYPT_EMAIL}' < k8s/platform/cluster-issuers.yaml | kubectl apply -f -
echo "::endgroup::"

echo "::group::IP publique et DNS"
ip=""
for _ in $(seq 1 60); do
  ip=$(kubectl get svc traefik -n traefik -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2> /dev/null || true)
  [[ -n "$ip" ]] && break
  sleep 5
done
if [[ -z "$ip" ]]; then
  echo "Le load balancer de Traefik n'a pas reçu d'IP publique après 5 minutes." >&2
  exit 1
fi
echo "IP publique de Traefik : ${ip}"

# Let's Encrypt vérifie le domaine par HTTP : le nom DNS doit pointer vers la nouvelle IP.
for _ in $(seq 1 60); do
  resolved=$(getent ahostsv4 "$HOST" | awk 'NR==1 {print $1}' || true)
  if [[ "$resolved" == "$ip" ]]; then
    echo "${HOST} résout vers ${ip}."
    echo "::endgroup::"
    exit 0
  fi
  sleep 5
done
echo "${HOST} ne résout pas vers ${ip} après 5 minutes (résolu : ${resolved:-rien})." >&2
exit 1
