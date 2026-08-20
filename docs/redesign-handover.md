# RTFL redesign — handover

Written 2026-08-20, at the end of the session that implemented the 2026 visual
redesign. Branch: **`redesign-2026`**, 11 commits, not pushed, not merged.

Source of truth for the design: `~/Downloads/design_handoff_rtfl_redesign 3/`
(README.md is the detailed spec, DESIGN_SPEC.md the condensed one, UI_AUDIT.md
the rationale). **Bundle "3" supersedes the earlier bundle** — it reverses
several calls (notably: the wordmark scramble stays infinite) and adds a "Data
formats" section that traces design requirements back to real code.

---

## 1. Where the redesign stands

### Done and verified in the browser

| Area | State |
|---|---|
| Dark-only token set, Space Grotesk + JetBrains Mono, motion keyframes | done |
| Lyrics surface (one span per token, constant padding, no reflow) | done |
| Anchored feedback counter (hit / miss / duplicate) | done |
| Victory panel: collapsed headline + A/B overlay | done |
| Guess history, chips, hide-misses filter | done |
| Two-column desktop, mobile bottom bar | done |
| Win state inline (stamp, stats, Spotify card, disabled input) | done |
| Spoiler-free share card + PNG download | done |
| Archive (desktop + mobile), 404, failed-to-load, loading skeleton | done |

### Deliberate deviations from the spec

- **Masked words render as underscores, not empty bars.** The spec asks for
  empty inline-block bars; the client asked mid-session to keep underscores.
  Everything else from that section (one span per token, constant padding)
  was kept. Do not "fix" this back.
- **The rail's loading skeleton renders the real disabled input**, not the
  spec's 46px grey block. A live input is more useful and doesn't shift.
- **Admin (screen 7) was not built.** It is fully specced but absent from the
  handoff's own file list and migration checklist, so it was scoped out.

### Todo — ordered by what I'd do next

1. **Restore the e2e `data-testid`s** the redesign dropped (see §4). This is
   the most urgent item: 11 selectors the Playwright suite depends on no
   longer exist, including `game-container`, used 18 times.
2. **Test against a real scheduled song.** All manual verification so far used
   the rickroll song only. §2 explains how to seed real games.
3. **Decide the stanza question** (see §5) — needs a product call.
4. **Check the share PNG's fonts.** `html-to-image` must inline the Google
   fonts; nobody has looked at the produced PNG to confirm it isn't falling
   back to a system face.
5. Rewrite the e2e assertions that test deleted behaviour (win modal,
   "work in progress" badge, player-id display).
6. Optional: build the admin screen.

---

## 2. Fixtures — what they are and their lifecycle

**Purpose.** Every external dependency (Spotify, Genius) is recorded to disk so
tests and local dev never hit a real API. 17 MB, 57 JSON files, under
`src/app/api/lib/test/fixtures/data/{spotify,genius}/`.

**The catalogue is `src/app/api/lib/test/constants.ts`** — `TEST_IDS` lists the
Spotify URIs that get fixtures: 12 tracks with lyrics (Billie Jean, Beat It,
Thriller, Baby One More Time, 4 French songs, Never Gonna Give You Up…), 2
instrumentals, 2 error cases, 4 playlists. Fixtures are addressed by the
constant *key* (`BILLIE_JEAN`), never by Spotify id.

**Generation — `pnpm generate-fixtures`** (`fixtures/generator.ts`). Requires
real `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `GENIUS_ACCESS_TOKEN`. For
each track it calls the live APIs and writes, per key:

```
spotify/tracks/<KEY>.json          the Track object
spotify/search/<KEY>.json          search results for "<title> <artist>"
genius/search/<KEY>.json           Genius search response
genius/lyrics/<KEY>.html           the raw lyrics page HTML
genius/lyrics/<KEY>.txt            lyrics after extractLyricsFromHtml()
genius/lyrics/<KEY>_MASKED.txt     the masked rendering, for eyeballing
```

Note the `.txt` is produced by running the **real** `extractLyricsFromHtml`,
and `_MASKED.txt` by the **real** `MaskedLyricsService` — so those two files
are a snapshot of current pipeline behaviour, not independent data.

**Consumption.** `fixtures/index.ts` lazily reads the files; `test/mocks/*.ts`
wrap them as fake Spotify/Genius clients that the integration tests inject.

**They are also a production dependency.** `createRickrollGame` in
`src/app/api/games/[date]/route.ts` reads three fixture files at runtime with
`fs.readFileSync(process.cwd() + 'src/app/api/lib/test/fixtures/...')`. In a
standalone/serverless build those paths are not traced and the easter egg
would 500. Worth moving to a proper seed.

**Seeding real games locally.** `tests/playwright-seed.ts` creates actual games
through the admin API from these fixtures:

| Date | Song |
|---|---|
| today | BABY_ONE_MORE_TIME |
| yesterday | BILLIE_JEAN (+ guesses from 3 players) |
| today − 2 | BEAT_IT (+ guesses) |
| today − 3 | THRILLER |
| today + 30 | LIKE_A_PRAYER |

This is the answer to "how do I see the redesign with a real song".

---

## 3. Rickroll — the easter egg

**What it is.** *Never Gonna Give You Up* served as a real, playable game
stored under the sentinel date **`2099-12-31`**.

**Three ways in**, and the third is the surprising one:

1. `/rickroll` — rewritten to `/front/rickroll` in `next.config.mjs`.
2. **Any future date** — `src/app/front/game/[[...slug]]/page.tsx:27` redirects
   via `isFutureDate`.
3. **Any failed game fetch** — `usePlayer.ts:22` falls back to the rickroll for
   *any* 400/403/404. So a day with no scheduled game silently shows the easter
   egg instead of an error. This is why `/` shows Rick Astley on an empty DB,
   and why the new failed-to-load screen almost never appears (only 5xx, or
   when the rickroll itself fails).

**Server side.** `GET /api/games/rickroll` intercepts the literal string
*before* date validation (`route.ts:68`) — required, because `2099-12-31` would
otherwise be rejected by the future-date guard at line 89. `createRickrollGame`
lazily seeds the Game + Song row on first request, so the easter egg
self-heals if the DB is wiped. `POST /api/games/rickroll/guess` maps the string
to `2099-12-31`.

**Four problems, all verified against a running server, none fixed:**

1. **Guesses are persisted, contrary to the code comment.**
   `guess/route.ts:33` says "guesses aren't stored", but `GuessService.submitGuess`
   does a plain `prisma.guess.create` with no special case. Verified: a POST
   creates a row. So the easter egg accumulates permanent per-player state and
   can be **won for good** — that happened during this session (8 guesses →
   "won on the credits", now frozen for that player id).
2. **The POST returns a truncated history.** It answers
   `{...gameState, guesses: [guessResponse]}` — only the last word, where the
   GET returns the full list. Harmless today because `useGuess` invalidates and
   refetches instead of writing the response to the cache; a trap for anyone
   who adds `setQueryData`.
3. **Test fixtures read at runtime** — see §2.
4. **Two 400s on every page load.** `useGameState` forces `enabled` for
   non-date strings (`usePlayer.ts:88`), so the request fires before the
   player id exists.

---

## 4. Test infrastructure — read this before claiming there are no frontend tests

There are **two suites**. I initially reported "no frontend tests" — that was
wrong.

### Jest — API only

30 suites / 201 tests, all under `src/app/api/**`, split into `unit` and
`integration` projects. Nothing covers `src/app/front/**`.

> **Running Jest empties `prisma/dev.db`.** `jest.config.cjs` →
> `jest.setup.afterEnv.js` → `test/env/environment.ts` loads `.env`
> (`DATABASE_URL=file:./dev.db`), `test/env/db.ts` builds a `PrismaClient`
> with **no datasource override**, and a global `beforeEach(resetTestDb)` runs
> `deleteMany()` on Guess/Game/Song. The per-worker isolation in
> `test/env/parallel-db.ts` only applies to tests that opt into it. This
> destroyed local data during the session. Also: `prisma/test-dbs/` grows
> unboundedly — 1.1 GB / 7375 files observed; `npm run clean:db` clears it but
> is wired to no test script.

### Playwright — the actual frontend suite

715 lines across `tests/`: `routes.spec.ts`, `root-page.spec.ts`,
`archive-page.spec.ts`, `date-specific-game.spec.ts`. `globalSetup` wipes the
DB and runs `playwright-seed.ts` (see §2). Run with `npm run test:e2e`.

> **Gotcha:** `reuseExistingServer: true` locally. If a dev server is already
> on :3000 it will be reused — but `global-setup` wipes the DB named by
> `.env.test` while seeding through *that* server, which may be on `.env`
> (dev.db). Stop other dev servers before running e2e.

**The redesign broke this suite.** These `data-testid`s no longer exist:

| Testid | Uses | Verdict |
|---|---|---|
| `game-container` | 18 | restore — dropped incidentally |
| `archive-container`, `archive-title` | 4 + 5 | restore |
| `prev-month`, `next-month` | 4 + 4 | restore (month nav is now `◀ ▶` links) |
| `game-without-guesses` | 3 | restore — CalendarView now only emits two variants |
| `game-header` | 1 | restore |
| `empty-month` | 1 | restore — the empty-month branch was dropped |
| `wip-badge` | 2 | **test must change** — badge deleted on purpose |
| `user-id-display` | 2 | **test must change** — player id no longer surfaced |
| `date-display` | 2 | **test must change** — replaced by a permanent archive link |
| `getByText('Congratulations')` | 1 | **test must change** — win modal deleted |

Restoring the first six is cheap and keeps the coverage honest; the last four
assert behaviour the redesign intentionally removed.

---

## 5. Open question: stanzas don't exist in the data

The spec says lines come from the token stream and "two consecutive newlines
start a new stanza", with `gap: 26px` between stanzas.
`MaskedLyricsDisplay.groupIntoStanzas` implements exactly that.

**It never fires.** `src/app/api/lib/services/lyrics.ts:56` lists `/^\s*$/`
among the patterns to drop and then filters `line.length > 0` before joining
with a single `\n`. The scraper deletes every blank line, so no `"\n\n"` token
can exist. Confirmed: zero blank lines in all 10 lyrics fixtures, zero
multi-newline tokens in the rickroll API response. Every song renders as one
continuous block with 7px line gaps.

Three ways out, and the choice is a product call:
- leave it (works, just without the intended vertical rhythm);
- stop stripping blank lines in `lyrics.ts` — backend change, and songs already
  stored would need re-scraping;
- fake stanzas client-side — contradicts the spec's intent.

---

## 6. Conventions this session established

- **Never modify files with shell one-liners** (`perl -pi`, `sed -i`, python
  line-slicing). Malik reads the diffs; use Edit even when it takes several
  anchored passes. Shell is fine for read-only inspection.
- Don't run Jest reflexively — it costs the dev database (§4).
- Colours: never hardcode hex in components. Tokens live as CSS custom
  properties in `globals.css` under an `rtfl-*` namespace, mapped in
  `tailwind.config.ts`. The one deliberate exception is the six word-identity
  hues in `color-management.ts`, which are consumed as raw values by chips,
  bars, lyric highlights and the share card.
- The legacy HSL token set stays for admin and the shared `ui/*` primitives;
  `dark` is now a static class on `<html>`.
