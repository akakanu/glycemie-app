#!/usr/bin/env bash
# Sauvegarde le certificat TLS (Secret glycosuivi-tls) dans Key Vault avant la destruction du cluster.
# But : ne pas redemander un certificat à Let's Encrypt à chaque session (limite : 5 identiques par semaine).
#
# Variables requises : KEYVAULT_NAME. Optionnelle : NAMESPACE (défaut glycosuivi).
set -euo pipefail

: "${KEYVAULT_NAME:?KEYVAULT_NAME manquant}"
readonly NAMESPACE="${NAMESPACE:-glycosuivi}"
readonly SECRET="glycosuivi-tls"
readonly BACKUP="tls-backup"
readonly MIN_VALIDITY=$((7 * 24 * 3600))

if ! kubectl get secret "$SECRET" -n "$NAMESPACE" > /dev/null 2>&1; then
  echo "Pas de certificat ${SECRET} dans le cluster : rien à sauvegarder."
  exit 0
fi

crt=$(kubectl get secret "$SECRET" -n "$NAMESPACE" -o jsonpath='{.data.tls\.crt}' | base64 -d || true)
if [[ -z "$crt" ]]; then
  echo "Le Secret ${SECRET} ne contient pas de certificat (tls.crt vide) : pas de sauvegarde."
  exit 0
fi
if ! not_after=$(openssl x509 -noout -enddate <<< "$crt" 2> /dev/null); then
  echo "Certificat illisible par openssl : pas de sauvegarde."
  exit 0
fi
echo "Certificat lu : ${not_after}"
if ! openssl x509 -noout -checkend "$MIN_VALIDITY" <<< "$crt" > /dev/null; then
  echo "Certificat expirant dans moins de 7 jours : pas de sauvegarde."
  exit 0
fi

issuer=$(kubectl get secret "$SECRET" -n "$NAMESPACE" -o jsonpath='{.metadata.annotations.cert-manager\.io/issuer-name}')

umask 077
file=$(mktemp)
trap 'rm -f "$file"' EXIT

# On garde les labels et les annotations cert-manager : sans eux, cert-manager ne reconnaîtrait pas
# le Secret restauré et redemanderait un certificat.
kubectl get secret "$SECRET" -n "$NAMESPACE" -o json | jq '{
  apiVersion, kind, type,
  metadata: {
    name: .metadata.name,
    labels: (.metadata.labels // {}),
    annotations: ((.metadata.annotations // {}) | with_entries(select(.key | startswith("cert-manager.io/"))))
  },
  data
}' > "$file"

az keyvault secret set --vault-name "$KEYVAULT_NAME" --name "$BACKUP" \
  --file "$file" --encoding utf-8 --tags "issuer=${issuer}" --output none

echo "Certificat sauvegardé dans Key Vault (${BACKUP}, émetteur ${issuer})."
