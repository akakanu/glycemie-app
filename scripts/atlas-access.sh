#!/usr/bin/env bash
# Autorise ou retire l'IP de sortie du cluster AKS dans la liste d'accès du projet MongoDB Atlas.
#
#   scripts/atlas-access.sh add <ipv4>   ajoute l'IP (expiration automatique après 24 h), attend qu'elle soit active
#   scripts/atlas-access.sh remove       retire toutes les entrées créées par ce script (idempotent)
#
# Variables requises : ATLAS_PUBLIC_KEY, ATLAS_PRIVATE_KEY (clé API de projet), ATLAS_PROJECT_ID.
# Rôle de la clé API, sur le projet : Project Network Access Manager (GROUP_NETWORK_ACCESS_MANAGER),
# le plus restreint qui permet de gérer la liste d'accès IP.
set -euo pipefail

: "${ATLAS_PUBLIC_KEY:?ATLAS_PUBLIC_KEY manquant}"
: "${ATLAS_PRIVATE_KEY:?ATLAS_PRIVATE_KEY manquant}"
: "${ATLAS_PROJECT_ID:?ATLAS_PROJECT_ID manquant}"

readonly API="https://cloud.mongodb.com/api/atlas/v2/groups/${ATLAS_PROJECT_ID}"
readonly ACCEPT="Accept: application/vnd.atlas.2023-01-01+json"
readonly COMMENT="aks-glycosuivi (GitHub Actions)"

# Appel de l'API d'administration (authentification HTTP Digest des clés API).
# Les clés passent par stdin (-K -) : elles n'apparaissent jamais sur la ligne de commande.
# Affiche le corps, échoue avec un message clair si le code HTTP n'est pas 2xx.
api() {
  local method=$1 path=$2 body=${3:-}
  local response code
  local data=()
  [[ -n "$body" ]] && data=(--data "$body")
  response=$(mktemp)
  code=$(printf 'user = "%s:%s"\n' "$ATLAS_PUBLIC_KEY" "$ATLAS_PRIVATE_KEY" \
    | curl -sS --digest -K - -o "$response" -w '%{http_code}' -X "$method" "${API}${path}" \
        -H "$ACCEPT" -H "Content-Type: application/json" "${data[@]}")
  if [[ "$code" != 2* ]]; then
    echo "Atlas ${method} ${path} : HTTP ${code}" >&2
    jq -r '.detail // .reason // .' "$response" >&2 || cat "$response" >&2
    rm -f "$response"
    return 1
  fi
  cat "$response"
  rm -f "$response"
}

add() {
  local ip=$1
  if [[ ! "$ip" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ ]]; then
    echo "Adresse IPv4 invalide : '${ip}'" >&2
    exit 1
  fi

  # Expiration automatique : même si env-down n'est jamais lancé, l'accès disparaît après 24 h.
  local delete_after body status
  delete_after=$(date -u -d '+24 hours' +%Y-%m-%dT%H:%M:%SZ)
  body=$(jq -nc --arg ip "$ip" --arg c "$COMMENT" --arg d "$delete_after" \
    '[{ipAddress: $ip, comment: $c, deleteAfterDate: $d}]')

  api POST "/accessList" "$body" > /dev/null
  echo "IP ${ip} ajoutée à la liste d'accès Atlas (expire le ${delete_after})."

  # La propagation dans Atlas prend de quelques secondes à quelques minutes.
  for _ in $(seq 1 36); do
    status=$(api GET "/accessList/${ip}/status" | jq -r '.STATUS // .status // empty')
    if [[ "$status" == "ACTIVE" ]]; then
      echo "Entrée active dans Atlas."
      return 0
    fi
    sleep 5
  done
  echo "L'entrée n'est pas devenue active dans Atlas après 3 minutes (statut : ${status:-inconnu})." >&2
  exit 1
}

remove() {
  local entries
  entries=$(api GET "/accessList?itemsPerPage=500" \
    | jq -r --arg c "$COMMENT" '.results[] | select(.comment == $c) | (.ipAddress // .cidrBlock)')
  if [[ -z "$entries" ]]; then
    echo "Aucune entrée Atlas à retirer."
    return 0
  fi
  while read -r entry; do
    api DELETE "/accessList/${entry//\//%2F}" > /dev/null
    echo "Entrée Atlas retirée : ${entry}"
  done <<< "$entries"
}

case "${1:-}" in
  add) add "${2:?Usage : $0 add <ipv4>}" ;;
  remove) remove ;;
  *)
    echo "Usage : $0 add <ipv4> | remove" >&2
    exit 2
    ;;
esac
