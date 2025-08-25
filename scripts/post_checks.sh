#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost}"
AUTH="${ADMIN_AUTH}"   # format "user:pass" si BasicAuth activée
CURL_AUTH=()
if [[ -n "${AUTH}" ]]; then
  CURL_AUTH=(-u "${AUTH}")
fi

green() { printf "\033[32m%s\033[0m\n" "$*"; }
red()   { printf "\033[31m%s\033[0m\n" "$*"; }

check() {
  local name="$1" path="$2" expect="${3:-200}"
  local code
  code=$(curl -ksS -o /dev/null -w "%{http_code}" "${CURL_AUTH[@]}" "${BASE_URL}${path}") || code="000"
  if [[ "${code}" == "${expect}" ]]; then
    green "OK  ${name} -> ${BASE_URL}${path} [${code}]"
  else
    red  "KO  ${name} -> ${BASE_URL}${path} [${code}]"
    return 1
  fi
}

headers() {
  local path="$1"
  curl -ksS -D - "${CURL_AUTH[@]}" -o /dev/null "${BASE_URL}${path}" | awk 'BEGIN{print "---- headers ----"} {print} END{print "-----------------"}'
}

echo "Base URL: ${BASE_URL}"
[[ -n "${AUTH}" ]] && echo "Using BasicAuth"

# Routers exposés via Traefik
check "Traefik dashboard" "/traefik/"
check "Grafana" "/grafana/"
check "Prometheus" "/prometheus/graph"

# Endpoints de santé
check "Prometheus ready" "/prometheus/-/ready" 200
check "Prometheus healthy" "/prometheus/-/healthy" 200

# Metrics Traefik (directement via réseau interne si routé)
# Si metrics n'est pas routé par Traefik (recommandé), teste depuis un conteneur Prometheus.
echo "Tip: Traefik metrics sur :9100/metrics (réseau interne)."

# Vérif en-têtes sécurité (échantillon)
headers "/grafana/"

echo "Post-checks terminés."

