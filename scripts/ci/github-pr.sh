#!/usr/bin/env bash
#
# Gestion des pull requests de promotion depuis CircleCI (API GitHub, jeton GITHUB_TOKEN).
#
#   github-pr.sh open  <head> <base>          ouvre la PR head → base si aucune n'est ouverte
#   github-pr.sh merge <head> <base> <sha>    promeut le commit validé <sha> de head vers base.
#                                             Une validation = une promotion : seul <sha> part,
#                                             et seulement si tout ce qui le précède est déjà
#                                             dans <base> (sinon refus, avec la liste des
#                                             promotions non validées). Si <head> a avancé
#                                             depuis, <sha> passe par une branche temporaire
#                                             promotion/<head>-<sha> et sa propre PR.
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

# Évalue une expression JS sur le JSON lu en entrée (variable d) ; vide si illisible.
json() {
  node -e 'let s="";process.stdin.on("data",c=>s+=c).on("end",()=>{let d;try{d=JSON.parse(s)}catch{d={}};let v;try{v=eval(process.argv[1])}catch{v=""};console.log(v??"")})' "$1"
}

# <base> contient-il déjà le commit <sha> ?
contains() {
  local base=$1 sha=$2 status
  status=$(gh_api GET "/compare/$base...$sha" | sed '$d' | json 'd.status||""')
  [[ "$status" == behind || "$status" == identical ]]
}

# Fusionne la PR <numéro> au commit <sha> exact.
merge_pr() {
  local number=$1 sha=$2 title=$3 body response code
  body=$(node -e 'console.log(JSON.stringify({merge_method:"merge",sha:process.argv[1],commit_title:process.argv[2]}))' "$sha" "$title")
  response=$(gh_api PUT "/pulls/$number/merge" "$body")
  code=$(tail -n1 <<<"$response")
  [[ "$code" == 200 ]] || { echo "Fusion refusée ($code) :" >&2; sed '$d' <<<"$response" >&2; exit 1; }
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
    # Une validation = une promotion. Le commit validé <sha> est une fusion dev → <head> ;
    # tout ce qui le précède sur <head> doit déjà être dans <base>, sinon on refuse :
    # une promotion non validée ne part jamais en production avec une autre.
    sha=${4:?sha du commit validé requis}
    short=${sha:0:7}

    if contains "$base" "$sha"; then
      echo "❌ $short est déjà dans $base : il y est parti avec une autre promotion. Rien n'est fusionné." >&2
      exit 1
    fi

    parent=$(gh_api GET "/commits/$sha" | sed '$d' | json 'd.parents && d.parents[0] ? d.parents[0].sha : ""')
    [[ -n "$parent" ]] || { echo "❌ commit $sha introuvable." >&2; exit 1; }
    if ! contains "$base" "$parent"; then
      echo "❌ $head contient, avant $short, des promotions pas encore validées pour la production :" >&2
      gh_api GET "/compare/$base...$parent" | sed '$d' \
        | json '(d.commits||[]).filter(c=>/^Merge pull request #\d+ from [^/]+\/dev/.test(c.commit.message)).map(c=>"   - "+c.sha.slice(0,7)+" "+c.commit.message.split("\n")[0]).join("\n")' >&2
      echo "   Valider d'abord leurs pipelines $head, dans l'ordre. Rien n'est fusionné." >&2
      exit 1
    fi

    title="Promotion $head → $base (validée dans CircleCI)"
    number=$(find_pr "$head" "$base")
    current=""
    [[ -n "$number" ]] && current=$(gh_api GET "/pulls/$number" | sed '$d' | json 'd.head ? d.head.sha : ""')

    if [[ -n "$number" && "$current" == "$sha" ]]; then
      merge_pr "$number" "$sha" "$title"
      echo "PR #$number fusionnée : $head ($short) → $base"
      exit 0
    fi

    # $head a avancé depuis (promotions plus récentes, non validées) : ne promouvoir que le
    # commit validé, via une branche temporaire et sa propre PR ($base n'accepte que des PR).
    branch="promotion/$head-$short"
    echo "$head a avancé depuis $short : seule cette promotion part en production (branche $branch)."
    ref=$(node -e 'console.log(JSON.stringify({ref:"refs/heads/"+process.argv[1],sha:process.argv[2]}))' "$branch" "$sha")
    response=$(gh_api POST /git/refs "$ref")
    code=$(tail -n1 <<<"$response")
    [[ "$code" == 201 || "$code" == 422 ]] || { echo "Création de $branch refusée ($code) :" >&2; sed '$d' <<<"$response" >&2; exit 1; }
    trap 'gh_api DELETE "/git/refs/heads/$branch" >/dev/null || true' EXIT
    body=$(node -e 'console.log(JSON.stringify({title:process.argv[1],head:process.argv[2],base:process.argv[3],body:"Promotion du seul commit validé "+process.argv[4]+" (pipeline "+process.argv[5]+")."}))' "$title" "$branch" "$base" "$sha" "${CIRCLE_BUILD_URL:-}")
    response=$(gh_api POST /pulls "$body")
    code=$(tail -n1 <<<"$response")
    [[ "$code" == 201 ]] || { echo "Création de la PR $branch → $base refusée ($code) :" >&2; sed '$d' <<<"$response" >&2; exit 1; }
    number=$(sed '$d' <<<"$response" | json 'd.number')
    merge_pr "$number" "$sha" "$title"
    echo "PR #$number fusionnée : $short seul → $base"
    ;;
  *)
    echo "action inconnue : $action" >&2; exit 2 ;;
esac
