import { test, expect, Page } from '@playwright/test';
import { format } from 'date-fns';

test.beforeEach(async ({ page }) => {
  // Set up a valid player ID in localStorage using cuid
  await page.addInitScript(() => {
    // Generate a cuid-like ID (lowercase letters and numbers)
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 25; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    window.localStorage.setItem('rtfl_player_id', result);
  });
});

// Helper function to wait for player ID to be available
async function waitForPlayerId(page: Page) {
  await page.waitForFunction(() => {
    const playerId = window.localStorage.getItem('rtfl_player_id');
    return playerId && playerId.length >= 10 && /^[a-z0-9]+$/.test(playerId);
  });
}

// Get today's date in YYYY/MM/DD format
function getTodayDatePath(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `/${year}/${month}/${day}`;
}

// Get tomorrow's date in YYYY/MM/DD format
function getTomorrowDatePath(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const day = String(tomorrow.getDate()).padStart(2, '0');
  return `/${year}/${month}/${day}`;
}

// Get tomorrow's month in YYYY-MM format
function getTomorrowMonthPath(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

// Get a past date that likely has no game (e.g., 2020-01-01)
function getPastDateWithNoGamePath(): string {
  return '/2020/01/01';
}

test('should render the game page for root path', async ({ page }) => {
  await page.goto('/');
  await waitForPlayerId(page);
  // Look for the game page heading format: "READ THE ... LYRICS"
  await expect(page.getByRole('heading', { name: /read the.*lyrics/i })).toBeVisible();
});

test('should show the archive root page for /archive', async ({ page }) => {
  await page.goto('/archive');
  await waitForPlayerId(page);
  // Wait for the main archive heading (the one with ScrambleTitle)
  await expect(page.locator('[data-testid="archive-title"]')).toBeVisible();
  // Check for the current month heading, computed dynamically rather than a
  // hardcoded year (a fixed year list goes stale the moment the calendar
  // rolls past it - this is what broke the original version of this test).
  const currentMonthName = format(new Date(), 'MMMM yyyy');
  await expect(page.getByRole('heading', { name: currentMonthName })).toBeVisible();
});

test('should show archive page for valid month format', async ({ page }) => {
  await page.goto('/archive/2024-01');
  await waitForPlayerId(page);
  // Should show archive content
  await expect(page.locator('[data-testid="archive-title"]')).toBeVisible();
  await expect(page.getByRole('heading', { name: /january 2024/i })).toBeVisible();
});

test('should handle valid date paths', async ({ page }) => {
  await page.goto(getTodayDatePath());
  await waitForPlayerId(page);
  await expect(page.getByRole('heading', { name: /read the.*lyrics/i })).toBeVisible();
});

// Invalid/malformed URLs and dates - the app deliberately does NOT redirect
// or show an error popup for these. usePlayer's useGameState falls back to
// fetching the rickroll game in place whenever the date string doesn't parse
// as YYYY-MM-DD (or the real API 404s/400s on it), so the page stays put and
// renders the rickroll game's content instead of a blank or error state.
test('should gracefully fall back to the rickroll game for an invalid single-segment URL', async ({ page }) => {
  await page.goto('/invalid-url');
  await waitForPlayerId(page);
  await expect(page).toHaveURL('/invalid-url');
  await expect(page.locator('[data-testid="game-container"]')).toBeVisible();
});

test('should gracefully fall back to the rickroll game for an invalid multi-segment URL', async ({ page }) => {
  await page.goto('/invalid/url/with/multiple/segments');
  await waitForPlayerId(page);
  await expect(page).toHaveURL('/invalid/url/with/multiple/segments');
  await expect(page.locator('[data-testid="game-container"]')).toBeVisible();
});

test('should gracefully fall back to the rickroll game for an invalid date format', async ({ page }) => {
  await page.goto('/2024/13/01');
  await waitForPlayerId(page);
  await expect(page).toHaveURL('/2024/13/01');
  await expect(page.locator('[data-testid="game-container"]')).toBeVisible();
});

test('should show an inline message for an invalid archive month', async ({ page }) => {
  await page.goto('/archive/invalid-month-format');
  await waitForPlayerId(page);
  // No redirect - stays on the same URL with an inline message
  await expect(page).toHaveURL('/archive/invalid-month-format');
  await expect(page.locator('[data-testid="invalid-month"]')).toBeVisible();
});

// Future date tests - should redirect to rickroll page
test('should redirect future dates to rickroll page', async ({ page }) => {
  await page.goto(getTomorrowDatePath());
  await waitForPlayerId(page);
  // Wait for redirect to complete
  await page.waitForURL('/rickroll');
  // Should show rickroll content
  await expect(page.getByText('🎵')).toBeVisible();
  await expect(page.getByText('Enjoy this special game!')).toBeVisible();
});

// Future archive date tests - should show normal archive behavior
test('should show normal archive behavior for future archive dates', async ({ page }) => {
  const futureMonth = getTomorrowMonthPath();
  await page.goto(`/archive/${futureMonth}`);
  await waitForPlayerId(page);
  // Should stay on archive page (no redirect)
  await expect(page).toHaveURL(`/archive/${futureMonth}`);
  // Should show archive content normally
  await expect(page.locator('[data-testid="archive-title"]')).toBeVisible();
  // Should show the future month heading
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 1);
  const monthName = futureDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  await expect(page.getByRole('heading', { name: monthName })).toBeVisible();
});

test('should gracefully fall back to the rickroll game for a date with no game', async ({ page }) => {
  await page.goto(getPastDateWithNoGamePath());
  await waitForPlayerId(page);
  // No "not found" message exists - the app falls back to the rickroll game
  // in place, same as any other date it can't find a real game for.
  await expect(page.locator('[data-testid="game-container"]')).toBeVisible();
  await expect(page.locator('[data-testid="masked-lyrics"]:visible')).toBeVisible();
});
