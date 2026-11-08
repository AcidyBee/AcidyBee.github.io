#!/usr/bin/env bash
# ---------------------------------------------------------------------
# Construit le site bilingue complet dans _site/ :
#   1. rendu du profil FR  -> _site_fr/   (racine du site)
#   2. rendu du profil EN  -> _site_en/en (sous-dossier /en)
#   3. fusion des deux dans _site/
# Usage : ./build.sh        puis   quarto publish gh-pages --no-render _site
# ---------------------------------------------------------------------
set -euo pipefail
cd "$(dirname "$0")"

rm -rf _site _site_fr _site_en
quarto render --profile fr
quarto render --profile en

mkdir -p _site
cp -R _site_fr/. _site/
rm -rf _site/en   # le lien « EN » du profil FR y recopie des .qmd : on les écarte
cp -R _site_en/en _site/en
touch _site/.nojekyll
rm -rf _site_fr _site_en
echo "Site prêt dans _site/ ($(find _site -name '*.html' | wc -l | tr -d ' ') pages HTML)"
