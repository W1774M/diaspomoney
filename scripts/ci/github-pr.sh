#!/usr/bin/env bash
#
# Gestion des pull requests de promotion depuis CircleCI (API GitHub, jeton GITHUB_TOKEN).
#
#   github-pr.sh open  <head> <base>          ouvre la PR head → base si aucune n'est ouverte
#   github-pr.sh merge <head> <base> <sha>    fusionne la PR head → base, uniquement si son
#                                             dernier commit est <sha> (celui qui a été validé).
#                                             Si <head> a avancé depuis (promotion plus récente),
#                                             ou si <base> contient déjà <sha> : rien n'est
#                                             fusionné et le job reste vert.
#
# La fusion respecte la protection de branche : GitHub refuse si les checks requis échouent.
set -euo pipefail

: "${GITHUB_TOKEN:?GITHUB_TOKEN manquant (variable du projet CircleCI)}"
OWNER="${CIRCLE_PROJECT_USERNAME:?}"
REPO="${CIRCLE_PROJECT_REPONAME:?}"
API="https://api.github.com/repos/$OWNER/$REPO"

gh_api() {
  local method=$1 path=$2 data=${3:-}
  curl -sS -X "$method" "$API$path" \
    -H "Authorization: Bearer $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github+json" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    ${data:+-d "$data"} \
    -w '\n%{http_code}'
}

# Numéro de la PR ouverte head → base (vide si aucune).
find_pr() {
  local head=$1 base=$2
  gh_api GET "/pulls?state=open&head=$OWNER:$head&base=$base" | sed '$d' \
    | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{const p=JSON.parse(d);console.log(p[0]?p[0].number:"")})'
}

action=${1:-}; head=${2:-}; base=${3:-}
[[ -n "$head" && -n "$base" ]] || { echo "usage : $0 open|merge <head> <base> [sha]" >&2; exit 2; }

case "$action" in
  open)
    number=$(find_pr "$head" "$base")
    if [[ -n "$number" ]]; then
      echo "PR #$number déjà ouverte ($head → $base) : https://github.com/$OWNER/$REPO/pull/$number"
      exit 0
    fi
    body=$(node -e 'console.log(JSON.stringify({
      title: `Promotion ${process.argv[1]} → ${process.argv[2]}`,
      head: process.argv[1], base: process.argv[2],
      body: `PR ouverte automatiquement par CircleCI après le déploiement de **${process.argv[1]}**.\n\nCommit : ${process.argv[3]}\nPipeline : ${process.argv[4]}`,
    }))' "$head" "$base" "${CIRCLE_SHA1:-}" "${CIRCLE_BUILD_URL:-}")
    response=$(gh_api POST /pulls "$body")
    code=$(tail -n1 <<<"$response")
    if [[ "$code" == 422 ]] && grep -q "No commits between" <<<"$response"; then
      echo "Rien à promouvoir : $base contient déjà $head."
      exit 0
    fi
    [[ "$code" == 201 ]] || { echo "Création de la PR refusée ($code) :" >&2; sed '$d' <<<"$response" >&2; exit 1; }
    sed '$d' <<<"$response" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{const p=JSON.parse(d);console.log(`PR #${p.number} ouverte : ${p.html_url}`)})'
    ;;
  merge)
    sha=${4:?sha du commit validé requis}
    number=$(find_pr "$head" "$base")
    if [[ -z "$number" ]]; then
      # Une promotion plus récente a déjà fusionné la PR en emportant ce commit : rien à faire.
      status=$(gh_api GET "/compare/$base...$sha" | sed '$d' \
        | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{try{console.log(JSON.parse(d).status||"")}catch{console.log("")}})')
      if [[ "$status" == behind || "$status" == identical ]]; then
        echo "Déjà promu : $base contient déjà $sha (fusionné par une promotion plus récente)."
        exit 0
      fi
      echo "Aucune PR ouverte $head → $base." >&2
      exit 1
    fi
    # La PR doit pointer sur le commit validé. Si $head a avancé depuis (nouvelle promotion),
    # cette validation est caduque : ne rien fusionner, sans faire échouer le pipeline.
    current=$(gh_api GET "/pulls/$number" | sed '$d' \
      | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{try{console.log(JSON.parse(d).head.sha||"")}catch{console.log("")}})')
    if [[ -n "$current" && "$current" != "$sha" ]]; then
      echo "Promotion remplacée par une plus récente : la PR #$number pointe maintenant sur $current (validé ici : $sha)."
      echo "Rien n'est fusionné. Valider le pipeline $head du commit $current pour promouvoir."
      exit 0
    fi
    body=$(node -e 'console.log(JSON.stringify({merge_method:"merge",sha:process.argv[1],commit_title:`Promotion ${process.argv[2]} → ${process.argv[3]} (validée dans CircleCI)`}))' "$sha" "$head" "$base")
    response=$(gh_api PUT "/pulls/$number/merge" "$body")
    code=$(tail -n1 <<<"$response")
    [[ "$code" == 200 ]] || { echo "Fusion refusée ($code) :" >&2; sed '$d' <<<"$response" >&2; exit 1; }
    echo "PR #$number fusionnée : $head → $base"
    ;;
  *)
    echo "action inconnue : $action" >&2; exit 2 ;;
esac
