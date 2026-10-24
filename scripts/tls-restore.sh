#!/usr/bin/env bash
# Restaure le certificat TLS sauvegardé par tls-backup.sh, s'il correspond à l'émetteur demandé
# et reste valide au moins 7 jours. Sinon, ne fait rien : cert-manager émettra un nouveau certificat.
#
# Variables requises : KEYVAULT_NAME, CLUSTER_ISSUER. Optionnelle : NAMESPACE (défaut glycosuivi).
set -euo pipefail

: "${KEYVAULT_NAME:?KEYVAULT_NAME manquant}"
: "${CLUSTER_ISSUER:?CLUSTER_ISSUER manquant}"
readonly NAMESPACE="${NAMESPACE:-glycosuivi}"
readonly BACKUP="tls-backup"
readonly MIN_VALIDITY=$((7 * 24 * 3600))

if ! issuer=$(az keyvault secret show --vault-name "$KEYVAULT_NAME" --name "$BACKUP" \
  --query 'tags.issuer' -o tsv 2> /dev/null); then
  echo "Aucune sauvegarde de certificat : cert-manager en émettra un nouveau."
  exit 0
fi

if [[ "$issuer" != "$CLUSTER_ISSUER" ]]; then
  echo "Sauvegarde émise par ${issuer}, émetteur demandé ${CLUSTER_ISSUER} : pas de restauration."
  exit 0
fi

umask 077
file=$(mktemp)
trap 'rm -f "$file"' EXIT

az keyvault secret show --vault-name "$KEYVAULT_NAME" --name "$BACKUP" --query value -o tsv > "$file"

if ! jq -r '.data["tls.crt"]' "$file" | base64 -d \
  | openssl x509 -noout -checkend "$MIN_VALIDITY" > /dev/null 2>&1; then
  echo "Certificat sauvegardé expirant dans moins de 7 jours : pas de restauration."
  exit 0
fi

jq --arg ns "$NAMESPACE" '.metadata.namespace = $ns' "$file" | kubectl apply -f - > /dev/null
echo "Certificat restauré depuis Key Vault (émetteur ${issuer}) : pas de nouvelle demande à Let's Encrypt."
