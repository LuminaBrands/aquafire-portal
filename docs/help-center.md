# Help Center — architecture & maintenance

The customer-facing Help Center (`help.html`) — browsable, searchable help
articles for every model, mirroring the Gorgias help center
(`aquafire.gorgias.help`) so customers can get answers without leaving the
portal.

## Pieces

| File | Role |
|------|------|
| `help.html` | Page shell (standard redesign chrome). App renders into `#help-app` inside `<main>`, so `?embed` works. |
| `help.css` | Page styles, `ha-` prefixed, redesign tokens with fallbacks. |
| `help.js` | Render + search engine: home / category / article views, `?category=<id>` / `?article=<slug>` deep links with pushState, live client-side search, Firestore merge (below). |
| `help-articles.js` | The built-in catalogue: `HELP_CATEGORIES` (6) + `HELP_ARTICLES` (29). Schema is documented in the file header. |
| `help-admin.html` | **Internal** team editor (not in nav; noindexed in `vercel.json` + `robots.txt`). Firebase-gated to verified `@luminabrands.com` — same rule as `chat-insights.html`: signed-in alone is never sufficient. Toolbar supports inserting images (upload to Storage or by URL) — see "Article images" below. |

## Where article content came from

Built Aug 2026 as the union of:

- **`docs/source-material/` extracts** (17 articles) — the archived help-center
  articles, warranty, Vapor Pure manual and sticker keys, reformatted for the
  web with internal editorial matter stripped.
- **The live help center via search snippets** (12 articles) — the remote
  sandbox couldn't fetch `aquafire.gorgias.help` directly, so articles like
  Delivery Inspection, Glass Enclosure Options and Outdoor Installation
  Guidelines were written strictly within verified search-result fragments.
  They are deliberately short; extend them from the live articles, don't pad.

Deliberately not ported: **MSRP Pricing** (pricing lives on the store — link,
never restate), and the marketing pages (buying guide, "Why Aquafire?") which
belong to the storefront.

Known discrepancy to verify with the product team: the Vapor Pure article uses
the local manual's AF300/AF700 mounting dimensions, which disagree with the
live help-center article's figures.

## Team authoring (no deploy needed)

`help-admin.html` writes to the **`helpArticles` Firestore collection**
(rules in `docs/firestore-rules.md` — hand-published in the console, so new
environments need that block pasted before saves work). Docs store both the
markdown-lite source (`md`) and the rendered `html`, plus `published`.

`help.js` merges published docs over the built-in catalogue on load:

- a doc whose `slug` matches a built-in article **replaces** it (hot-fixing
  shipped content without a deploy);
- new slugs append to their category;
- the query **must** filter `.where('published', '==', true)` — the security
  rules deny unfiltered public list queries;
- any Firestore failure is silent and the static catalogue still renders.

## Article images

The editor's markdown-lite body supports `![alt](url)` — write it directly, or
use the toolbar: **Insert image** uploads a file (≤ 5 MB, `image/*`) to
Firebase Storage at `help-media/<timestamp>-<name>` and writes the markdown
for you once the upload finishes; **by URL** skips the upload and just asks
for a link (for an image already hosted elsewhere, e.g. the Shopify CDN). Both
insert at the cursor and refresh the live preview. Uploaded URLs render at
`https://firebasestorage.googleapis.com/...`; `vercel.json`'s `img-src` allows
`'self'`, `cdn.shopify.com` and `firebasestorage.googleapis.com` for that
reason — an image host outside those three won't render on either the
customer page or the editor preview.

The `help-media/` Storage rules (public read, team-only write, `docs/storage-rules.md`)
must be published in the console before the upload button works — same
one-time setup step as the `helpArticles` Firestore rules, and the same
failure mode: the editor gate is UX, the rules are the real boundary.

## Copy rules (also enforced as an advisory lint in the editor)

1. Never name the chat persona — it is "the chat". "Ember" is internal-only.
2. Cutout clearance is nominal + ⅜″ **in total** across the outside edges;
   link `enclosure-guide.html` rather than restating numbers, and never write
   a bare "+ ⅜″" without the convention, never "per side".
3. No prices — link to `https://www.aquafire.com`.
4. Facts must trace to `docs/source-material/` or the live help center. When
   the live help center changes, update the article here **and** the matching
   extract file, same as the Troubleshooter rule.
5. Search keywords are customer voice ("beeping", "no mist", "wifi"), not
   internal jargon.

## Relationship to the other support surfaces

The Help Center is the reference library; the **Troubleshooter**
(`troubleshoot.js`) stays the guided path and the chat's KB (`assistant.js`
`INTENTS` + `api/chat.js` `BASE_FACTS`) stays the conversational one. A fact
that changes in a help article usually lives in those too — check all three.
The chat's `portal_tools` intent and `BASE_FACTS` page map list the Help
Center; keep both if the page moves.
