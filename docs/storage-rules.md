# Firebase Storage rules

**Source of truth for the Storage security rules.** Like the Firestore rules
(`docs/firestore-rules.md`), these are published by hand in the Firebase
console and are *not* deployed from this repo — so update this file in the same
PR as any change to what the client writes, or the two drift apart silently.

Storage is used by exactly one page: `share-install.html`, which uploads a
single install photo per submission to `installs/<uid>/<timestamp>-<name>` and
then awards the `share-install` reward (500 points).

## Rules

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
- **`size < 10 MB`** — matches the client-side check in `share-install.html`.
  The client check is a courtesy (it fails fast with a readable message); this
  one is the actual limit.
- **`contentType.matches('image/.*')`** — stops the bucket being used as
  general file hosting. The page infers a type from the file extension when the
  browser supplies an empty one, which iOS does for HEIC; without that
  inference those uploads would be rejected here.
- **No public read** — an install photo is someone's home. Reviewing happens in
  the console, and the page tells the customer we will ask before using theirs
  anywhere public.

## Status

Storage is **enabled** and the rules above are **published** (2026-08-03),
verified three ways: the bucket answers `403` to an unauthenticated list (it
exists and is not world-readable), `aquafire-portal.appspot.com` `404`s so the
name in `rewards.js` is the current one, and the console's Rules Playground
allows `installs/abc123/photo.jpg` for uid `abc123` on the `allow read` line
while denying the same path for any other uid.

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
