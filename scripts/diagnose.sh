#!/usr/bin/env bash
# Affiche l'état du cluster pour diagnostiquer un échec de déploiement. Ne modifie rien.
set -uo pipefail

section() { echo "::group::$1"; shift; "$@" 2>&1; echo "::endgroup::"; }

section "Pods (tous les namespaces)" kubectl get pods -A -o wide
section "Gateway, routes et certificats" kubectl get gateway,httproute,certificate,certificaterequest,order,challenge -A
section "Pods de l'application" kubectl describe pods -n glycosuivi
section "Logs de l'API (50 dernières lignes)" kubectl logs deployment/api -n glycosuivi --tail=50 --all-containers
section "Certificat" kubectl describe certificate glycosuivi-tls -n glycosuivi
section "Gateway" kubectl describe gateway glycosuivi -n glycosuivi
section "Événements récents" kubectl get events -A --sort-by=.lastTimestamp
