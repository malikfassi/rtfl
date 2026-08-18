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
    // Note: there is a GameHeader.tsx file with data-testid="game-header",
    // but it's dead code - never imported by LyricsGame.tsx, which builds
    // its header inline instead - so that testid never appears in the DOM.
    await expect(page.locator('[data-testid="game-progress"]')).toBeVisible();
    // guess-history collapses to zero visible size when this (freshly
    // random) player has no guesses yet - check it's rendered rather than
    // requiring nonzero size.
    await expect(page.locator('[data-testid="guess-history"]')).toBeAttached();
    await expect(page.locator('[data-testid="masked-lyrics"]')).toBeVisible();
  });

  test('should show correct date information', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // ScrambleTitle renders the raw ISO date (yyyy-MM-dd, local time, same as
    // getCurrentDate() in lib/routes.ts), not a long weekday-format string.
    const todayFormatted = format(new Date(), 'yyyy-MM-dd');
    await expect(page.locator('[data-testid="date-display"]')).toContainText(todayFormatted);
  });

  test('should allow user interaction with game controls', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // There is no separate submit button - the form submits on Enter
    const inputField = page.locator('[data-testid="guess-input"]');
    await expect(inputField).toBeVisible();
    await expect(inputField).toBeEnabled();
  });

  test('should display game state correctly for new game', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Today's seeded game has zero guesses for this (freshly random) player -
    // guess-history collapses to zero visible size when empty (no min-height
    // set), so check it's rendered rather than requiring nonzero size.
    await expect(page.locator('[data-testid="guess-history"]')).toBeAttached();

    // A fresh game shouldn't show the win popup
    await expect(page.getByText('Congratulations', { exact: false })).not.toBeVisible();
  });

  test('should handle game interactions properly', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Submit a guess via Enter (no submit button exists)
    const inputField = page.locator('[data-testid="guess-input"]');
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
    const inputField = page.locator('[data-testid="guess-input"]');
    await inputField.press('Enter');
    await expect(inputField).toHaveValue('');
  });

  test('should have proper accessibility features', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Check for proper heading structure
    await expect(page.locator('h1').first()).toBeVisible();

    // Guess input has an aria-label
    const inputField = page.locator('[data-testid="guess-input"]');
    await expect(inputField).toHaveAttribute('aria-label');
  });
});
