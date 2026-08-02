# tools/shoot — redesign screenshot harness

Playwright harness used during the 2026 portal redesign (Claude Code
sessions) to screenshot the design-study pages (`v1/…`, `mix4/`, `b1/…`,
`home/`) on desktop and mobile from inside a sandboxed container where
most CDNs are blocked.

Not part of the deployed site. Requires Node + Playwright with a Chromium
install (in Claude Code's remote environment: executable at
`/opt/pw-browsers/chromium-*/chrome-linux/chrome` — update the
`executablePath` in `shoot.mjs` if the bundled version changes).

## Usage

```sh
# 1. Serve the repo root
python3 -m http.server 8901 --bind 127.0.0.1 &

# 2. Fetch fonts once per font set (Chromium can't reach Google Fonts
#    through the sandbox proxy; the harness serves them locally instead)
./fetch-fonts.sh "Figtree:wght@400;500;600;700" home

# 3. Shoot. ONLY takes version-folder names; append ?query to deep-link
#    (e.g. the home page's light theme). OUT_DIR receives the PNGs.
OUT_DIR=/tmp/shots ONLY='home,home?theme=light' node shoot.mjs
```

Each version gets `desktop` (1440×900 viewport), `desktop-full`, and
`mobile-full` (390px, full page) shots. `?`/`=` in a version name become
`-` in filenames.

## What the route interception does (and why)

The sandbox blocks `cdn.shopify.com`, the Higgsfield CDN
(`d8j0ntlcm91z4.cloudfront.net`), and direct font fetches. `shoot.mjs`
intercepts those requests and serves:

- SVG stand-ins for Shopify product/logo images,
- a warm hotel-lobby stand-in SVG for the Higgsfield hero photo,
- locally downloaded css/woff2 for Google Fonts (per-version css file in
  `fonts/<version>.css`; woff2 filenames are the gstatic URL path with
  `/` replaced by `_`).

**Screenshots therefore show stand-in imagery.** For renders with the
*real* photo/product imagery, load the Vercel preview in a browser, or
render via the Higgsfield MCP sandbox (clone the repo there, `npx
playwright screenshot` against `file://` URLs — it has unrestricted
network access; see `docs/redesign-handoff.md`).
