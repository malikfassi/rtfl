import { test, expect } from '@playwright/test';
import { TODAY } from './playwright-seed';

test.describe('Root Page (Today\'s Game)', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to root page
    await page.goto('/');
  });

  test('should load today\'s game successfully', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check that we're on the game page
    await expect(page).toHaveURL('/');
    
    // Check that the main game container is present
    await expect(page.locator('[data-testid="game-container"]')).toBeVisible();
  });

  test('should display game components correctly', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Check for main game components
    await expect(page.locator('[data-testid="game-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="game-content"]')).toBeVisible();
    await expect(page.locator('[data-testid="game-sidebar"]')).toBeVisible();
    
    // Check for game controls
    await expect(page.locator('[data-testid="game-controls"]')).toBeVisible();
    
    // Check for lyrics display
    await expect(page.locator('[data-testid="masked-lyrics"]')).toBeVisible();
    
    // Check for progress indicator
    await expect(page.locator('[data-testid="game-progress"]')).toBeVisible();
  });

  test('should show correct date information', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Check that today's date is displayed
    const todayFormatted = new Date(TODAY).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    await expect(page.locator('[data-testid="date-display"]')).toContainText(todayFormatted);
  });

  test('should allow user interaction with game controls', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Check that input field is present and enabled
    const inputField = page.locator('[data-testid="guess-input"]');
    await expect(inputField).toBeVisible();
    await expect(inputField).toBeEnabled();
    
    // Check that submit button is present
    await expect(page.locator('[data-testid="submit-guess"]')).toBeVisible();
  });

  test('should display game state correctly for new game', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // For a new game, we should see:
    // - No previous guesses
    // - Game not completed
    // - Progress at 0%
    
    const guessHistory = page.locator('[data-testid="guess-history"]');
    if (await guessHistory.isVisible()) {
      await expect(guessHistory).toContainText('No guesses yet');
    }
    
    // Check that game completion is not shown
    await expect(page.locator('[data-testid="game-completion"]')).not.toBeVisible();
  });

  test('should handle game interactions properly', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Test entering a guess
    const inputField = page.locator('[data-testid="guess-input"]');
    await inputField.fill('Test Guess');
    
    // Submit the guess
    await page.locator('[data-testid="submit-guess"]').click();
    
    // Wait for the guess to be processed
    await page.waitForTimeout(1000);
    
    // Check that the input is cleared after submission
    await expect(inputField).toHaveValue('');
  });

  test('should display error states appropriately', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Test submitting empty guess
    await page.locator('[data-testid="submit-guess"]').click();
    
    // Should show validation error
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  });

  test('should have proper accessibility features', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Check for proper heading structure
    await expect(page.locator('h1')).toBeVisible();
    
    // Check for proper form labels
    const inputField = page.locator('[data-testid="guess-input"]');
    await expect(inputField).toHaveAttribute('aria-label');
    
    // Check for proper button labels
    const submitButton = page.locator('[data-testid="submit-guess"]');
    await expect(submitButton).toHaveAttribute('aria-label');
  });
}); 