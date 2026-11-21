#!/usr/bin/env bash
set -euo pipefail

ENVIRONMENT="${1:-rct}"
ENV_FILE="${ENV_FILE:-.env}"

case "$ENVIRONMENT" in
  dev | rct)
    SECRET_KEY_NAME="STRIPE_SECRET_KEY"
    PUBLISHABLE_KEY_NAME="NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
    EXPECTED_SECRET_PREFIX="sk_test_"
    EXPECTED_PUBLIC_PREFIX="pk_test_"
    SERVICE="app-${ENVIRONMENT}"
    ;;
  prod)
    SECRET_KEY_NAME="STRIPE_SECRET_KEY_PROD"
    PUBLISHABLE_KEY_NAME="NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_PROD"
    EXPECTED_SECRET_PREFIX="sk_live_"
    EXPECTED_PUBLIC_PREFIX="pk_live_"
    SERVICE="app-prod"
    ;;
  *)
    echo "Usage: $0 <dev|rct|prod>" >&2
    exit 1
    ;;
esac

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE. Copy .env.example to .env and fill Stripe values." >&2
  exit 1
fi

load_var() {
  local name="$1"
  local value

  value=$(grep -E "^${name}=" "$ENV_FILE" | tail -1 | cut -d '=' -f2- || true)
  value="${value%\"}"
  value="${value#\"}"
  value="${value%\'}"
  value="${value#\'}"

  printf '%s' "$value"
}

check_prefix() {
  local name="$1"
  local value="$2"
  local expected="$3"

  if [[ -z "$value" ]]; then
    echo "Missing $name in $ENV_FILE" >&2
    return 1
  fi

  if [[ "$value" != "$expected"* ]]; then
    echo "$name has an unexpected prefix. Expected $expected" >&2
    return 1
  fi

  echo "$name is present and has the expected prefix."
}

secret_key="$(load_var "$SECRET_KEY_NAME")"
publishable_key="$(load_var "$PUBLISHABLE_KEY_NAME")"

check_prefix "$SECRET_KEY_NAME" "$secret_key" "$EXPECTED_SECRET_PREFIX"
check_prefix "$PUBLISHABLE_KEY_NAME" "$publishable_key" "$EXPECTED_PUBLIC_PREFIX"

if docker compose ps --services --status running | grep -qx "$SERVICE"; then
  if docker compose exec -T "$SERVICE" printenv "$SECRET_KEY_NAME" >/dev/null 2>&1; then
    echo "$SERVICE exposes $SECRET_KEY_NAME at runtime."
  elif [[ "$ENVIRONMENT" == "prod" ]] && docker compose exec -T "$SERVICE" printenv STRIPE_SECRET_KEY >/dev/null 2>&1; then
    echo "$SERVICE exposes STRIPE_SECRET_KEY at runtime."
  else
    echo "$SERVICE is running but Stripe secret was not found in its environment." >&2
    echo "Run: ./scripts/deploy-compose.sh $ENVIRONMENT" >&2
    exit 1
  fi
else
  echo "$SERVICE is not running; .env validation only."
fi
