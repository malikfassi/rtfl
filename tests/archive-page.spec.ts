import { test, expect } from '@playwright/test';
import { 
  YESTERDAY, 
  TWO_DAYS_AGO, 
  THREE_DAYS_AGO, 
  FUTURE_DATE 
} from './playwright-seed';

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
      
      // Should show games for the current month
      await expect(page.locator('[data-testid="game-calendar-day"]')).toBeVisible();
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
      
      // Get current month
      const currentMonth = new Date().toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      });
      
      // Click previous month
      await page.locator('[data-testid="prev-month"]').click();
      await page.waitForLoadState('networkidle');
      
      // Should show different month
      await expect(page.locator('[data-testid="month-display"]')).not.toContainText(currentMonth);
    });

    test('should navigate to next month (if not current)', async ({ page }) => {
      await page.goto('/archive');
      await page.waitForLoadState('networkidle');
      
      // Navigate to previous month first
      await page.locator('[data-testid="prev-month"]').click();
      await page.waitForLoadState('networkidle');
      
      // Now should be able to navigate to next month
      await page.locator('[data-testid="next-month"]').click();
      await page.waitForLoadState('networkidle');
      
      // Should show current month again
      const currentMonth = new Date().toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      });
      await expect(page.locator('[data-testid="month-display"]')).toContainText(currentMonth);
    });

    test('should disable next month navigation for current month', async ({ page }) => {
      await page.goto('/archive');
      await page.waitForLoadState('networkidle');
      
      // Next month button should be disabled for current month
      await expect(page.locator('[data-testid="next-month"]')).toBeDisabled();
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
      await page.goto('/archive/invalid-month');
      
      // Should redirect to home with error
      await expect(page).toHaveURL(/\/\?error=invalid_month/);
    });

    test('should handle future month', async ({ page }) => {
      const futureMonth = '2026-01';
      await page.goto(`/archive/${futureMonth}`);
      
      // Should redirect to home with error
      await expect(page).toHaveURL(/\/\?error=invalid_month/);
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
      
      // Should show games for dates we seeded
      const gameDays = page.locator('[data-testid="game-calendar-day"]');
      await expect(gameDays).toHaveCount(4); // Today, yesterday, 2 days ago, 3 days ago
    });

    test('should show game status indicators', async ({ page }) => {
      await page.goto('/archive');
      await page.waitForLoadState('networkidle');
      
      // Should show different indicators for games with/without guesses
      await expect(page.locator('[data-testid="game-with-guesses"]')).toBeVisible();
      await expect(page.locator('[data-testid="game-without-guesses"]')).toBeVisible();
    });

    test('should allow clicking on game days', async ({ page }) => {
      await page.goto('/archive');
      await page.waitForLoadState('networkidle');
      
      // Click on a game day
      const gameDay = page.locator('[data-testid="game-calendar-day"]').first();
      await gameDay.click();
      
      // Should navigate to the game page
      await expect(page).toHaveURL(/\/game\/\d{4}-\d{2}-\d{2}/);
    });
  });

  test.describe('Loading States', () => {
    test('should show loading state while fetching data', async ({ page }) => {
      // Navigate to archive page
      await page.goto('/archive');
      
      // Should show loading message initially
      await expect(page.locator('[data-testid="loading-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="loading-message"]')).toContainText('Loading games...');
      
      // Wait for data to load
      await page.waitForLoadState('networkidle');
      
      // Loading message should disappear
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
      
      // Should redirect to home with error
      await expect(page).toHaveURL(/\/\?error=invalid_month/);
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading structure', async ({ page }) => {
      await page.goto('/archive');
      await page.waitForLoadState('networkidle');
      
      // Should have proper heading hierarchy
      await expect(page.locator('h1')).toBeVisible();
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