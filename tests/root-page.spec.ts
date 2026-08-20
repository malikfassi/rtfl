import { test, expect } from '@playwright/test';
import { format } from 'date-fns';

test.describe('Root Page (Today\'s Game)', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to root page
    await page.goto('/');
  });

  test('should load today\'s game successfully', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Check that we're on the game page
    await expect(page).toHaveURL('/');

    // Check that the main game container is present
    await expect(page.locator('[data-testid="game-container"]')).toBeVisible();
  });

  test('should display game components correctly', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Check for the components that actually exist on LyricsGame.
    // game-progress is emitted twice - the desktop rail and the mobile
    // bottom bar are both mounted at all times, one hidden by a `lg:`
    // class - so scope to the one this viewport actually shows rather
    // than tripping Playwright's strict mode on two matches.
    await expect(page.locator('[data-testid="game-progress"]:visible')).toBeVisible();
    // guess-history collapses to zero visible size when this (freshly
    // random) player has no guesses yet - check it's rendered rather than
    // requiring nonzero size.
    await expect(page.locator('[data-testid="guess-history"]')).toBeAttached();
    await expect(page.locator('[data-testid="masked-lyrics"]:visible')).toBeVisible();
  });

  test('should show correct date information', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // ScrambleTitle renders the raw ISO date (yyyy-MM-dd, local time, same as
    // getCurrentDate() in lib/routes.ts), not a long weekday-format string.
    const todayFormatted = format(new Date(), 'yyyy-MM-dd');
    await expect(page.locator('[data-testid="date-display"]:visible')).toContainText(todayFormatted);
  });

  test('should allow user interaction with game controls', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // There is no separate submit button - the form submits on Enter.
    // `:visible` for the same reason as game-progress above: the desktop
    // rail and the mobile bottom bar each render their own GuessInput.
    const inputField = page.locator('[data-testid="guess-input"]:visible');
    await expect(inputField).toBeVisible();
    await expect(inputField).toBeEnabled();
  });

  test('should display game state correctly for new game', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Today's seeded game has zero guesses for this (freshly random) player -
    // guess-history collapses to zero visible size when empty (no min-height
    // set), so check it's rendered rather than requiring nonzero size.
    await expect(page.locator('[data-testid="guess-history"]')).toBeAttached();

    // A fresh game shouldn't show the win state. The redesign replaced the
    // "Congratulations" modal with an inline panel stamped `✓ won on the
    // lyrics` / `the credits` / `both`, so that stamp is what must be absent.
    await expect(page.getByText(/won on (the lyrics|the credits|both)/)).toHaveCount(0);
  });

  test('should handle game interactions properly', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Submit a guess via Enter (no submit button exists)
    const inputField = page.locator('[data-testid="guess-input"]:visible');
    await inputField.fill('testguess');
    await inputField.press('Enter');
    await page.waitForTimeout(1000);

    // GuessInput keeps and re-selects the submitted word rather than clearing it
    await expect(inputField).toHaveValue('testguess');
  });

  test('should not error on empty submission', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Submitting an empty guess is a client-side no-op (handleSubmit returns
    // early when the trimmed value is empty) - no error UI, no crash.
    const inputField = page.locator('[data-testid="guess-input"]:visible');
    await inputField.press('Enter');
    await expect(inputField).toHaveValue('');
  });

  test('should have proper accessibility features', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Check for proper heading structure
    await expect(page.locator('h1').first()).toBeVisible();

    // Guess input has an aria-label
    const inputField = page.locator('[data-testid="guess-input"]:visible');
    await expect(inputField).toHaveAttribute('aria-label');
  });
});
