#!/bin/bash

ENV="$1"

case "$ENV" in
  dev) APP="diaspomoney-dev" ;;
  rct) APP="diaspomoney-rct" ;;
  prod) APP="diaspomoney-prod" ;;
  *)
    echo "Usage: $0 {dev|rct|prod}"
    exit 1
    ;;
esac

kubectl rollout undo deployment/$APP -n diaspomoney
