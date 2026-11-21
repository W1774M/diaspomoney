#!/usr/bin/env bash
set -euo pipefail

ENVIRONMENT="${1:-}"
NO_CACHE="${2:-}"

case "$ENVIRONMENT" in
  dev | rct | prod)
    SERVICE="app-${ENVIRONMENT}"
    ;;
  all)
    SERVICE=""
    ;;
  *)
    echo "Usage: $0 <dev|rct|prod|all> [--no-cache]" >&2
    exit 1
    ;;
esac

BUILD_ARGS=()
if [[ "$NO_CACHE" == "--no-cache" || "$NO_CACHE" == "no-cache" ]]; then
  BUILD_ARGS+=(--no-cache)
fi

docker compose config --quiet

if [[ -n "$SERVICE" ]]; then
  docker compose build "${BUILD_ARGS[@]}" "$SERVICE"
  docker compose up -d --no-deps "$SERVICE"
  docker compose ps "$SERVICE"
else
  docker compose build "${BUILD_ARGS[@]}" app-dev app-rct app-prod
  docker compose up -d
  docker compose ps
fi
