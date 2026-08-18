import { test, expect } from '@playwright/test';
import { format, addMonths } from 'date-fns';

test.describe('Archive Page', () => {

  test.describe('Main Archive Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/archive');
    });

    test('should load archive page successfully', async ({ page }) => {
      await page.waitForLoadState('networkidle');

      // Check that we're on the archive page
      await expect(page).toHaveURL('/archive');

      // Check for main archive components
      await expect(page.locator('[data-testid="archive-container"]')).toBeVisible();
      await expect(page.locator('[data-testid="archive-title"]')).toBeVisible();
    });

    test('should display current month by default', async ({ page }) => {
      await page.waitForLoadState('networkidle');

      // Should show current month
      const currentMonth = new Date().toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
      });
      await expect(page.locator('[data-testid="month-display"]')).toContainText(currentMonth);
    });

    test('should show calendar view with games', async ({ page }) => {
      await page.waitForLoadState('networkidle');

      // Check for calendar component
      await expect(page.locator('[data-testid="calendar-view"]')).toBeVisible();

      // game-calendar-day marks days WITHOUT a game - there are many of these in
      // any month, so check the first one rather than the bare locator (which
      // hits Playwright's strict-mode multi-match error on toBeVisible()).
      await expect(page.locator('[data-testid="game-calendar-day"]').first()).toBeVisible();
    });

    test('should display navigation controls', async ({ page }) => {
      await page.waitForLoadState('networkidle');

      // Check for month navigation
      await expect(page.locator('[data-testid="prev-month"]')).toBeVisible();
      await expect(page.locator('[data-testid="next-month"]')).toBeVisible();
    });

    test('should show work in progress badge', async ({ page }) => {
      await page.waitForLoadState('networkidle');

      await expect(page.locator('[data-testid="wip-badge"]')).toBeVisible();
      await expect(page.locator('[data-testid="wip-badge"]')).toContainText('Work in progress');
    });

    test('should display user ID for debugging', async ({ page }) => {
      await page.waitForLoadState('networkidle');

      await expect(page.locator('[data-testid="user-id-display"]')).toBeVisible();
      await expect(page.locator('[data-testid="user-id-display"]')).toContainText('User ID:');
    });
  });

  test.describe('Month Navigation', () => {
    test('should navigate to previous month', async ({ page }) => {
      await page.goto('/archive');
      await page.waitForLoadState('networkidle');

      const currentMonth = new Date().toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
      });

      await page.locator('[data-testid="prev-month"]').click();
      await page.waitForLoadState('networkidle');

      await expect(page.locator('[data-testid="month-display"]')).not.toContainText(currentMonth);
    });

    test('should navigate to next month (if not current)', async ({ page }) => {
      await page.goto('/archive');
      await page.waitForLoadState('networkidle');

      await page.locator('[data-testid="prev-month"]').click();
      await page.waitForLoadState('networkidle');

      await page.locator('[data-testid="next-month"]').click();
      await page.waitForLoadState('networkidle');

      const currentMonth = new Date().toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
      });
      await expect(page.locator('[data-testid="month-display"]')).toContainText(currentMonth);
    });

    test('should disable next month navigation for current month', async ({ page }) => {
      await page.goto('/archive');
      await page.waitForLoadState('networkidle');

      // next-month renders as a plain div (not a real form control) when
      // navigation is blocked, so toBeDisabled() never applies - it's marked
      // with aria-disabled="true" instead.
      await expect(page.locator('[data-testid="next-month"]')).toHaveAttribute('aria-disabled', 'true');
    });
  });

  test.describe('Archive with Specific Month', () => {
    test('should load archive for specific month', async ({ page }) => {
      const testMonth = '2024-01';
      await page.goto(`/archive/${testMonth}`);
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveURL(`/archive/${testMonth}`);
      await expect(page.locator('[data-testid="archive-container"]')).toBeVisible();

      // Should show the specific month
      await expect(page.locator('[data-testid="month-display"]')).toContainText('January 2024');
    });

    test('should handle invalid month format', async ({ page }) => {
      await page.goto('/archive/invalid-month-format');
      await page.waitForLoadState('networkidle');

      // No redirect - the page shows an inline message on the same URL
      await expect(page).toHaveURL('/archive/invalid-month-format');
      await expect(page.locator('[data-testid="invalid-month"]')).toBeVisible();
    });

    test('should handle future month', async ({ page }) => {
      // A genuinely future month relative to "now", computed dynamically -
      // no data is seeded that far out, so this should render the normal
      // empty-month state, not an error (confirmed by the passing
      // "should show normal archive behavior for future archive dates" test
      // in routes.spec.ts, which covers the same underlying page).
      const futureMonth = format(addMonths(new Date(), 6), 'yyyy-MM');
      await page.goto(`/archive/${futureMonth}`);
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveURL(`/archive/${futureMonth}`);
      await expect(page.locator('[data-testid="archive-container"]')).toBeVisible();
    });

    test('should handle month with no games', async ({ page }) => {
      const emptyMonth = '2020-01';
      await page.goto(`/archive/${emptyMonth}`);
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveURL(`/archive/${emptyMonth}`);
      await expect(page.locator('[data-testid="archive-container"]')).toBeVisible();

      // Should show empty state
      await expect(page.locator('[data-testid="empty-month"]')).toBeVisible();
    });
  });

  test.describe('Calendar View', () => {
    test('should display games on correct dates', async ({ page }) => {
      await page.goto('/archive');
      await page.waitForLoadState('networkidle');

      // game-calendar-day marks days WITHOUT a game - days WITH a game use
      // game-with-guesses or game-without-guesses instead. Count those two
      // together to get the number of seeded games this month.
      const gameDaysWithGuesses = page.locator('[data-testid="game-with-guesses"]');
      const gameDaysWithoutGuesses = page.locator('[data-testid="game-without-guesses"]');
      const total = await gameDaysWithGuesses.count() + await gameDaysWithoutGuesses.count();
      expect(total).toBe(4); // Today, yesterday, 2 days ago, 3 days ago
    });

    test('should show game status indicators', async ({ page }) => {
      // A day's progress (game-with-guesses vs game-without-guesses) is
      // computed from THIS player's own guesses (GameService.getGamesWithGuesses
      // filters by playerId server-side). The seed script records its
      // guesses under the fixed id 'testplayer01' - use that id here so this
      // session actually owns some of them, instead of a fresh random id
      // that owns none.
      await page.addInitScript(() => {
        window.localStorage.setItem('rtfl_player_id', 'testplayer01');
      });
      await page.goto('/archive');
      await page.waitForLoadState('networkidle');

      // Should show different indicators for games with/without guesses
      await expect(page.locator('[data-testid="game-with-guesses"]').first()).toBeVisible();
      await expect(page.locator('[data-testid="game-without-guesses"]').first()).toBeVisible();
    });

    test('should allow clicking on game days', async ({ page }) => {
      await page.goto('/archive');
      await page.waitForLoadState('networkidle');

      // Click on an actual game day (game-calendar-day is a day WITHOUT a
      // game and isn't a useful click target here)
      const gameDay = page.locator('[data-testid="game-without-guesses"], [data-testid="game-with-guesses"]').first();
      await gameDay.click();

      // Real navigation target is /YYYY-MM-DD, not /game/YYYY-MM-DD
      await expect(page).toHaveURL(/^http:\/\/[^/]+\/\d{4}-\d{2}-\d{2}/);
    });
  });

  test.describe('Loading States', () => {
    test('should show loading state while fetching data', async ({ page }) => {
      // Delay the month API response so the loading state is reliably
      // observable instead of racing a fast local response.
      await page.route('**/api/games/month/**', async route => {
        await new Promise(resolve => setTimeout(resolve, 500));
        await route.continue();
      });

      await page.goto('/archive');

      await expect(page.locator('[data-testid="loading-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="loading-message"]')).toContainText('Loading games...');

      await page.waitForLoadState('networkidle');

      await expect(page.locator('[data-testid="loading-message"]')).not.toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Mock network error
      await page.route('**/api/games/month/**', route => {
        route.abort('failed');
      });

      await page.goto('/archive');
      await page.waitForLoadState('networkidle');

      // Should show error state
      await expect(page.locator('[data-testid="error-state"]')).toBeVisible();
    });

    test('should handle invalid month parameters', async ({ page }) => {
      await page.goto('/archive/not-a-valid-month');
      await page.waitForLoadState('networkidle');

      // No redirect - inline message on the same URL
      await expect(page).toHaveURL('/archive/not-a-valid-month');
      await expect(page.locator('[data-testid="invalid-month"]')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading structure', async ({ page }) => {
      await page.goto('/archive');
      await page.waitForLoadState('networkidle');

      // There are multiple h1s on this page (archive-title, its inner
      // ScrambleTitle heading, and month-display) - scope to one.
      await expect(page.locator('[data-testid="archive-title"]')).toBeVisible();
    });

    test('should have proper navigation labels', async ({ page }) => {
      await page.goto('/archive');
      await page.waitForLoadState('networkidle');

      // Navigation buttons should have proper labels
      await expect(page.locator('[data-testid="prev-month"]')).toHaveAttribute('aria-label');
      await expect(page.locator('[data-testid="next-month"]')).toHaveAttribute('aria-label');
    });
  });
});
