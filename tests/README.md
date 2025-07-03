# Playwright E2E Test Suite

This directory contains comprehensive end-to-end tests for the RTFL application using Playwright.

## Overview

The test suite is designed to test the complete user experience across different scenarios:

- **Root Page**: Testing today's game functionality
- **Date-Specific Games**: Testing games for specific dates (past, future, invalid)
- **Archive Page**: Testing the game archive and calendar functionality
- **Error Handling**: Testing various error scenarios and edge cases

## Test Structure

```
tests/
├── README.md                           # This file
├── COMPONENT_BEHAVIOR_GUIDE.md        # Detailed component behavior documentation
├── global-setup.ts                     # Database seeding setup
├── playwright-seed.ts                  # Test data creation
├── root-page.spec.ts                   # Tests for root page (today's game)
├── date-specific-game.spec.ts          # Tests for specific date games
└── archive-page.spec.ts                # Tests for archive functionality
```

## Test Data

The test suite uses a dedicated test database (`prisma/test-playwright.db`) with pre-seeded data:

### Games Created:
1. **Today's Game**: New game with no guesses
2. **Yesterday's Game**: Game with 3 guesses (1 correct, 2 incorrect)
3. **Two Days Ago**: Game with 3 guesses (2 correct, 1 incorrect)
4. **Three Days Ago**: Game with no guesses
5. **Future Game**: Game for future date (redirects to rickroll)

### Test Players:
- `test-player-1`: Player with correct guesses
- `test-player-2`: Player with mixed results
- `test-player-3`: Player with incorrect guesses

## Running Tests

### Prerequisites

1. Install Playwright browsers:
```bash
npm run test:e2e:install
```

2. Ensure the database is set up:
```bash
npm run prisma:generate
```

### Basic Test Commands

```bash
# Run all tests
npm run test:e2e

# Run tests with UI (interactive)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Run tests in debug mode
npm run test:e2e:debug

# Show test report
npm run test:e2e:report
```

### Test Configuration

The tests are configured in `playwright.config.ts`:

- **Base URL**: `http://localhost:3000`
- **Test Database**: `file:./prisma/test-playwright.db`
- **Browsers**: Chrome, Firefox, Safari
- **Global Setup**: Automatically seeds database before tests

## Test Scenarios

### Root Page Tests (`root-page.spec.ts`)

Tests the main game page (today's game):

- ✅ Page loads successfully
- ✅ All game components are displayed
- ✅ Date information is correct
- ✅ User interactions work properly
- ✅ Game state is managed correctly
- ✅ Error states are handled
- ✅ Accessibility features are present

### Date-Specific Game Tests (`date-specific-game.spec.ts`)

Tests games for specific dates:

- ✅ Valid past dates load correctly
- ✅ Future dates redirect to rickroll
- ✅ Invalid dates show error messages
- ✅ Non-existent games handle gracefully
- ✅ URL variations work properly
- ✅ Game state persists between navigation

### Archive Page Tests (`archive-page.spec.ts`)

Tests the archive functionality:

- ✅ Archive page loads correctly
- ✅ Month navigation works
- ✅ Calendar view displays games
- ✅ Specific month URLs work
- ✅ Error handling for invalid months
- ✅ Loading states are shown
- ✅ Accessibility requirements are met

## Component Testing

Each test uses data-testid attributes to locate and test specific components. See `COMPONENT_BEHAVIOR_GUIDE.md` for detailed documentation of:

- All components and their expected behaviors
- Accessibility requirements
- Error handling scenarios
- Performance expectations

## Database Setup

The test database is automatically created and seeded before running tests:

1. **Global Setup**: `global-setup.ts` runs before all tests
2. **Database Seeding**: `playwright-seed.ts` creates test data
3. **Isolated Environment**: Each test run uses fresh data

### Manual Database Setup

If you need to manually set up the test database:

```bash
# Create and seed the test database
DATABASE_URL=file:./prisma/test-playwright.db npx tsx tests/playwright-seed.ts
```

## Debugging Tests

### Using the UI Mode

```bash
npm run test:e2e:ui
```

This opens an interactive UI where you can:
- See test results in real-time
- Debug individual tests
- View screenshots and videos
- Step through test execution

### Using Debug Mode

```bash
npm run test:e2e:debug
```

This runs tests in debug mode with:
- Browser visible during execution
- Step-by-step execution
- Pause on failures

### Viewing Test Reports

```bash
npm run test:e2e:report
```

This opens the HTML test report showing:
- Test results and statistics
- Screenshots of failures
- Videos of test execution
- Performance metrics

## Writing New Tests

### Adding Test Data

1. Update `playwright-seed.ts` to add new test scenarios
2. Export new constants for use in tests
3. Update the component behavior guide

### Creating New Test Files

1. Create a new `.spec.ts` file in the `tests/` directory
2. Import test utilities and constants
3. Use the component behavior guide for test expectations
4. Add data-testid attributes to components being tested

### Example Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup for each test
  });

  test('should do something specific', async ({ page }) => {
    // Test implementation
    await expect(page.locator('[data-testid="component"]')).toBeVisible();
  });
});
```

## Best Practices

### Test Organization
- Group related tests using `test.describe()`
- Use descriptive test names
- Follow the component behavior guide
- Test both success and failure scenarios

### Data Management
- Use the seeded test data
- Don't modify test data during tests
- Clean up any test-specific data
- Use constants for test values

### Error Handling
- Test error scenarios explicitly
- Verify error messages are displayed
- Test recovery from errors
- Ensure graceful degradation

### Accessibility
- Test keyboard navigation
- Verify ARIA labels
- Check color contrast
- Test screen reader compatibility

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Ensure Prisma is generated: `npm run prisma:generate`
   - Check database file permissions
   - Verify DATABASE_URL is correct

2. **Test Failures**
   - Check component data-testid attributes
   - Verify test data is seeded correctly
   - Review component behavior guide
   - Check for timing issues

3. **Browser Issues**
   - Reinstall browsers: `npm run test:e2e:install`
   - Clear browser cache
   - Check browser compatibility

### Getting Help

1. Check the component behavior guide
2. Review test reports for detailed failure information
3. Use debug mode to step through failing tests
4. Check the application logs for errors

## Continuous Integration

The test suite is designed to run in CI environments:

- Uses isolated test database
- Supports parallel execution
- Generates HTML reports
- Handles cleanup automatically

Configure your CI to run:
```bash
npm run test:e2e
```

## Contributing

When adding new features or components:

1. Update the component behavior guide
2. Add corresponding test cases
3. Ensure all scenarios are covered
4. Maintain test data consistency
5. Update this README if needed 