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

1. ~~Restore the e2e `data-testid`s~~ — **done 2026-08-20**, see §4.
2. ~~Test against a real scheduled song~~ — **done 2026-08-20**. The five games
   from §2 were seeded into `dev.db` and the game screen (both layouts) plus
   the archive were checked against Billie Jean and Beat It rather than the
   rickroll.
3. ~~Run the Playwright suite end to end~~ — **done 2026-08-20**. 51/51 green,
   twice in a row. See §4 for how to run it without fighting over port 3000.
4. **Decide the stanza question** (see §5) — needs a product call.
5. **Check the share PNG's fonts.** `html-to-image` must inline the Google
   fonts; nobody has looked at the produced PNG to confirm it isn't falling
   back to a system face.
6. **Style the calendar's out-of-month days.** `CalendarView` fills the grid
   from `startOfWeek(monthStart)` to `endOfWeek(monthEnd)`, so 35–42 cells
   render and up to 11 of them belong to the neighbouring months. `isCurrentMonth`
   only decides whether a cell is clickable, never how it looks, so July 31
   is indistinguishable from an unplayed August 1. Neither the README nor the
   prototype says what these cells should do.
7. Optional: build the admin screen.

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

**The redesign broke this suite — repaired 2026-08-20.** What was wrong and
what was done about it:

| Testid | Uses | Resolution |
|---|---|---|
| `game-container` | 18 | restored on `LyricsGame`'s root |
| `archive-container` | 4 | restored on the archive card |
| `archive-title` | 5 | restored on the `◀ August 2026 ▶` line — per README §3 the redesign's archive header has no separate page heading, so the month line *is* the title |
| `prev-month`, `next-month` | 4 + 4 | restored on the `◀ ▶` links, on both branches of the `canNavigateNext` ternary so the disabled `aria-disabled="true"` case keeps its handle |
| `game-without-guesses` | 3 | `CalendarView` back to three variants: no game / with this player's guesses / without |
| `game-header` | 0 | **nothing was broken** — it only ever appeared in a comment in `root-page.spec.ts`, never in an assertion. Added to the real `<header>` anyway |
| `empty-month` | 1 | **test changed** — the redesign has no empty-month state; a month with no games renders the ordinary grid. The test now asserts the calendar plus zero played days |
| `wip-badge` | 2 | **tests replaced** — badge deleted on purpose; the two dead tests became one covering the header's played/solved/streak stats |
| `user-id-display` | 2 | ditto |
| `date-display` | 2 | restored — the date is still shown, as the permanent archive link |
| `getByText('Congratulations')` | 1 | **test changed** — the modal became an inline panel, so the assertion now targets the `won on the …` stamp |

**Two breaks the first pass missed**, both found by counting matches in a live
DOM rather than grepping:

- **Duplicated testids.** The desktop and mobile layouts are *both* mounted at
  all times (one hidden by an `lg:` class), so `guess-input`, `game-progress`
  and `date-display` each resolve to two elements and every `.fill()` /
  `toBeVisible()` on them trips Playwright's strict mode. The specs now use
  `[data-testid="…"]:visible`, which picks the rendered layout at any viewport.
  Verified: exactly one visible match at both 375px and 1400px.
- **`masked-lyrics` only existed on mobile.** It lives on the
  `MaskedLyricsDisplay` wrapper, which the desktop layout never renders — the
  desktop pane builds `MaskedTitleArtist` + `MaskedLyricsBody` itself. So four
  `toBeVisible()` assertions failed at Playwright's desktop viewport even
  though the element was in the DOM. The desktop lyrics pane now carries the
  same testid, and those four assertions use `:visible` too.

Also fixed: `archive-page.spec.ts` expected `Loading games...` where the
redesign writes `Loading games…` with a real ellipsis.

**Two more failures surfaced only once the suite actually ran:**

- `should display games on correct dates` was **racy by construction**. It did
  `await locator.count()` and compared the number by hand; `count()` takes one
  snapshot and never retries, so under parallel load it read the grid before
  React Query had resolved the month and saw zero. It passed in isolation and
  failed in a full run. Now a single web-first `toHaveCount(4)`.
- The rickroll banner's `🎵` is no longer a heading. The old assertion used
  `getByRole('heading', { name: '🎵' })` precisely *because* the page used to
  carry two competing `h1`s — the redesign fixed that by demoting the banner to
  a span, which broke the workaround. Matched by text now, the same way the
  equivalent assertion in `routes.spec.ts` always did.

### Running it without fighting over port 3000

`playwright.config.ts` now reads **`PLAYWRIGHT_PORT`** (default 3000) and
derives `use.baseURL`, `webServer.url` and the server's own `PORT` from it. It
also pins `process.env.PLAYWRIGHT_BASE_URL`, so `global-setup` can no longer
seed one server while the tests drive another.

```bash
PLAYWRIGHT_PORT=3100 npx playwright test
```

This matters more than it looks: with `reuseExistingServer: true` and an
unrelated dev server on 3000, the plain `npm run test:e2e` adopts *that* server
and runs global setup — a full wipe and reseed — straight through it. Verified
on the port-scoped path: `test.db` is what gets rebuilt, `dev.db` is untouched.

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
