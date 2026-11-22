#!/usr/bin/env bash
#
# Configure et démarre le relais Sentry → validation des déploiements CircleCI.
#
# À lancer soi-même, dans un vrai terminal (les secrets sont saisis masqués et ne
# passent ni par l'historique du shell, ni par l'écran) :
#   ssh -t diaspomoney-server /root/Lab/scripts/configure-sentry-relay.sh
#
# Demande :
#   1. le secret de webhook CircleCI (CCIVWH_…), créé dans Organization Settings → Deploys
#   2. le Client Secret de l'intégration interne Sentry
# Les écrit dans /root/Lab/diaspomoney/.env (avec l'URL de validation), puis démarre le
# relais depuis le worktree de production et vérifie https://diaspomoney.fr/__hooks/health.
set -euo pipefail

ENV_FILE=/root/Lab/diaspomoney/.env
PROD_WT=/root/Lab/deploy/prod
VALIDATION_URL='https://circleci.com/api/v3/deploy/hooks/0cd6cbdc-890c-4f94-8189-ccb2978954c2/validate'

[[ -t 0 ]] || { echo "À lancer dans un terminal interactif : ssh -t diaspomoney-server $0" >&2; exit 1; }
[[ -f "$ENV_FILE" ]] || { echo "Fichier introuvable : $ENV_FILE" >&2; exit 1; }
[[ -f "$PROD_WT/docker-compose.yml" ]] || { echo "Worktree de production introuvable : $PROD_WT" >&2; exit 1; }

ask_secret() {
  local prompt=$1 pattern=$2 value
  while true; do
    # Tout ce qui s'affiche va sur stderr : seule la valeur sort sur stdout (capturée).
    read -rsp "$prompt : " value; echo >&2
    value=$(printf '%s' "$value" | tr -d '[:space:]')
    if [[ -z "$value" ]]; then echo "  Vide, recommencez." >&2; continue; fi
    if [[ -n "$pattern" && ! "$value" =~ $pattern ]]; then
      echo "  Format inattendu, recommencez (vérifiez que vous avez copié la bonne valeur)." >&2; continue
    fi
    printf '%s' "$value"; return
  done
}

echo "Relais Sentry → CircleCI : saisie des secrets (rien ne s'affiche pendant la frappe)."
CIRCLE_SECRET=$(ask_secret "1/2 Secret de webhook CircleCI (commence par CCIVWH_)" '^CCIVWH_')
SENTRY_SECRET=$(ask_secret "2/2 Client Secret de l'intégration Sentry" '^[0-9a-fA-F]{32,}$')

cp "$ENV_FILE" "$ENV_FILE.bak-relay-$(date +%F-%H%M%S)"
chmod 600 "$ENV_FILE".bak-relay-*

# Remplace les anciennes valeurs éventuelles, puis ajoute les nouvelles.
tmp=$(mktemp)
grep -vE '^(SENTRY_RELAY_CLIENT_SECRET|CIRCLECI_VALIDATION_URL|CIRCLECI_VALIDATION_SECRET)=' "$ENV_FILE" > "$tmp" || true
{
  cat "$tmp"
  echo ""
  echo "# Relais Sentry → validation CircleCI (configure-sentry-relay.sh, $(date +%F))"
  echo "SENTRY_RELAY_CLIENT_SECRET='${SENTRY_SECRET}'"
  echo "CIRCLECI_VALIDATION_URL='${VALIDATION_URL}'"
  echo "CIRCLECI_VALIDATION_SECRET='${CIRCLE_SECRET}'"
} > "$ENV_FILE"
rm -f "$tmp"
chmod 600 "$ENV_FILE"
unset CIRCLE_SECRET SENTRY_SECRET
echo "✓ Secrets enregistrés dans $ENV_FILE (sauvegarde précédente conservée à côté)."

cd "$PROD_WT"
docker compose -p diaspomoney --env-file "$ENV_FILE" up -d sentry-relay

echo "Vérification du relais…"
for _ in $(seq 1 20); do
  if curl -fsS https://diaspomoney.fr/__hooks/health 2>/dev/null | grep -q '"ok":true'; then
    echo "✓ Relais opérationnel : https://diaspomoney.fr/__hooks/health → ok"
    exit 0
  fi
  sleep 3
done
echo "✗ Le relais ne répond pas correctement. Journal :" >&2
docker logs --tail 20 diaspomoney-sentry-relay >&2 || true
exit 1
