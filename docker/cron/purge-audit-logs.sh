#!/usr/bin/env sh
# Purge nocturne des journaux d'audit expirés, pour chaque environnement (dev, rct, prod).
#
# L'appel part de l'intérieur de chaque conteneur (http://127.0.0.1:3000) : il ne passe ni par
# Traefik ni par l'accès protégé de dev/rct, et le secret MAINTENANCE_CRON_SECRET reste dans
# l'environnement du conteneur (jamais sur une ligne de commande ni dans la crontab).
#
# Installation (une fois, sur le serveur) : voir docs/exploitation/taches-planifiees.md
#   30 3 * * * /root/Lab/diaspomoney/docker/cron/purge-audit-logs.sh >> /var/log/diaspomoney-purge-audit.log 2>&1

set -u

CONTAINERS="${PURGE_CONTAINERS:-diaspomoney-app-dev diaspomoney-app-rct diaspomoney-app-prod}"
status=0

for container in $CONTAINERS; do
  if [ "$(docker inspect -f '{{.State.Running}}' "$container" 2>/dev/null)" != "true" ]; then
    echo "$(date -Iseconds) $container : non démarré, ignoré"
    continue
  fi

  if output=$(docker exec "$container" node -e '
    fetch("http://127.0.0.1:3000/api/maintenance/purge-audit-logs", {
      method: "POST",
      headers: { authorization: "Bearer " + (process.env.MAINTENANCE_CRON_SECRET || "") },
    })
      .then(async (r) => { console.log(r.status, await r.text()); process.exit(r.ok ? 0 : 1); })
      .catch((e) => { console.log("erreur", e.message); process.exit(1); });
  ' 2>&1); then
    echo "$(date -Iseconds) $container : $output"
  else
    echo "$(date -Iseconds) $container : ÉCHEC $output"
    status=1
  fi
done

exit $status
