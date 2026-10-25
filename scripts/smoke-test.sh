#!/usr/bin/env bash
# Tests de fumée depuis l'extérieur du cluster, comme un visiteur.
#
# Variables requises : HOST. Optionnelle : INSECURE=true pour un certificat Let's Encrypt « staging »
# (non reconnu par les navigateurs, donc non vérifiable).
set -euo pipefail

: "${HOST:?HOST manquant}"

opts=(-sS --max-time 15 --retry 10 --retry-delay 6 --retry-all-errors)
[[ "${INSECURE:-false}" == "true" ]] && opts+=(--insecure)

failures=0
check() {
  local label=$1 expected=$2 actual=$3
  if [[ "$actual" == "$expected" ]]; then
    echo "OK    ${label} : ${actual}"
  else
    echo "ÉCHEC ${label} : attendu ${expected}, obtenu ${actual}" >&2
    failures=$((failures + 1))
  fi
}

page=$(mktemp)
trap 'rm -f "$page"' EXIT

# Juste après l'émission d'un certificat, Traefik met quelques secondes à charger les routes HTTPS
# et répond 404 en attendant. On réessaie donc jusqu'au code attendu (2 minutes au plus).
status_until() {
  local expected=$1 url=$2 output=${3:-/dev/null} code=""
  for _ in $(seq 1 24); do
    code=$(curl "${opts[@]}" -o "$output" -w '%{http_code}' "$url" || true)
    [[ "$code" == "$expected" ]] && break
    sleep 5
  done
  echo "$code"
}

code=$(status_until 200 "https://${HOST}/" "$page")
check "Accueil (https)" 200 "$code"
if grep -q "GlycoSuivi" "$page"; then echo "OK    Page servie par l'application"; else
  echo "ÉCHEC La page d'accueil ne contient pas « GlycoSuivi »" >&2
  failures=$((failures + 1))
fi

code=$(status_until 200 "https://${HOST}/historique")
check "Route Angular /historique" 200 "$code"

# L'API répond et protège ses routes (la santé interne est couverte par la readiness probe).
code=$(status_until 401 "https://${HOST}/api/readings")
check "API protégée /api/readings" 401 "$code"

redirect=$(curl -sS --max-time 15 -o /dev/null -w '%{http_code} %{redirect_url}' "http://${HOST}/")
check "Redirection http vers https" "301 https://${HOST}/" "$redirect"

if [[ "${INSECURE:-false}" != "true" ]]; then
  echo | openssl s_client -connect "${HOST}:443" -servername "$HOST" 2> /dev/null \
    | openssl x509 -noout -issuer -enddate
fi

if ((failures > 0)); then
  echo "${failures} test(s) de fumée en échec." >&2
  exit 1
fi
echo "Tous les tests de fumée sont passés."
