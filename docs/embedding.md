# Embedding portal pages

Any customer-facing page can be dropped into a Shopify page (or anywhere else
on the store) inside an `<iframe>`. Adding `?embed` to the URL strips the
portal's own chrome so the tool sits inside the host page instead of looking
like a second website in a box.

```html
<iframe
  src="https://aquafire.app/maintenance.html?embed&amp;theme=light"
  width="100%"
  height="2400"
  style="border:0"
  loading="lazy"
  title="Aquafire maintenance guide"></iframe>
```

Everything is in the `src` URL:

```
https://aquafire.app/maintenance.html ? embed &amp; theme=light
└──────────── the page ─────────────┘ │   │      │  └ dark is the default
                                      │   │      └ separates the two params
                                      │   └ strips nav, page header, footer
                                      └ starts the query string
```

**Write `&amp;`, not a bare `&`.** `&` starts a character entity in HTML, so a
bare one is invalid and some theme editors and sanitisers mangle it. `&amp;`
resolves to the same URL. A plain `&` is fine when you're typing the URL into a
browser address bar to test. Param order doesn't matter.

## Parameters

| Param | Effect |
|-------|--------|
| `?embed` | Removes the nav bar, the page header (`<h1>` + intro), and the footer. Hides the Ember chat widget so the host page doesn't show two bubbles. |
| `?theme=light` / `?theme=dark` | Forces the lighting. Default is dark. |

`embed.js` does the stripping and runs on every customer page. It names the
chrome by class (`.bar`, `.phead`, `.pfoot`), so **renaming a chrome element
means renaming it there too** — that exact mismatch left `?embed` silently
stripping nothing on every page from the redesign rollout until 2026-08-05.

## Pass the theme explicitly

Normally the portal remembers the visitor's theme in `localStorage`. Inside an
iframe it usually can't: `aquafire.app` is a third party relative to the store's
domain, and Safari and Firefox partition or block third-party storage outright.

So don't rely on the saved theme in an embed — **always pass `theme=` and set it
to whatever matches the surrounding page.** Two other things follow from the same
limitation:

- **The maintenance page's checklist ticks and due dates may not persist** across
  visits in an embed. The page still works; it just may not remember.
- **Don't embed `rewards.html` or `share-install.html`.** Both need Firebase
  sign-in, which is unreliable in a cross-origin iframe. Link to them instead.

## Height

Iframes don't size themselves to their content, and the portal doesn't yet post
its height to the parent, so you have to pick a number. Too small and the frame
scrolls internally; too large and you get dead space under it.

Measured content heights with `?embed` (Chromium, Figtree loaded):

| Page | ~1100px wide | 390px wide |
|------|-------------:|-----------:|
| `quick-start.html` | 800 | 1060 |
| `water-care.html` | 2191 | 2993 |
| `maintenance.html` | 2318 | 4051 |
| `rewards.html` | 2487 | 3083 |
| `enclosure-guide.html` | 3759 | 4213 |
| `aquafire-pro.html` | 7034 | 12027 |

Phone heights are roughly 1.3–1.7× the desktop ones, so a single fixed height
can't serve both. Either set the height in a media query, or accept internal
scrolling on one of them.

`troubleshoot.html` and `dealer-locator.html` aren't in the table because their
height changes as the visitor uses them — the wizard swaps a card per answer and
the locator fills a list. Give those a fixed viewport-ish height (600–800px) and
let them scroll inside it.

`aquafire-pro.html` is very long; consider linking to it rather than embedding.

## Which origins may embed

`vercel.json` sets:

```
frame-ancestors 'self' https://aquafire.com https://*.aquafire.com https://*.myshopify.com
```

The frame comes up blank anywhere else — a staging host on a different domain, or
a page builder previewing from its own origin. Add the origin there if you need
it.

The two internal pages (`chat-insights.html`, `dealer-admin.html`) carry
`X-Frame-Options: DENY` and cannot be embedded at all, by design.

## The chat widget

Ember hides itself under `?embed` so a host page that already runs the widget
doesn't end up with two bubbles. To show it inside the frame anyway, set
`showInEmbed` (see `chat-assistant.md`). If you want Ember on the store page
itself, install it as a script tag rather than through an iframe — it is built
for that.
