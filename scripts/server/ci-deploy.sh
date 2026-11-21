#!/usr/bin/env bash
#
# Déploiement d'un environnement DiaspoMoney, déclenché par CircleCI.
#
# Installé sur le serveur dans /root/Lab/scripts/ci-deploy.sh et appelé par une clé SSH
# dédiée dont la ligne authorized_keys force cette commande :
#   command="/root/Lab/scripts/ci-deploy.sh",no-port-forwarding,no-X11-forwarding,no-agent-forwarding,no-pty ssh-ed25519 … circleci-deploy
# La clé ne peut donc rien faire d'autre que : deploy <dev|rct|prod> <sha de 40 caractères>
#
# Chaque environnement a son propre worktree (/root/Lab/deploy/<env>) sur le commit demandé,
# ce qui évite de changer de branche dans le checkout principal. Le build et le démarrage
# sont enchaînés immédiatement (le nettoyage Docker horaire supprime les images non utilisées).
set -euo pipefail

BASE=/root/Lab/diaspomoney          # checkout principal : contient .env (secrets)
DEPLOY_ROOT=/root/Lab/deploy
LOG=/root/Lab/scripts/ci-deploy.log
PROJECT=diaspomoney                 # nom du projet Docker Compose existant

log() { echo "[$(date '+%F %T')] $*" | tee -a "$LOG" >&2; }
die() { log "ERREUR : $*"; exit 1; }

# Commande reçue : via SSH (forced command) ou en argument pour un lancement manuel.
read -r action env sha extra <<< "${SSH_ORIGINAL_COMMAND:-$*}" || true
[[ "${action:-}" == "deploy" && -z "${extra:-}" ]] || die "usage : deploy <dev|rct|prod> <sha>"
case "${env:-}" in
  dev) branch=dev ;;
  rct) branch=rct ;;
  prod) branch=main ;;
  *) die "environnement inconnu : '${env:-}'" ;;
esac
[[ "${sha:-}" =~ ^[0-9a-f]{40}$ ]] || die "sha invalide : '${sha:-}'"

# Un seul déploiement à la fois.
exec 9>/var/lock/diaspomoney-deploy.lock
flock -w 1800 9 || die "un autre déploiement est en cours depuis plus de 30 min"

log "Déploiement $env ($branch) @ $sha"
git -C "$BASE" fetch --quiet origin "+refs/heads/$branch:refs/remotes/origin/$branch"
git -C "$BASE" merge-base --is-ancestor "$sha" "origin/$branch" \
  || die "le commit $sha n'appartient pas à la branche $branch"

wt="$DEPLOY_ROOT/$env"
mkdir -p "$DEPLOY_ROOT"
if [[ -d "$wt/.git" || -f "$wt/.git" ]]; then
  git -C "$wt" checkout --quiet --detach --force "$sha"
  git -C "$wt" clean -fdq
else
  git -C "$BASE" worktree add --quiet --detach "$wt" "$sha"
fi
ln -sfn "$BASE/.env" "$wt/.env"

cd "$wt"
service="app-$env"
container="diaspomoney-app-$env"

log "Build de l'image $env"
docker compose -p "$PROJECT" build "$service" >>"$LOG" 2>&1 || die "échec du build (voir $LOG)"
log "Démarrage de $container"
docker compose -p "$PROJECT" up -d --no-deps --no-build "$service" >>"$LOG" 2>&1 || die "échec du démarrage"

status=unknown
for _ in $(seq 1 60); do
  status=$(docker inspect -f '{{.State.Health.Status}}' "$container" 2>/dev/null || echo absent)
  [[ "$status" == healthy ]] && break
  sleep 5
done
[[ "$status" == healthy ]] || die "$container n'est pas sain après 5 min (état : $status)"

docker image prune -f >/dev/null 2>&1 || true   # images orphelines uniquement
log "OK : $env déployé @ ${sha:0:7}"
echo "deployed $env ${sha:0:7}"
