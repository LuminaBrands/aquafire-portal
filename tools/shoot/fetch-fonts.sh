#!/usr/bin/env bash
# Downloads a Google Fonts css2 stylesheet + its woff2 files into fonts/
# so shoot.mjs can serve them via route interception (the screenshot
# sandbox's Chromium cannot reach Google Fonts through the proxy itself).
#
# Usage: ./fetch-fonts.sh "Figtree:wght@400;500;600;700" home
#   -> writes fonts/home.css and fonts/s_figtree_v9_*.woff2
#
# The woff2 filenames are the gstatic URL path with '/' -> '_', which is
# exactly what shoot.mjs's gstatic route handler looks up.
set -euo pipefail
cd "$(dirname "$0")"
FAMILY="${1:?family spec, e.g. Figtree:wght@400;500;600;700}"
OUT="${2:?output name, e.g. home (matches the version folder)}"
UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36"
mkdir -p fonts
curl -sS -A "$UA" "https://fonts.googleapis.com/css2?family=${FAMILY}&display=swap" -o "fonts/${OUT}.css"
grep -o 'https://fonts.gstatic.com/[^)]*' "fonts/${OUT}.css" | sort -u | while read -r u; do
  f="fonts/$(echo "${u#https://fonts.gstatic.com/}" | tr '/' '_')"
  [ -f "$f" ] || curl -sS -o "$f" "$u"
  echo "  $f"
done
echo "wrote fonts/${OUT}.css"
