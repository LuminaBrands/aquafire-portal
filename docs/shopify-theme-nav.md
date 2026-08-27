# Shopify theme — expanded mobile navigation

Change to the **storefront theme** (`www.aquafire.com`), not to this portal.
Recorded here because the Shopify theme has no version control of its own, and
the storefront nav is what feeds customers into `aquafire.app`.

## The problem

The storefront runs Maestrooo's **Impact** theme. Impact renders the mobile
drawer menu as a stack of *sliding panels* — one panel per menu level, each
reached by tapping a chevron. Combined with the current `main-menu` shape, that
put every real destination three taps deep:

```
☰  →  Support  →  Help Resources  →  Help Center
☰  →  Discover →  Explore         →  FAQs
☰  →  Products →  Fireplaces      →  Aquafire Pro
```

Two of those middle levels (`Explore`, `Help Resources`) are single-child
wrappers that exist only to hold the list — they add a tap and nothing else.

## The change

The drawer menu now renders **fully expanded**: every level is visible at once,
so the only tap left is the one on the destination itself. No chevrons, no
panel sliding, no back buttons.

Hierarchy is carried by type instead of by depth:

| Level | Example | Treatment |
|---|---|---|
| 1 | Products, Support, Contact Us | `h4 sm:h5`, links when the item has a real URL, plain text when it's a `#` placeholder |
| 2 | Fireplaces, Help Resources | small subdued group label — still tappable when it points somewhere real (e.g. the Fireplaces collection) |
| 3 | Aquafire Pro, FAQs | `h5 sm:h6` link, full-width tap target, indented under a hairline rule |

Mega-menu promo images (Products / Support / Discover) are **kept** — they
render as the same compact horizontal scroll row Impact already used in the
drawer, appended to their group.

### Files

Both live in the theme, not in this repo:

| File | State |
|---|---|
| `snippets/navigation-panel.liquid` | **rewritten** — expanded renderer |
| `snippets/navigation-panel-classic.liquid` | **new** — the original Impact snippet, copied byte-for-byte (verified by MD5) |
| `sections/header.liquid` | **untouched** (verified by MD5) |

Impact's own header comment warns that the menu code is sensitive and shouldn't
be touched casually. Two deliberate choices keep that warning respected:

- The outer element chain
  (`.panel-list__wrapper > .panel > .panel__wrapper > .panel__scroller`) is
  preserved exactly. It's what the drawer relies on for scrolling and sizing, so
  only the *contents* of the scroller differ.
- The expanded markup emits no `[data-panel]` buttons and no sibling `.panel`
  elements, so Impact's panel-sliding JS has nothing to bind to and stays out of
  the way rather than being patched or removed.

The desktop **mega-menu-in-a-drawer** path (`is_mega_menu`) is untouched — it
delegates to `navigation-panel-classic`. Nothing on this store uses it today
(all three mega-menu blocks are set to `horizontal` / `horizontal_center`), but
the path still works if it's ever enabled.

Desktop is unaffected: the header layout is `logo_left_navigation_inline`, so
the sidebar drawer carries `lg:hidden` and only appears below 1150px.

## Reverting

One-word revert, in `snippets/navigation-panel.liquid`:

```liquid
{%- assign expand_mobile_menu = false -%}
```

That routes everything back to `navigation-panel-classic`, which is the original
file unmodified. Or simply don't publish the theme copy.

## Deployment state

Built on an **unpublished duplicate**, never on the live theme:

- Live theme: `Updated copy of Updated copy of Updated copy of...` (`185926418752`) — **unchanged**
- Working copy: `Mobile menu expanded (2026-08-27)` (`187860910400`)

Preview: `https://www.aquafire.com/?preview_theme_id=187860910400`

Publish from **Online Store → Themes** once it's been checked on a real phone.

## Possible follow-up (menu content, not theme code)

`Explore` and `Help Resources` are single-child wrappers. With everything
expanded they show up as group labels that don't earn their place. Deleting
those two levels in **Navigation** and promoting their children to sit directly
under `Discover` / `Support` would shorten the drawer noticeably. That's a
Shopify menu edit, not a theme change, so it's left alone here.
