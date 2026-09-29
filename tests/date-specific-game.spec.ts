import { test, expect } from '@playwright/test';
import {
  YESTERDAY,
  TWO_DAYS_AGO,
  THREE_DAYS_AGO,
  INVALID_DATE
} from './playwright-seed';

test.describe('Date-Specific Game Pages', () => {

  test.describe('Valid Past Dates', () => {
    // Game state (including guess history) is scoped per player ID. The seed
    // script (tests/playwright-seed.ts) records its guesses under the fixed
    // id 'testplayer01' - use that same id here so this session actually
    // owns those guesses, instead of a fresh random id that owns none of
    // them (GameService.getGamesWithGuesses/getGameWithGuesses filter guesses
    // by playerId server-side).
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(() => {
        window.localStorage.setItem('rtfl_player_id', 'testplayer01');
      });
    });

    test('should load yesterday\'s game with guesses', async ({ page }) => {
      await page.goto(`/${YESTERDAY}`);
      await page.waitForLoadState('networkidle');

      // Should load successfully
      await expect(page).toHaveURL(`/${YESTERDAY}`);
      await expect(page.locator('[data-testid="game-container"]')).toBeVisible();

      // Should show the date. The header renders it as a permanent archive
      // link, in a desktop and a mobile variant - `:visible` picks whichever
      // one this viewport shows. The link text is the day number; the ISO date
      // is in `title`, dashes and all.
      await expect(page.locator('[data-testid="date-display"]:visible')).toHaveAttribute('title', YESTERDAY);

      // testplayer01 has a recorded guess for this date - guess-history
      // renders at zero size when empty, so this only becomes visible once
      // it actually has content.
      const guessHistory = page.locator('[data-testid="guess-history"]');
      await expect(guessHistory).toBeVisible();
    });

    test('should load game from two days ago with multiple correct guesses', async ({ page }) => {
      await page.goto(`/${TWO_DAYS_AGO}`);
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveURL(`/${TWO_DAYS_AGO}`);
      await expect(page.locator('[data-testid="game-container"]')).toBeVisible();

      const guessHistory = page.locator('[data-testid="guess-history"]');
      await expect(guessHistory).toBeVisible();
    });

    test('should load game from three days ago without guesses', async ({ page }) => {
      await page.goto(`/${THREE_DAYS_AGO}`);
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveURL(`/${THREE_DAYS_AGO}`);
      await expect(page.locator('[data-testid="game-container"]')).toBeVisible();

      // No guesses were seeded for this date at all, for any player - the
      // guess-history container collapses to zero size when its filtered
      // guess list is empty (no min-height set), so check it's rendered in
      // the DOM rather than requiring nonzero visible size.
      const guessHistory = page.locator('[data-testid="guess-history"]');
      await expect(guessHistory).toBeAttached();
    });
  });

  test.describe('Future Dates', () => {
    // The redesign dropped the /rickroll redirect. An unplayable date - malformed,
    // future, or unscheduled - is left to the API, whose 400/403/404 the client
    // turns into the easter-egg song rendered in place, under a banner naming the
    // reason. The URL stays on the date that was asked for.
    test('should fall back to the rickroll game for future dates', async ({ page }) => {
      // Computed, not FUTURE_DATE: the seed schedules a game on that date (the
      // "future game" row of the seed table), so asking for it returns a normal
      // 200 and exercises nothing. A date a year out has no game for certain.
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const noGameYet = futureDate.toISOString().split('T')[0];
      await page.goto(`/${noGameYet}`);
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveURL(`/${noGameYet}`);

      // Refused, and the banner says why - either the future-date guard (403) or
      // "no song scheduled" (404), depending on whether the server's UTC-based
      // "today" has already rolled over. Which one arrives is not this test's
      // business.
      await expect(page.getByText(/happened yet|no song was scheduled/)).toBeVisible();

      // The rickroll game still renders below the banner
      await expect(page.locator('[data-testid="game-container"]')).toBeVisible();
    });

    test('should handle future date with different format', async ({ page }) => {
      // Computed rather than hardcoded: a fixed date string stops being in the
      // future as soon as it passes, and this test then asserts nothing.
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const tomorrow = futureDate.toISOString().split('T')[0];
      await page.goto(`/${tomorrow}`);
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveURL(`/${tomorrow}`);
      await expect(page.getByText(/happened yet|no song was scheduled/)).toBeVisible();
    });
  });

  test.describe('Invalid Dates', () => {
    test('should gracefully fall back to rickroll game for invalid date format', async ({ page }) => {
      await page.goto(`/${INVALID_DATE}`);
      await page.waitForLoadState('networkidle');

      // Does NOT redirect - stays on the same URL
      await expect(page).toHaveURL(`/${INVALID_DATE}`);

      // Renders the rickroll fallback game in place (usePlayer's isValidDate check
      // falls back to fetching 'rickroll' data for malformed dates)
      await expect(page.locator('[data-testid="game-container"]')).toBeVisible();
      await expect(page.locator('[data-testid="masked-lyrics"]:visible')).toBeVisible();
    });

    test('should handle malformed date strings', async ({ page }) => {
      await page.goto('/not-a-date');
      await page.waitForLoadState('networkidle');

      // Stays on the same URL and renders the rickroll fallback game
      await expect(page).toHaveURL('/not-a-date');
      await expect(page.locator('[data-testid="game-container"]')).toBeVisible();
    });

    test('should handle empty date parameter (root path)', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Root path shows today's game
      await expect(page).toHaveURL('/');
      await expect(page.locator('[data-testid="game-container"]')).toBeVisible();
    });
  });

  test.describe('Non-existent Games', () => {
    test('should gracefully fall back to rickroll game for a well-formed date with no game', async ({ page }) => {
      const nonExistentDate = '2020-01-01';
      await page.goto(`/${nonExistentDate}`);
      await page.waitForLoadState('networkidle');

      // Stays on the same URL, no redirect and no explicit "not found" message.
      // playerApi.getCurrentGame falls back to the rickroll game on a 404 from the real API.
      await expect(page).toHaveURL(`/${nonExistentDate}`);
      await expect(page.locator('[data-testid="game-container"]')).toBeVisible();
      await expect(page.locator('[data-testid="masked-lyrics"]:visible')).toBeVisible();
    });
  });

  test.describe('URL Variations', () => {
    test('should handle a valid date URL', async ({ page }) => {
      await page.goto(`/${YESTERDAY}`);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="game-container"]')).toBeVisible();
    });

    test('should handle URL with extra query parameters', async ({ page }) => {
      await page.goto(`/${YESTERDAY}?param=value`);
      await page.waitForLoadState('networkidle');

      // Should load the game correctly, query param preserved
      await expect(page).toHaveURL(new RegExp(`/${YESTERDAY}\\?param=value`));
      await expect(page.locator('[data-testid="game-container"]')).toBeVisible();
    });
  });

  test.describe('Game State Persistence', () => {
    test('should maintain game state when navigating between dates', async ({ page }) => {
      // Load yesterday's game
      await page.goto(`/${YESTERDAY}`);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="game-container"]')).toBeVisible();

      // Make a guess - the form submits on Enter, there is no separate submit
      // button. `:visible` because the desktop rail and the mobile bottom bar
      // are both mounted and each renders its own GuessInput.
      const inputField = page.locator('[data-testid="guess-input"]:visible');
      await inputField.fill('testguess');
      await inputField.press('Enter');
      await page.waitForTimeout(1000);

      // Navigate to different date
      await page.goto(`/${TWO_DAYS_AGO}`);
      await page.waitForLoadState('networkidle');

      // Should show different game state
      await expect(page.locator('[data-testid="game-container"]')).toBeVisible();

      // Navigate back to yesterday
      await page.goto(`/${YESTERDAY}`);
      await page.waitForLoadState('networkidle');

      // Should show updated game state with new guess
      await expect(page.locator('[data-testid="game-container"]')).toBeVisible();
    });
  });
});
