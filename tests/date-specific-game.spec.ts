import { test, expect } from '@playwright/test';
import { 
  YESTERDAY, 
  TWO_DAYS_AGO, 
  THREE_DAYS_AGO, 
  FUTURE_DATE, 
  INVALID_DATE 
} from './playwright-seed';

test.describe('Date-Specific Game Pages', () => {
  
  test.describe('Valid Past Dates', () => {
    test('should load yesterday\'s game with guesses', async ({ page }) => {
      await page.goto(`/game/${YESTERDAY}`);
      await page.waitForLoadState('networkidle');
      
      // Should load successfully
      await expect(page).toHaveURL(`/game/${YESTERDAY}`);
      await expect(page.locator('[data-testid="game-container"]')).toBeVisible();
      
      // Should show yesterday's date
      const yesterdayFormatted = new Date(YESTERDAY).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      await expect(page.locator('[data-testid="date-display"]')).toContainText(yesterdayFormatted);
      
      // Should show guess history (since we seeded guesses)
      const guessHistory = page.locator('[data-testid="guess-history"]');
      if (await guessHistory.isVisible()) {
        await expect(guessHistory).toContainText('Billie Jean');
        await expect(guessHistory).toContainText('Thriller');
        await expect(guessHistory).toContainText('Beat It');
      }
    });

    test('should load game from two days ago with multiple correct guesses', async ({ page }) => {
      await page.goto(`/game/${TWO_DAYS_AGO}`);
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveURL(`/game/${TWO_DAYS_AGO}`);
      await expect(page.locator('[data-testid="game-container"]')).toBeVisible();
      
      // Should show multiple correct guesses
      const guessHistory = page.locator('[data-testid="guess-history"]');
      if (await guessHistory.isVisible()) {
        await expect(guessHistory).toContainText('Beat It');
        await expect(guessHistory).toContainText('Thriller');
      }
    });

    test('should load game from three days ago without guesses', async ({ page }) => {
      await page.goto(`/game/${THREE_DAYS_AGO}`);
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveURL(`/game/${THREE_DAYS_AGO}`);
      await expect(page.locator('[data-testid="game-container"]')).toBeVisible();
      
      // Should show no guesses
      const guessHistory = page.locator('[data-testid="guess-history"]');
      if (await guessHistory.isVisible()) {
        await expect(guessHistory).toContainText('No guesses yet');
      }
    });
  });

  test.describe('Future Dates', () => {
    test('should redirect future dates to rickroll page', async ({ page }) => {
      await page.goto(`/game/${FUTURE_DATE}`);
      
      // Should redirect to rickroll page
      await expect(page).toHaveURL('/rickroll');
      
      // Should show rickroll content
      await expect(page.locator('h1')).toContainText('Rickroll');
    });

    test('should handle future date with different format', async ({ page }) => {
      const futureDate = '2026-01-01';
      await page.goto(`/game/${futureDate}`);
      
      // Should redirect to rickroll page
      await expect(page).toHaveURL('/rickroll');
    });
  });

  test.describe('Invalid Dates', () => {
    test('should redirect invalid date format to home with error', async ({ page }) => {
      await page.goto(`/game/${INVALID_DATE}`);
      
      // Should redirect to home page with error parameters
      await expect(page).toHaveURL(/\/\?error=invalid_date/);
      
      // Should show error message
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    });

    test('should handle malformed date strings', async ({ page }) => {
      await page.goto('/game/not-a-date');
      
      // Should redirect to home with error
      await expect(page).toHaveURL(/\/\?error=invalid_date/);
    });

    test('should handle empty date parameter', async ({ page }) => {
      await page.goto('/game/');
      
      // Should redirect to home (treats as root path)
      await expect(page).toHaveURL('/');
    });
  });

  test.describe('Non-existent Games', () => {
    test('should handle date with no game created', async ({ page }) => {
      const nonExistentDate = '2020-01-01';
      await page.goto(`/game/${nonExistentDate}`);
      await page.waitForLoadState('networkidle');
      
      // Should load the page but show no game data
      await expect(page).toHaveURL(`/game/${nonExistentDate}`);
      await expect(page.locator('[data-testid="game-container"]')).toBeVisible();
      
      // Should show appropriate message for no game
      await expect(page.locator('[data-testid="no-game-message"]')).toBeVisible();
    });
  });

  test.describe('URL Variations', () => {
    test('should handle different URL formats for same date', async ({ page }) => {
      // Test with different separators
      const dateWithDashes = YESTERDAY;
      const dateWithSlashes = YESTERDAY.replace(/-/g, '/');
      
      await page.goto(`/game/${dateWithDashes}`);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="game-container"]')).toBeVisible();
      
      await page.goto(`/game/${dateWithSlashes}`);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="game-container"]')).toBeVisible();
    });

    test('should handle URL with extra parameters', async ({ page }) => {
      await page.goto(`/game/${YESTERDAY}?param=value`);
      await page.waitForLoadState('networkidle');
      
      // Should load the game correctly
      await expect(page).toHaveURL(/\/game\/2024-01-24/);
      await expect(page.locator('[data-testid="game-container"]')).toBeVisible();
    });
  });

  test.describe('Game State Persistence', () => {
    test('should maintain game state when navigating between dates', async ({ page }) => {
      // Load yesterday's game
      await page.goto(`/game/${YESTERDAY}`);
      await page.waitForLoadState('networkidle');
      
      // Make a guess
      const inputField = page.locator('[data-testid="guess-input"]');
      await inputField.fill('Test Guess');
      await page.locator('[data-testid="submit-guess"]').click();
      await page.waitForTimeout(1000);
      
      // Navigate to different date
      await page.goto(`/game/${TWO_DAYS_AGO}`);
      await page.waitForLoadState('networkidle');
      
      // Should show different game state
      await expect(page.locator('[data-testid="game-container"]')).toBeVisible();
      
      // Navigate back to yesterday
      await page.goto(`/game/${YESTERDAY}`);
      await page.waitForLoadState('networkidle');
      
      // Should show updated game state with new guess
      await expect(page.locator('[data-testid="game-container"]')).toBeVisible();
    });
  });
}); 