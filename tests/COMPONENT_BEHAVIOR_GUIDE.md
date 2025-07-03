# Component Behavior Guide for Playwright Tests

This document outlines all the components in the application and their expected behaviors for comprehensive testing.

## Root Page (`/`) - Today's Game

### Components to Test:

#### 1. Game Container (`[data-testid="game-container"]`)
- **Expected Behavior**: Main wrapper that contains all game elements
- **Should**: Be visible on page load
- **Should**: Contain all game sub-components

#### 2. Game Header (`[data-testid="game-header"]`)
- **Expected Behavior**: Displays game title and date information
- **Should**: Show today's date in readable format
- **Should**: Display game title/logo
- **Should**: Be visible at the top of the game

#### 3. Date Display (`[data-testid="date-display"]`)
- **Expected Behavior**: Shows the current game date
- **Should**: Display today's date in format: "Thursday, January 25, 2024"
- **Should**: Be prominently visible
- **Should**: Update when navigating to different dates

#### 4. Game Content (`[data-testid="game-content"]`)
- **Expected Behavior**: Main game area containing lyrics and controls
- **Should**: Be the primary focus area
- **Should**: Contain lyrics display and input controls

#### 5. Game Sidebar (`[data-testid="game-sidebar"]`)
- **Expected Behavior**: Side panel with game information and progress
- **Should**: Show game progress
- **Should**: Display guess history
- **Should**: Show game statistics

#### 6. Game Controls (`[data-testid="game-controls"]`)
- **Expected Behavior**: Input area for submitting guesses
- **Should**: Contain input field for guesses
- **Should**: Have submit button
- **Should**: Clear input after submission
- **Should**: Show validation errors for invalid input

#### 7. Guess Input (`[data-testid="guess-input"]`)
- **Expected Behavior**: Text input for entering guesses
- **Should**: Be enabled and focusable
- **Should**: Accept text input
- **Should**: Have proper accessibility attributes
- **Should**: Clear after successful submission

#### 8. Submit Guess (`[data-testid="submit-guess"]`)
- **Expected Behavior**: Button to submit the current guess
- **Should**: Be enabled when input has content
- **Should**: Be disabled for empty input
- **Should**: Have proper accessibility attributes
- **Should**: Trigger guess submission on click

#### 9. Masked Lyrics (`[data-testid="masked-lyrics"]`)
- **Expected Behavior**: Displays the song lyrics with masked words
- **Should**: Show lyrics with some words hidden/replaced
- **Should**: Be readable and properly formatted
- **Should**: Update as words are guessed correctly

#### 10. Game Progress (`[data-testid="game-progress"]`)
- **Expected Behavior**: Shows completion status of the game
- **Should**: Display progress percentage
- **Should**: Show number of words found vs total
- **Should**: Update in real-time as guesses are made

#### 11. Guess History (`[data-testid="guess-history"]`)
- **Expected Behavior**: Shows previous guesses made
- **Should**: Display "No guesses yet" for new games
- **Should**: Show list of previous guesses
- **Should**: Indicate correct/incorrect guesses
- **Should**: Update after each new guess

#### 12. Game Completion (`[data-testid="game-completion"]`)
- **Expected Behavior**: Shown when game is completed
- **Should**: Not be visible for incomplete games
- **Should**: Show completion message when all words found
- **Should**: Display final statistics
- **Should**: Show share options

#### 13. Error Message (`[data-testid="error-message"]`)
- **Expected Behavior**: Displays validation and error messages
- **Should**: Show for invalid input
- **Should**: Show for network errors
- **Should**: Be clearly visible and readable
- **Should**: Disappear when error is resolved

## Date-Specific Game Pages (`/game/[date]`)

### Additional Components:

#### 14. No Game Message (`[data-testid="no-game-message"]`)
- **Expected Behavior**: Shown when no game exists for the date
- **Should**: Display when game doesn't exist
- **Should**: Provide helpful message
- **Should**: Suggest alternative actions

### Expected Behaviors by Date Type:

#### Valid Past Dates:
- **Should**: Load game successfully
- **Should**: Show correct date in header
- **Should**: Display existing guesses if any
- **Should**: Allow new guesses
- **Should**: Show game progress

#### Future Dates:
- **Should**: Redirect to `/rickroll` page
- **Should**: Not load game content
- **Should**: Show rickroll content instead

#### Invalid Dates:
- **Should**: Redirect to home with error parameters
- **Should**: Show error message
- **Should**: Not load game content

#### Non-existent Games:
- **Should**: Load page structure
- **Should**: Show "no game" message
- **Should**: Not allow guessing

## Archive Page (`/archive`)

### Components to Test:

#### 15. Archive Container (`[data-testid="archive-container"]`)
- **Expected Behavior**: Main wrapper for archive page
- **Should**: Be visible on page load
- **Should**: Contain all archive components

#### 16. Archive Title (`[data-testid="archive-title"]`)
- **Expected Behavior**: Page title and branding
- **Should**: Show "Game Archive" title
- **Should**: Include scrambled title effect
- **Should**: Be prominently displayed

#### 17. Month Display (`[data-testid="month-display"]`)
- **Expected Behavior**: Shows current month being viewed
- **Should**: Display current month by default
- **Should**: Update when navigating months
- **Should**: Show format: "January 2024"

#### 18. Calendar View (`[data-testid="calendar-view"]`)
- **Expected Behavior**: Calendar grid showing games
- **Should**: Display calendar layout
- **Should**: Show days with games highlighted
- **Should**: Allow clicking on game days

#### 19. Game Calendar Day (`[data-testid="game-calendar-day"]`)
- **Expected Behavior**: Individual day cells in calendar
- **Should**: Show days with games
- **Should**: Indicate game status (with/without guesses)
- **Should**: Be clickable to navigate to game

#### 20. Game With Guesses (`[data-testid="game-with-guesses"]`)
- **Expected Behavior**: Calendar day indicator for games with guesses
- **Should**: Show visual indicator for games with guesses
- **Should**: Be distinguishable from games without guesses

#### 21. Game Without Guesses (`[data-testid="game-without-guesses"]`)
- **Expected Behavior**: Calendar day indicator for games without guesses
- **Should**: Show visual indicator for games without guesses
- **Should**: Be distinguishable from games with guesses

#### 22. Prev Month (`[data-testid="prev-month"]`)
- **Expected Behavior**: Navigation button for previous month
- **Should**: Be visible and clickable
- **Should**: Navigate to previous month when clicked
- **Should**: Have proper accessibility attributes

#### 23. Next Month (`[data-testid="next-month"]`)
- **Expected Behavior**: Navigation button for next month
- **Should**: Be disabled for current month
- **Should**: Be enabled for past months
- **Should**: Navigate to next month when clicked
- **Should**: Have proper accessibility attributes

#### 24. WIP Badge (`[data-testid="wip-badge"]`)
- **Expected Behavior**: "Work in progress" indicator
- **Should**: Show "Work in progress" text
- **Should**: Be styled as a badge
- **Should**: Be visible on archive page

#### 25. User ID Display (`[data-testid="user-id-display"]`)
- **Expected Behavior**: Shows current user ID for debugging
- **Should**: Display "User ID: [id]"
- **Should**: Show selectable user ID
- **Should**: Be visible for debugging purposes

#### 26. Loading Message (`[data-testid="loading-message"]`)
- **Expected Behavior**: Shows while data is loading
- **Should**: Display "Loading games..." text
- **Should**: Be visible during initial load
- **Should**: Disappear when data loads

#### 27. Empty Month (`[data-testid="empty-month"]`)
- **Expected Behavior**: Shown when month has no games
- **Should**: Display when no games exist for month
- **Should**: Provide helpful message
- **Should**: Suggest alternative actions

#### 28. Error State (`[data-testid="error-state"]`)
- **Expected Behavior**: Shown when errors occur
- **Should**: Display for network errors
- **Should**: Show error message
- **Should**: Provide retry options

## Archive with Specific Month (`/archive/[month]`)

### Expected Behaviors:

#### Valid Past Months:
- **Should**: Load archive for specific month
- **Should**: Show correct month in display
- **Should**: Display games for that month
- **Should**: Allow navigation to other months

#### Invalid Month Format:
- **Should**: Redirect to home with error
- **Should**: Show error message
- **Should**: Not load archive content

#### Future Months:
- **Should**: Redirect to home with error
- **Should**: Show error message
- **Should**: Not allow viewing future months

#### Empty Months:
- **Should**: Load archive structure
- **Should**: Show empty state message
- **Should**: Allow navigation to other months

## Accessibility Requirements

### General Accessibility:
- **Should**: Have proper heading hierarchy (h1, h2, etc.)
- **Should**: Include ARIA labels on interactive elements
- **Should**: Support keyboard navigation
- **Should**: Have sufficient color contrast
- **Should**: Include alt text for images

### Form Accessibility:
- **Should**: Have labeled form inputs
- **Should**: Show validation errors clearly
- **Should**: Support screen readers
- **Should**: Have focus indicators

### Navigation Accessibility:
- **Should**: Have clear navigation labels
- **Should**: Support keyboard navigation
- **Should**: Include skip links where appropriate
- **Should**: Have proper button roles

## Error Handling

### Network Errors:
- **Should**: Show error state
- **Should**: Provide retry options
- **Should**: Not crash the application
- **Should**: Maintain UI structure

### Validation Errors:
- **Should**: Show clear error messages
- **Should**: Highlight problematic fields
- **Should**: Provide guidance on how to fix
- **Should**: Not prevent further interaction

### Invalid Input:
- **Should**: Validate input before submission
- **Should**: Show specific error messages
- **Should**: Prevent invalid submissions
- **Should**: Clear errors when input is corrected

## Performance Expectations

### Loading States:
- **Should**: Show loading indicators
- **Should**: Not freeze the UI
- **Should**: Provide feedback on progress
- **Should**: Handle timeouts gracefully

### Responsiveness:
- **Should**: Work on different screen sizes
- **Should**: Handle different network speeds
- **Should**: Maintain functionality during slow connections
- **Should**: Provide fallback states

## Test Data Scenarios

### Games Created in Database:
1. **Today's Game**: New game, no guesses
2. **Yesterday's Game**: Game with 3 guesses (1 correct, 2 incorrect)
3. **Two Days Ago**: Game with 3 guesses (2 correct, 1 incorrect)
4. **Three Days Ago**: Game with no guesses
5. **Future Game**: Game for future date (should redirect to rickroll)

### Player IDs:
- `test-player-1`: Player with correct guesses
- `test-player-2`: Player with mixed results
- `test-player-3`: Player with incorrect guesses

### Test Dates:
- `TODAY`: Current date
- `YESTERDAY`: Yesterday's date
- `TWO_DAYS_AGO`: Two days ago
- `THREE_DAYS_AGO`: Three days ago
- `FUTURE_DATE`: Future date (2025-12-25)
- `INVALID_DATE`: Invalid date format (2024-13-45)

This guide should be used as a reference when writing and maintaining Playwright tests to ensure comprehensive coverage of all components and their expected behaviors. 