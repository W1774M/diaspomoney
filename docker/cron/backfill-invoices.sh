#!/usr/bin/env sh
# Rattrapage ponctuel des factures des réservations payées sans facture.
#
# Dry-run par défaut : affiche ce qui serait fait, n'écrit rien.
#   ./backfill-invoices.sh diaspomoney-app-prod
#   ./backfill-invoices.sh diaspomoney-app-prod --apply
#
# Comme purge-audit-logs.sh, l'appel part de l'intérieur du conteneur
# (http://127.0.0.1:3000) : le secret MAINTENANCE_CRON_SECRET reste dans son
# environnement. Idempotent : relançable sans créer de doublon.

set -u

container="${1:-}"
mode="${2:-}"

if [ -z "$container" ]; then
  echo "Usage : $0 <conteneur> [--apply]" >&2
  exit 2
fi

query=""
if [ "$mode" = "--apply" ]; then
  query="?apply=1"
elif [ -n "$mode" ]; then
  echo "Option inconnue : $mode (attendu : --apply)" >&2
  exit 2
fi

if [ "$(docker inspect -f '{{.State.Running}}' "$container" 2>/dev/null)" != "true" ]; then
  echo "$container : non démarré" >&2
  exit 1
fi

docker exec -e BACKFILL_QUERY="$query" "$container" node -e '
  fetch("http://127.0.0.1:3000/api/maintenance/backfill-invoices" + (process.env.BACKFILL_QUERY || ""), {
    method: "POST",
    headers: { authorization: "Bearer " + (process.env.MAINTENANCE_CRON_SECRET || "") },
  })
    .then(async (r) => {
      const text = await r.text();
      try { console.log(r.status, JSON.stringify(JSON.parse(text), null, 2)); }
      catch { console.log(r.status, text.slice(0, 500)); }
      process.exit(r.ok ? 0 : 1);
    })
    .catch((e) => { console.log("erreur", e.message); process.exit(1); });
'
