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
| `help-articles.js` | The built-in catalogue: `HELP_CATEGORIES` (8) + `HELP_ARTICLES` (76). Schema is documented in the file header. |
| `help-img/` | Self-hosted article images — compressed WebP copies of the live help-center images, referenced from article bodies. |
| `help-admin.html` | **Internal** team editor (not in nav; noindexed in `vercel.json` + `robots.txt`). Firebase-gated to verified `@luminabrands.com` — same rule as `chat-insights.html`: signed-in alone is never sufficient. Toolbar supports inserting images (upload to Storage or by URL) — see "Article images" below. |

## Where article content came from

Re-synced Aug 2026 as a **word-for-word clone of the live help center**
(`aquafire.gorgias.help`): all 72 live articles were crawled and converted
verbatim (Gorgias markup → the schema in the `help-articles.js` header),
with article images downloaded, compressed to WebP and self-hosted in
`help-img/`. Four portal-native articles from the original source-material
build were kept alongside (remotes/smart-home control, lights-and-beeps
reference, preventative maintenance, limited warranty) — they have no live
counterpart.

Because the sync is verbatim, some cloned articles diverge from the copy
rules below (e.g. the live MSRP Pricing articles are now ported, and the
live Vapor Pure article's AF300/AF700 figures disagree with the local
manual). Divergences are enumerated in the sync PR for a product-team
decision, not silently fixed — resolve them on the live help center first,
then re-sync.

The pre-sync build (source-material extracts + search-snippet articles) is
described in the git history of this file if the provenance ever matters.

## Home view: Quick Start Guides

The home view opens on a **Quick Start Guides** row — three photo cards for
Original / Pro / Lite, above *Browse by topic* — so a customer who knows which
fireplace they own can go straight to that model's guide instead of hunting
through categories for it. The row renders only on the home view; category,
article and search views are unchanged.

- Data is the `GUIDES` array at the top of `help.js` (name, `href`, image +
  its intrinsic size, blurb). `href: null` renders an unlinked *Coming soon*
  card — a fallback kept for future models; every current model links to its
  guide (the Lite's is `aquafire-lite.html`).
- **`GUIDES` mirrors the model tiles on `quick-start.html`** — same three
  products, same order, same committed photographs (`model-*.jpg`). That page
  is the other front door to these guides; move them together.
- Styles are `.ha-guide*` in `help.css`, on the shared `.tile` object. The
  photographs are lifestyle shots, so they are cover-cropped with a radius
  (never letterboxed), and the card names the model in text — the `<img>`
  takes `alt=""` rather than repeating it. Under 760px the card turns side-on
  (thumbnail left, text right) so the row doesn't push the topic grid off the
  screen. The unlinked card has its hover lift and rim suppressed: it isn't a
  link and must not offer to open.

## Team authoring (no deploy needed)

`help-admin.html` writes to the **`helpArticles` Firestore collection**
(rules in `docs/firestore-rules.md` — hand-published in the console, so new
environments need that block pasted before saves work). Docs store both the
markdown-lite source (`md`) and the rendered `html`, plus `published`.

**Unpublishing** is available in two places: an **Unpublish** button on every
published row in the team list, and the one in the editor bar. Both write a
single field (`published: false`) rather than re-saving the form, so they work
without a form loaded and on a doc that overrides a built-in article — a full
save of an override is gated behind the "yes, override the built-in" checkbox,
which unpublishing has no way to satisfy from a list row. The body is left
exactly as published: publishing again restores the same article, and for an
override the built-in article takes over in the meantime rather than the page
404ing.

The editor's **View** button (between *Save draft* and *Publish*) opens the
customer page for the slug currently in the form — `help.html?article=<slug>`,
new tab. It follows the slug as you type it, and its tooltip says whether that
slug is on the Help Center yet: a draft that overrides nothing shows the
not-found view until it's published, while an override opens the built-in
article it is about to replace.

## Hiding a built-in article

Built-in articles ship in `help-articles.js`, so they can't be deleted from the
editor — but they can be **retired without a deploy**. Every row in the
*Built-in articles* panel carries a **Hide** button, which writes a doc on that
slug carrying `hidden: true`; `help.js` reads it as an instruction to drop the
slug from the Help Center entirely (category list, search, direct links, and
the counts). **Unhide** puts it back.

Three things about the shape are load-bearing:

- A hide doc carries `published: true` as well. That is what makes it visible
  to the customer query and the security rules — `hidden`, not `published`, is
  what it *means*. Don't "fix" that pairing.
- Hides are applied **after** replacements in `mergeTeamArticles()`, so a hide
  always wins for a slug regardless of the order Firestore returns docs in.
- Hiding an article that already carries team edits keeps the body and
  remembers whether it was published (`hiddenWasPublished`), so unhiding
  restores exactly what was there. A hide with no body of its own is deleted
  outright on unhide, rather than left as an empty published doc.

Hidden slugs are not listed under *Team articles* — a hide isn't an article,
and its state belongs on the built-in row it acts on. The editor refuses to
open one (the row offers only *Unhide*) so that a save can't quietly resurrect
it, and the slug lint in the editor says so if you try to write a new article
on a hidden slug.

Deleting the entry from `help-articles.js` is still the way to retire an
article permanently; Hide is the no-deploy, reversible version.

`help.js` merges published docs over the built-in catalogue on load:

- a doc whose `slug` matches a built-in article **replaces** it (hot-fixing
  shipped content without a deploy);
- a doc flagged `hidden` **removes** that slug instead (above);
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
