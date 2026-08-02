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

## Before this page goes live

1. **Enable Storage** in the Firebase console for the `aquafire-portal`
   project. The bucket (`aquafire-portal.firebasestorage.app`) is already in
   the client config, but Storage itself has never been switched on — until it
   is, uploads fail and the page shows its "upload did not finish" error.
2. **Publish the rules above.** The default template allows any signed-in user
   to read and write the whole bucket, which is not what we want.
3. Uploads count against the free tier's 5 GB / 1 GB-per-day download. At a few
   MB per submission that is a long way off, but it is not free forever.

## Known gap

The 500 points are awarded **on upload, not on approval** — that is the
behaviour that was asked for. `awardPoints` is idempotent, so the exposure is
500 points once per account for a photo that turns out to be unusable, not a
farmable loop. If that trade stops being acceptable, the change is to award
from a reviewed queue rather than from the client.
