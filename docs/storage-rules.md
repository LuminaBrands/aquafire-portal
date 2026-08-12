# Firebase Storage rules

**Source of truth for the Storage security rules.** Like the Firestore rules
(`docs/firestore-rules.md`), these are published by hand in the Firebase
console and are *not* deployed from this repo — so update this file in the same
PR as any change to what the client writes, or the two drift apart silently.

Storage is used by two pages:

- `share-install.html`, which uploads a single install photo per submission to
  `installs/<uid>/<timestamp>-<name>` and then awards the `share-install`
  reward (500 points).
- `help-admin.html`, whose editor toolbar uploads Help Center article images to
  `help-media/<timestamp>-<sanitized-filename>` and inserts the resulting URL
  as `![alt](url)` markdown. This is team-authored public content, not a
  customer submission — see the `help-media/` clause below for why its rules
  differ from `installs/`.

## Rules

This is one combined ruleset — paste the whole thing, it is not additive
fragments. Publishing only the `help-media/` block (or only `installs/`) drops
the other path to the catch-all deny.

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // Install photos. A signed-in customer may write only under their own uid,
    // and may read back only their own. Nothing here is world-readable: the
    // team reviews submissions in the Firebase console.
    match /installs/{uid}/{file} {
      allow read: if request.auth != null && request.auth.uid == uid;
      allow write: if request.auth != null
                   && request.auth.uid == uid
                   && request.resource.size < 10 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }

    // Help Center article images, uploaded from help-admin.html's editor
    // toolbar. Public read — this is published article content, the same
    // audience as the article HTML it's embedded in, not a private
    // submission. Write is a verified @luminabrands.com team account only —
    // the same test as everywhere else in the project, because rewards
    // customers hold accounts in this same Firebase project and "signed in"
    // alone is never sufficient. No delete: a bad image is swapped for a new
    // upload in a fresh doc save, and pruning anything orphaned is a
    // console/team job, not a permission the client needs.
    match /help-media/{file} {
      allow read: if true;
      allow write: if request.auth != null
                   && request.auth.token.email_verified == true
                   && request.auth.token.email.matches('.*@luminabrands[.]com$')
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
      allow delete: if false;
    }

    // Everything else is closed.
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

## Why each clause

- **`request.auth.uid == uid`** — the path prefix is the only thing tying a
  photo to a person, so it has to be enforced, not just written by the client.
  Without it any signed-in user could write into anyone's folder.
- **`size < 10 MB`** (installs) / **`size < 5 MB`** (help-media) — matches the
  client-side check in `share-install.html` / `help-admin.html` respectively.
  The client check is a courtesy (it fails fast with a readable message); this
  one is the actual limit.
- **`contentType.matches('image/.*')`** — stops the bucket being used as
  general file hosting. The page infers a type from the file extension when the
  browser supplies an empty one, which iOS does for HEIC; without that
  inference those uploads would be rejected here.
- **No public read on `installs/`** — an install photo is someone's home.
  Reviewing happens in the console, and the page tells the customer we will
  ask before using theirs anywhere public.
- **Public read on `help-media/`** — the opposite call, deliberately: these
  images are inserted into published Help Center articles that are already
  world-readable, so gating the image behind auth would just break it for
  every customer viewing the article.
- **`email.matches('.*@luminabrands[.]com$')` + `email_verified == true`** —
  the same team check as `isTeam()` in `docs/firestore-rules.md`. Storage
  rules don't share functions with Firestore rules, so it's written out again
  here rather than referenced.

## Status

Storage is **enabled** and the `installs/` block above was **published**
(2026-08-03), verified three ways: the bucket answers `403` to an
unauthenticated list (it exists and is not world-readable),
`aquafire-portal.appspot.com` `404`s so the name in `rewards.js` is the current
one, and the console's Rules Playground allows `installs/abc123/photo.jpg` for
uid `abc123` on the `allow read` line while denying the same path for any
other uid.

The `help-media/` block above is **new and not yet published** — the ruleset
in the console still has just `installs/` and the catch-all deny, so until
someone pastes the combined ruleset in (**aquafire-portal → Storage → Rules →
Publish**), `help-admin.html`'s upload button will fail with
`storage/unauthorized` for every team account. `uploadImage()` in
`help-admin.html` surfaces that error on the toolbar button and points back at
this file, but it can't publish the rule itself — same limitation as
`helpArticles` in `docs/firestore-rules.md`.

If you re-run the Playground: the Location box takes the **path only**
(`installs/abc123/photo.jpg`). Pasting the full `/b/<bucket>/o/...` prefix in
there doubles it, the path stops matching `/installs/{uid}/{file}`, and you get
a deny from the catch-all instead of the answer you were testing for.

Uploads count against the free tier's 5 GB stored / 1 GB-per-day download. At a
few MB per submission that is a long way off, but it is not free forever.

## Known gap

The 500 points are awarded **on upload, not on approval** — that is the
behaviour that was asked for. `awardPoints` is idempotent, so the exposure is
500 points once per account for a photo that turns out to be unusable, not a
farmable loop. If that trade stops being acceptable, the change is to award
from a reviewed queue rather than from the client.
