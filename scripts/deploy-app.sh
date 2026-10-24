#!/usr/bin/env bash
# Rend les manifestes de l'application (Kustomize + envsubst), les applique et attend le déploiement.
#
# Variables requises : IMAGE_TAG, HOST, CLUSTER_ISSUER, API_CLIENT_ID, KEYVAULT_NAME, TENANT_ID.
set -euo pipefail

for var in IMAGE_TAG HOST CLUSTER_ISSUER API_CLIENT_ID KEYVAULT_NAME TENANT_ID; do
  : "${!var:?${var} manquant}"
done

cd "$(dirname "$0")/.."

rendered=$(mktemp)
trap 'rm -f "$rendered"' EXIT

# shellcheck disable=SC2016 # variables volontairement non développées : envsubst les remplace
readonly VARIABLES='${IMAGE_TAG} ${HOST} ${CLUSTER_ISSUER} ${API_CLIENT_ID} ${KEYVAULT_NAME} ${TENANT_ID}'
kubectl kustomize k8s/app | envsubst "$VARIABLES" > "$rendered"

# shellcheck disable=SC2016 # on cherche le texte littéral ${ (variable oubliée)
if grep -n '\${' "$rendered"; then
  echo "Variable non remplacée dans les manifestes." >&2
  exit 1
fi

kubectl apply -f "$rendered"

echo "Attente du déploiement de ${IMAGE_TAG}..."
kubectl rollout status deployment/web -n glycosuivi --timeout=5m
kubectl rollout status deployment/api -n glycosuivi --timeout=6m
