#!/usr/bin/env bash
set -euo pipefail

ENVIRONMENT="${1:-rct}"

case "$ENVIRONMENT" in
  dev | rct | prod)
    ;;
  *)
    echo "Usage: $0 <dev|rct|prod>" >&2
    exit 1
    ;;
esac

cat <<EOF
Stripe secrets are now managed by Docker Compose through the server-local .env file.

1. Edit .env and set the Stripe values for ${ENVIRONMENT}.
   - dev/rct: STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET
   - prod: STRIPE_SECRET_KEY_PROD, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_PROD, STRIPE_WEBHOOK_SECRET_PROD

2. Validate the configuration:
   ./scripts/check-stripe-secrets.sh ${ENVIRONMENT}

3. Rebuild and restart the target service:
   ./scripts/deploy-compose.sh ${ENVIRONMENT}

No Kubernetes secret or pod rollout is used anymore.
EOF
