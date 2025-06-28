import { test, expect, Page } from '@playwright/test';

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
  await expect(page.locator('h1.text-2xl.sm\\:text-3xl.md\\:text-4xl.font-bold.text-center.leading-tight')).toBeVisible();
  // Check for the month heading (e.g., June 2025)
  await expect(page.getByRole('heading', { name: /june 2025|july 2025|august 2025|september 2025|october 2025|november 2025|december 2025|january 2025|february 2025|march 2025|april 2025|may 2025/i })).toBeVisible();
});

test('should show archive page for valid month format', async ({ page }) => {
  await page.goto('/archive/2024-01');
  await waitForPlayerId(page);
  // Should show archive content
  await expect(page.locator('h1.text-2xl.sm\\:text-3xl.md\\:text-4xl.font-bold.text-center.leading-tight')).toBeVisible();
  await expect(page.getByRole('heading', { name: /january 2024/i })).toBeVisible();
});

test('should handle valid date paths', async ({ page }) => {
  await page.goto(getTodayDatePath());
  await waitForPlayerId(page);
  await expect(page.getByRole('heading', { name: /read the.*lyrics/i })).toBeVisible();
});

// Routing error tests - should redirect to home with error popup
test('should redirect invalid URLs to home with error popup', async ({ page }) => {
  await page.goto('/invalid-url');
  await waitForPlayerId(page);
  // Wait for redirect to complete
  await page.waitForURL('/');
  // Should show error popup
  await expect(page.getByText('Page not found')).toBeVisible();
});

test('should redirect invalid multi-segment URLs to home with error popup', async ({ page }) => {
  await page.goto('/invalid/url/with/multiple/segments');
  await waitForPlayerId(page);
  // Wait for redirect to complete
  await page.waitForURL('/');
  // Should show error popup
  await expect(page.getByText('Page not found')).toBeVisible();
});

test('should redirect invalid date format to home with error popup', async ({ page }) => {
  await page.goto('/2024/13/01');
  await waitForPlayerId(page);
  // Wait for redirect to complete with error parameters
  await page.waitForURL(/\?error=invalid_date/);
  // Should show error popup
  await expect(page.getByText('Invalid date format. Please use YYYY-MM-DD')).toBeVisible();
});

test('should redirect invalid archive month to home with error popup', async ({ page }) => {
  await page.goto('/archive/invalid-month-format');
  await waitForPlayerId(page);
  // Wait for redirect to complete with error parameters
  await page.waitForURL(/\?error=invalid_month/);
  // Should show error popup
  await expect(page.getByText('Invalid month format. Please use YYYY-MM')).toBeVisible();
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
  await expect(page.locator('h1.text-2xl.sm\\:text-3xl.md\\:text-4xl.font-bold.text-center.leading-tight')).toBeVisible();
  // Should show the future month heading
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 1);
  const monthName = futureDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  await expect(page.getByRole('heading', { name: monthName })).toBeVisible();
});

test('should handle game not found gracefully', async ({ page }) => {
  await page.goto(getPastDateWithNoGamePath());
  await waitForPlayerId(page);
  // Should show game not found error
  await expect(page.getByText('Game not found')).toBeVisible();
  await expect(page.getByText('The requested game could not be found')).toBeVisible();
}); 