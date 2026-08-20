# Frontend Codebase Analysis

**Snapshot: 2026-08-20, branch `redesign-2026`.** Every file and line count below
was checked against the tree at that point. The previous revision of this
document had drifted badly — it analysed a dozen files that no longer exist and
listed as outstanding several problems that had already been fixed — so treat
this as a fresh survey rather than an edit of the old one.

## 🔴 Critical Issues

### 1. **`LyricsGame.tsx` is still the problem child**
- 513 lines, and it has *grown* since the last survey (484). The redesign moved
  the win state and the share card into it rather than out.

### 2. **Large rendering components**
- `MaskedLyricsDisplay.tsx` (266) — the renamed successor to the old
  `MaskedLyrics.tsx`; still the heaviest rendering path
- `AssignPanel.tsx` (265) — search state and assignment concerns in one place

## ✅ Fixed since the last survey

Recorded so nobody re-opens them:

- **Duplicate `cn()`** — gone. `lib/utils.ts` is now a two-line re-export of
  `lib/helpers`, which holds the single definition.
- **Shared logic extraction** — hit counting, progress and word processing now
  live in `lib/utils/{hit-counting,progress-calculations,word-processing}.ts`.
- **Custom hooks** — `useGameLogic`, `useGameProgress` and `useGameShare` were
  split out of `LyricsGame` as recommended.
- **The broken `useGameMonth` reference** — the hook is real now
  (`hooks/usePlayer.ts:103`) and `ArchiveContent` uses it. The `front/page.tsx`
  that misused it no longer exists.
- **Debug logging** — no `console.log` remains anywhere under `src/app/front/`.
- **The old admin tree** — `components/admin/game/` (7 components, 1321 lines)
  was deleted once `AdminScheduler` replaced it, along with seven now-unused
  `components/ui/` primitives.
- **The abandoned service layer** — `lib/services/*` and `lib/game-server.ts`
  are gone; see the note under Utils & Lib.

## 📁 Current Structure

### **Pages & Routing**

| File | Lines | Notes |
|---|---|---|
| `game/[[...slug]]/page.tsx` | 30 | The single game route |
| `rickroll/page.tsx` | 37 | Fallback game |
| `admin/page.tsx` | 9 | Renders `AdminScheduler` and nothing else |
| `admin/layout.tsx` | 9 | |
| `archive/page.tsx` | 7 | |
| `archive/[month]/page.tsx` | 8 | Clean delegation |
| `layout.tsx` / `providers.tsx` | 24 / 15 | |

The `[date]/page.tsx`, `game/[date]/page.tsx` and `front/page.tsx` routes
analysed in the previous revision are all gone; routing collapsed onto the
optional-catch-all.

### **Components — Game**

| File | Lines | Status |
|---|---|---|
| `lyrics-game/LyricsGame.tsx` | 513 | 🔴 See Critical #1 |
| `lyrics-game/MaskedLyricsDisplay.tsx` | 266 | 🔴 Heavy rendering |
| `ScrambleTitle.tsx` | 188 | ⚠️ Animation logic worth extracting |
| `lyrics-game/PathToVictory.tsx` | 159 | |
| `lyrics-game/GuessInput.tsx` | 151 | |
| `lyrics-game/ShareButton.tsx` | 140 | |
| `lyrics-game/SegmentedProgressBar.tsx` | 130 | |
| `lyrics-game/GuessHistory.tsx` | 118 | |
| `lyrics-game/LyricsGameWrapper.tsx` | 99 | |
| `YesterdayStats.tsx` | 74 | |
| `lyrics-game/LyricsLoadingComponent.tsx` | 38 | |

`GameControls.tsx`, `GameProgress.tsx`, `GameCompletion.tsx`, `DateDisplay.tsx`,
`GameTutorial.tsx` and `WinPopup.tsx` no longer exist.

### **Components — Admin**

The admin screen is `components/admin/scheduling/`:

| File | Lines | Role |
|---|---|---|
| `AssignPanel.tsx` | 265 | Playlist/track picking, via `use-playlists` + `useDebounce` |
| `AdminScheduler.tsx` | 186 | Screen root; owns month/date, wires `useAdminGames` and `useAdminGameMutations` |
| `QueueRail.tsx` | 146 | The day rail |
| `day-model.ts` | 79 | `QueueDay` construction and track formatting |
| `TrackRow.tsx` | 75 | |
| `StatusPill.tsx` | 29 | |

### **Components — Archive & UI**

- `archive/_components/ArchiveContent.tsx` (128) — note the path; it moved out
  of `components/archive/`
- `components/archive/CalendarView.tsx` (129)
- `components/ui/` is down to `toast.tsx` (128), `toaster.tsx` (34) and
  `Tooltip.tsx` (28) — all three reachable from `layout.tsx`

### **Hooks**

| File | Lines | Notes |
|---|---|---|
| `use-toast.ts` | 192 | Standard shadcn implementation |
| `usePlayer.ts` | 110 | ⚠️ Player API + game state + month games in one file |
| `useGameLogic.ts` | 93 | |
| `useAdmin.ts` | 67 | Inline `adminApi`; see Critical #2 |
| `useGameShare.ts` / `use-playlists.ts` | 54 / 54 | |
| `useGameProgress.ts` | 37 | |
| `useDebounce.ts` | 16 | |

### **Utils & Lib**

Live: `lib/utils/{date-formatting,hit-counting,progress-calculations,color-management,word-processing}.ts`,
`lib/routes.ts`, `lib/query-client.ts`, `lib/error-messages.ts`,
`lib/helpers/{index,date,player,spotify}.ts`.

`lib/helpers/spotify.ts` is small but load-bearing again — `day-model.ts` uses
`getTrackTitle`/`getTrackArtist` to read `Song.spotifyData`, which arrives as
untyped JSON.

> `lib/services/{admin,game,player}-service.ts` and `lib/game-server.ts` were
> deleted: ~313 lines with no importers, left over from an "extract an API
> service layer" effort that was written but never adopted. The hooks kept
> their own inline `fetch` calls throughout, so these were a second, silently
> stale copy of the data layer.

## 🎯 Recommendations by Priority

### **Priority 1**
1. **Split `LyricsGame.tsx`** — 513 lines and growing.

### **Priority 2**
1. **Refactor `MaskedLyricsDisplay.tsx`** — split rendering from word processing.
2. **Split `AssignPanel.tsx`** — separate search state from assignment.
3. **Split `usePlayer.ts`** — three concerns in one hook.

### **Priority 3**
1. **Extract `ScrambleTitle`'s animation logic** to a hook.
2. **Review `globals.css`** (171 lines, down from 295 after the token rewrite) —
   less urgent than it was.

---

**Maintenance note**: this document goes stale fast — the previous revision
described a tree that had moved on by roughly a dozen files. If it drifts again,
prefer regenerating it wholesale over patching sections.
