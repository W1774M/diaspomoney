#!/usr/bin/env sh
# Nettoyage ponctuel des réservations au prestataire fictif (identifiant de service ou
# « admin-draft » à la place d'un prestataire, voir #102), dans UN conteneur.
#
#   sh docker/cron/clear-fake-provider-ids.sh diaspomoney-app-prod            # dry-run
#   sh docker/cron/clear-fake-provider-ids.sh diaspomoney-app-prod --apply    # écrit
#
# L'appel part de l'intérieur du conteneur (http://127.0.0.1:3000) ; le secret
# MAINTENANCE_CRON_SECRET reste dans l'environnement du conteneur.

set -u

container="${1:?usage : $0 <conteneur> [--apply]}"
query=""
[ "${2:-}" = "--apply" ] && query="?apply=1"

docker exec -e QUERY="$query" "$container" node -e '
  fetch("http://127.0.0.1:3000/api/maintenance/clear-fake-provider-ids" + (process.env.QUERY || ""), {
    method: "POST",
    headers: { authorization: "Bearer " + (process.env.MAINTENANCE_CRON_SECRET || "") },
  })
    .then(async (r) => { console.log(r.status, await r.text()); process.exit(r.ok ? 0 : 1); })
    .catch((e) => { console.log("erreur", e.message); process.exit(1); });
'
