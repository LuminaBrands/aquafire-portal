# Firestore security rules — `aquafire-portal`

The rules are **not** deployed from this repo (there's no build step and no
Firebase CLI config). They're edited in the Firebase console:
**aquafire-portal → Firestore Database → Rules → Publish**.

This file is the source of truth for what *should* be published. If you change
the rules in the console, update this file in the same PR.

One project holds three unrelated things, which is the trap to keep in mind:

| Collection | Written by | Read by |
|---|---|---|
| `users/{uid}` | `rewards.js` (customers, from the browser) | the signed-in customer |
| `chatEvents` | `assistant.js` (anonymous visitors) | the team, in `chat-insights.html` |
| `chatKnowledge` | the team, in `chat-insights.html` | `api/chat.js` (public read) |

**Rewards customers hold Firebase accounts in this project.** So
`request.auth != null` is never sufficient for anything internal — team access
must check the email domain, and customer documents must check the UID.

## Full ruleset

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ── Team check (used by the internal collections below) ──────────────
    function isTeam() {
      return request.auth != null
        && request.auth.token.email_verified
        && request.auth.token.email.matches('.*@luminabrands[.]com');
    }

    // ── Rewards accounts (rewards.js) ────────────────────────────────────
    // Own-document access only, with a bounded shape. Points are still
    // client-asserted (see "Known limitation" below) — these rules cap the
    // damage rather than eliminate it: a user can claim rewards they didn't
    // earn, but can't invent point totals or unknown reward ids, and can't
    // touch anyone else's document.
    match /users/{uid} {
      allow read: if request.auth != null && request.auth.uid == uid;

      allow create, update: if request.auth != null
        && request.auth.uid == uid
        && request.resource.data.keys().hasOnly(
             ['points', 'completed', 'email', 'displayName', 'updatedAt'])
        && request.resource.data.points is number
        && request.resource.data.points >= 0
        // 4,600 = the sum of every reward in the REWARDS map in rewards.js.
        // Bump this when rewards are added, or the save silently fails and the
        // widget falls back to localStorage.
        && request.resource.data.points <= 4600
        && request.resource.data.completed is map
        && request.resource.data.completed.keys().hasOnly([
             'setup-guide', 'enclosure-builder', 'water-hardness', 'light-trap',
             'fireplace-tour', 'mist-maker', 'system-cleaning', 'follow-instagram',
             'watch-youtube', 'ar-cutout', 'quick-start', 'support-hub',
             'contact-sales', 'shop-accessories', 'fireplace-setup', 'register-warranty',
             'submit-review', 'share-install'])
        // Identity fields must match the token — no impersonating another
        // customer's address in the document body.
        && request.resource.data.email in [request.auth.token.email, '']
        && request.resource.data.displayName is string
        && request.resource.data.displayName.size() <= 200;

      allow delete: if false;
    }

    // ── Chat telemetry (assistant.js → chat-insights.html) ───────────────
    // Anonymous create-only, since the widget runs on the Shopify storefront
    // where visitors have no account. Field allowlist + size caps keep a
    // scripted writer from turning the dashboard into a junk drawer; enable
    // App Check (below) to require that writes come from our own pages.
    match /chatEvents/{id} {
      allow create: if request.resource.data.keys().hasOnly(
             ['v', 'type', 'convo', 'ts', 'page', 'host',
              'model', 'text', 'intent', 'vote', 'comment', 'mode'])
        && request.resource.data.type is string
        && request.resource.data.type.size() <= 40
        && request.resource.data.convo is string
        && request.resource.data.convo.size() <= 64
        && (!('text' in request.resource.data.keys())
            || (request.resource.data.text is string
                && request.resource.data.text.size() <= 600))
        && (!('comment' in request.resource.data.keys())
            || (request.resource.data.comment is string
                && request.resource.data.comment.size() <= 300))
        && (!('page' in request.resource.data.keys())
            || (request.resource.data.page is string
                && request.resource.data.page.size() <= 300));

      allow read: if isTeam();
      allow update, delete: if false;
    }

    // ── Team-taught chat knowledge (chat-insights.html → api/chat.js) ─────
    match /chatKnowledge/{id} {
      // World-readable on purpose: api/chat.js reads it unauthenticated to
      // ground AI answers, and the content is public-facing FAQ material by
      // definition. Never put anything non-public in this collection.
      allow read: if true;
      allow create, update, delete: if isTeam();
    }
  }
}
```

Adjust the domain pattern if the team signs in with something else (e.g.
`'.*@(luminabrands|aquafire)[.]com'`), or swap `isTeam()` for an explicit UID
allowlist.

## Adding a reward — three places, or it silently fails

The `users` rule pins both an allowlist of reward ids and a points ceiling, so a
reward added to `rewards.js` alone is a reward that cannot be saved. Every new
one needs:

1. `REWARDS` in `rewards.js`.
2. The `completed.keys().hasOnly([...])` allowlist above, **and** the
   `points <= N` cap raised to the new total.
3. **Publish the rules in the console.** They do not deploy from this repo.

Miss step 2 or 3 and the failure is quiet and confusing rather than loud: the
write is rejected, the in-session total still goes up, and the next page load
shows the server's lower figure. That is what happened when `share-install`
(500 points, taking the total from 4,100 to 4,600) shipped ahead of the rules.
`saveUserData()` no longer mirrors a rejected write to localStorage, so the two
stores can't drift apart, and it logs a message naming this exact cause.

## Authorized domains (Auth) — required for sign-in to work at all

Firebase Auth refuses to complete a sign-in unless the *serving* origin is on
its authorized list, and the defaults only cover `localhost`,
`aquafire-portal.firebaseapp.com` and `aquafire-portal.web.app`. We serve from
a custom Vercel domain, so `aquafire.app` has to be added by hand:

> Firebase console → **Authentication → Settings → Authorized domains → Add
> domain** → `aquafire.app` (and `www.aquafire.app` if it resolves).

Symptom when it is missing: the Google popup opens and closes within a second
and `rewards.js` surfaces `auth/unauthorized-domain`. It is easy to misread as
a popup-blocker or a COOP problem — it is neither. `vercel.json` already sets
`Cross-Origin-Opener-Policy: same-origin-allow-popups`, which is what
`signInWithPopup` needs; don't "fix" that header chasing this bug.

This gates **every** sign-in path, not just Google — email/password on
`rewards.html`, `share-install.html`, and the `@luminabrands.com` gate on the
two internal pages all fail the same way. Vercel preview URLs
(`*.vercel.app`) are each a distinct origin and cannot be wildcarded, so
sign-in will not work on a preview deploy unless that exact host is added.

## App Check (closes anonymous `chatEvents` writes)

The rules above bound *what* an anonymous caller can write, not *who* can
write. To require that writes originate from our own pages:

1. Firebase console → **App Check** → register the web app with reCAPTCHA
   Enterprise (or reCAPTCHA v3), then copy the site key.
2. Add the App Check SDK + `activate(siteKey)` alongside the Firebase init in
   `assistant.js`.
3. Set `chatEvents` to **Enforce** in App Check, and add
   `request.app != null` to the `allow create` condition above.

Do it in that order — enforcing before the widget sends tokens silently drops
all telemetry. The chat itself is unaffected either way: telemetry is
fire-and-forget (`assistant.js`), so a rejected write never reaches a customer.

## Known limitation: rewards points are client-asserted

`rewards.js` computes points in the browser and writes the total to
`users/{uid}`. The rules cap the total and the reward ids, but nothing proves
the customer actually completed a reward — they could claim all 17 and reach
4,100 points.

That's acceptable while points are cosmetic. **Before points convert to
discounts, store credit, or anything redeemable**, move awarding server-side:
an `/api/award-points` function that verifies the caller's Firebase ID token,
checks the claim, and writes with Admin credentials — then change the rule to
`allow write: if false` so only the server can grant points. That needs a
service-account key in the Vercel env and is a bigger change than the rest of
this hardening pass, so it's deliberately not done here.

## Privacy / retention

`chatEvents` transcripts can contain whatever a customer typed (emails are
masked by `assistant.js` before logging, but names, addresses, and order
details may still appear). Treat the collection as customer data and set a
Firestore TTL policy on the `ts` field — 180 days is a reasonable default.
