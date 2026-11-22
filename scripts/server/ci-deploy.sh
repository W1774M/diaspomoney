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
#
# Image prod pré-construite : après un déploiement rct réussi, le script construit en
# arrière-plan l'image prod du même code (diaspomoney:prod-candidate). Next.js grave au build
# les URL et la clé Stripe publique, d'où une image par environnement. L'image porte le label
# fr.diaspomoney.candidate = <arbre git>-<empreinte du .env> ; le nettoyage horaire
# (scripts/server/docker-cleanup.sh) l'épargne. Au déploiement prod, si l'arbre du commit
# main et le .env sont identiques, l'image est simplement renommée diaspomoney:prod :
# pas de build, la prod démarre en quelques secondes. Sinon, build normal.
# La pré-construction garde le verrou de déploiement : un déploiement suivant l'attend.
set -euo pipefail

BASE=/root/Lab/diaspomoney          # checkout principal : contient .env (secrets)
DEPLOY_ROOT=/root/Lab/deploy
LOG=/root/Lab/scripts/ci-deploy.log
PROJECT=diaspomoney                 # nom du projet Docker Compose existant
PROD_IMAGE=diaspomoney:prod         # image du service app-prod (docker-compose.yml)
CANDIDATE_IMAGE=diaspomoney:prod-candidate
CANDIDATE_LABEL=fr.diaspomoney.candidate

log() { echo "[$(date '+%F %T')] $*" | tee -a "$LOG" >&2; }
die() { log "ERREUR : $*"; exit 1; }

# Identité d'une image prod : code exact (arbre git du worktree) + .env utilisé au build.
candidate_key() { echo "$(git -C "$1" rev-parse 'HEAD^{tree}')-$(sha256sum "$BASE/.env" | cut -c1-16)"; }
candidate_label() {
  docker image inspect -f "{{ index .Config.Labels \"$CANDIDATE_LABEL\" }}" "$CANDIDATE_IMAGE" 2>/dev/null || true
}

# Construit l'image prod du code présent dans le worktree $1, sans toucher diaspomoney:prod
# ni le conteneur de production (nom d'image remplacé par un fichier compose d'appoint).
prebuild_prod() {
  local wt=$1 key override
  key=$(candidate_key "$wt")
  if [[ "$(candidate_label)" == "$key" ]]; then
    log "Image prod pré-construite déjà à jour ($key)"
    return 0
  fi
  override=$(mktemp)
  cat >"$override" <<EOF
services:
  app-prod:
    image: $CANDIDATE_IMAGE
    build:
      labels:
        $CANDIDATE_LABEL: "$key"
EOF
  log "Pré-construction de l'image prod ($key)"
  if (cd "$wt" && docker compose -p "$PROJECT" -f docker-compose.yml -f "$override" build app-prod) >>"$LOG" 2>&1; then
    log "OK : image prod pré-construite ($key)"
  else
    log "AVERTISSEMENT : pré-construction prod échouée, la prod sera construite à son déploiement"
  fi
  rm -f "$override"
  docker image prune -f >/dev/null 2>&1 || true   # ancienne image candidate devenue orpheline
}

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
# Copie réelle (pas un lien) : un lien vers l'extérieur du contexte de build est
# embarqué cassé dans l'image Docker et next build échoue (ENOENT /app/.env).
rm -f "$wt/.env"
install -m 600 "$BASE/.env" "$wt/.env"

cd "$wt"
service="app-$env"
container="diaspomoney-app-$env"

if [[ "$env" == prod && "$(candidate_label)" == "$(candidate_key "$wt")" ]]; then
  log "Image prod pré-construite pendant le déploiement rct : pas de build"
  docker tag "$CANDIDATE_IMAGE" "$PROD_IMAGE"
  docker rmi "$CANDIDATE_IMAGE" >/dev/null   # retire seulement le nom, l'image reste diaspomoney:prod
else
  log "Build de l'image $env"
  docker compose -p "$PROJECT" build "$service" >>"$LOG" 2>&1 || die "échec du build (voir $LOG)"
fi
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

# rct validée : préparer l'image prod du même code en arrière-plan. Le sous-shell hérite du
# descripteur 9, donc du verrou, jusqu'à la fin du build ; ses sorties ne passent pas par SSH,
# ce qui laisse le job CircleCI se terminer tout de suite.
if [[ "$env" == rct ]]; then
  ( trap '' HUP; prebuild_prod "$wt" ) </dev/null >/dev/null 2>&1 &
  log "Pré-construction de l'image prod lancée en arrière-plan"
fi
echo "deployed $env ${sha:0:7}"
