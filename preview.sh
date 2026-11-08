#!/usr/bin/env bash
# ---------------------------------------------------------------------
# Aperçu du site COMPLET (FR + EN), tel qu'il sera publié.
#   ./preview.sh            puis ouvrir http://localhost:8000
# Pour éditer avec rechargement automatique, utiliser plutôt :
#   quarto preview                (pages françaises seulement)
#   quarto preview --profile en   (pages anglaises seulement)
# ---------------------------------------------------------------------
set -euo pipefail
cd "$(dirname "$0")"
./build.sh
echo "Aperçu sur http://localhost:8000  (Ctrl+C pour arrêter)"
python3 -m http.server 8000 -d _site
