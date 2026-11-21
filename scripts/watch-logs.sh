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

POD=$(kubectl get pod -n diaspomoney -l app=$APP -o name | head -n 1)

echo "📡 Logs du pod : $POD"
kubectl logs -f "$POD" -n diaspomoney
