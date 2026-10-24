#!/usr/bin/env bash
# Autorise ou retire l'IP de sortie du cluster AKS dans la liste d'accès du projet MongoDB Atlas.
#
#   scripts/atlas-access.sh add <ipv4>   ajoute l'IP (expiration automatique après 24 h), attend qu'elle soit active
#   scripts/atlas-access.sh remove       retire toutes les entrées créées par ce script (idempotent)
#
# Variables requises : ATLAS_CLIENT_ID, ATLAS_CLIENT_SECRET (compte de service), ATLAS_PROJECT_ID.
# Rôle Atlas requis pour le compte de service, sur le projet : Project Network Access Manager
# (GROUP_NETWORK_ACCESS_MANAGER), le plus restreint qui permet de gérer la liste d'accès IP.
set -euo pipefail

: "${ATLAS_CLIENT_ID:?ATLAS_CLIENT_ID manquant}"
: "${ATLAS_CLIENT_SECRET:?ATLAS_CLIENT_SECRET manquant}"
: "${ATLAS_PROJECT_ID:?ATLAS_PROJECT_ID manquant}"

readonly BASE_URL="https://cloud.mongodb.com"
readonly API="${BASE_URL}/api/atlas/v2/groups/${ATLAS_PROJECT_ID}"
readonly ACCEPT="Accept: application/vnd.atlas.2023-01-01+json"
readonly COMMENT="aks-glycosuivi (GitHub Actions)"

# Jeton OAuth2 (client credentials, valable 1 h). Les identifiants passent par stdin, pas par la ligne de commande.
get_token() {
  local token
  token=$(printf 'user = "%s:%s"\n' "$ATLAS_CLIENT_ID" "$ATLAS_CLIENT_SECRET" \
    | curl -fsS -K - -X POST "${BASE_URL}/api/oauth/token" \
        -H "Accept: application/json" \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d grant_type=client_credentials \
    | jq -r '.access_token')
  if [[ -z "$token" || "$token" == "null" ]]; then
    echo "Impossible d'obtenir un jeton Atlas (identifiants du compte de service ?)" >&2
    exit 1
  fi
  printf '%s' "$token"
}

# Appel de l'API d'administration : affiche le corps, échoue avec un message clair si le code HTTP n'est pas 2xx.
api() {
  local method=$1 path=$2 body=${3:-}
  local response code
  local data=()
  [[ -n "$body" ]] && data=(--data "$body")
  response=$(mktemp)
  code=$(curl -sS -o "$response" -w '%{http_code}' -X "$method" "${API}${path}" \
    -H "Authorization: Bearer ${TOKEN}" -H "$ACCEPT" -H "Content-Type: application/json" \
    "${data[@]}")
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

TOKEN=$(get_token)
# Masqué dans les logs GitHub Actions (la commande doit être émise sur la sortie standard du script).
[[ -n "${GITHUB_ACTIONS:-}" ]] && echo "::add-mask::${TOKEN}"

case "${1:-}" in
  add) add "${2:?Usage : $0 add <ipv4>}" ;;
  remove) remove ;;
  *)
    echo "Usage : $0 add <ipv4> | remove" >&2
    exit 2
    ;;
esac
