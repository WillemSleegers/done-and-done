# Lessons Learned

Hard-won details that are not obvious from the code. Each entry says what
broke, why, and what to do instead.

## iOS PWA: "Add to Home Screen" bakes in the start URL

**Symptom.** Going back from a project's todo view opened one specific
unrelated project, every time, on iOS only. The app always *looked* correct at
launch, showing the projects grid.

**Cause.** The project had no web app manifest. Without one, iOS uses whatever
URL is on screen when you tap "Add to Home Screen" as the app's permanent start
URL. The icon had been added while a project was open, so every launch
navigated to `/?project=<that id>`. Nothing read `?project=` on mount, so the
grid rendered while the history entry underneath claimed a project. Opening a
project pushed a second entry; going back landed on the stale first one, and
the `popstate` handler read the URL and rendered that project.

**Fixes.**

- Ship a manifest with an explicit `start_url`. In Next this is
  `app/manifest.ts`, served as `/manifest.webmanifest` and linked automatically.
- Changing the manifest does not affect icons already on the home screen. iOS
  reads it at install time only — the icon must be deleted and re-added.
- `display: "standalone"` in the manifest is what makes it open without browser
  chrome. Next emits `mobile-web-app-capable`, not the legacy
  `apple-mobile-web-app-capable`; older iOS reads only the latter, so declare it
  via `metadata.other`.

## Do not disable native scroll restoration

**Symptom.** An attempt to remember the grid's scroll position made every back
navigation land at the top instead.

**Cause.** The fix set `history.scrollRestoration = "manual"`, which switched
off the browser's own per-entry scroll restoration. That native behavior was
already working correctly on iOS. The hand-rolled replacement ran before the
grid had laid out, so it restored nothing.

**Rule.** Leave `scrollRestoration` alone. WebKit records a scroll offset
against each history entry and restores it on back; it is more reliable than
anything reimplemented on top.

## `pushState` before `scrollTo`, not after

**Symptom.** Resetting scroll when opening a project fixed the grid position
leaking into the todo list, but then back navigation always returned to the top.

**Cause.** The browser snapshots the outgoing entry's scroll offset at the
moment `pushState` runs. Calling `scrollTo(0, 0)` first meant the grid entry was
recorded as offset 0, and native restoration faithfully returned there.

**Rule.** Push the new history entry first, then reset scroll. The offset gets
recorded against the entry being left; the reset applies to the new one.

## The window is the shared scroll container

`app/layout.tsx` uses `h-screen` with no `overflow` container anywhere in the
tree, so content overflows and the **window** holds the scroll offset. Both the
projects grid and a project's todo view therefore share one offset, and swapping
between them carries it over. Any per-view scroll behavior has to be explicit.

Symptoms only appear on long lists — a short page gets clamped back to 0
automatically, which makes the bug look intermittent.

## Debugging iOS PWAs: the inspector cannot see the interesting moments

Safari Web Inspector detaches when the app is killed and clears its console on
navigation, so the two moments that matter — launch, and whatever the back
gesture does — are exactly the ones it cannot capture. A listener registered in
the console also dies if the document is torn down, which makes "nothing was
logged" ambiguous between "no event fired" and "the page reloaded".

**Instead:** log to `localStorage` and render it on screen. It survives reloads,
app kills, and the inspector detaching, and it can be read from the phone with
no cable. See commit `9517826` for a working version (reverted in `1507a1b`;
`git revert 1507a1b` brings it back).

The single most useful field is
`performance.getEntriesByType("navigation")[0].type`, which reports `navigate`,
`reload`, or `back_forward` on each mount. It distinguishes a same-document
`popstate` from a full document restore — completely different fixes.

## Confirm the mechanism before fixing

Three commits in this bug's history were reverted because they were built on
plausible but unverified theories about what iOS was doing. Each looked
reasonable, and one even appeared to work.

The evidence that actually solved it was cheap and came late: an on-screen log
showing the launch URL, and the observation that it was always the *same*
project id. That single detail killed the leading theory — "iOS restores the
last session's URL" — which would have produced a different id each time.

When a bug is platform-specific and cannot be reproduced locally, get one
concrete measurement before writing code. The measurement is usually faster than
the revert cycle.
