# Calendar and Game Editor Improvements Plan

## Calendar State Management

### Request States
- [ ] Fix game request pending to only update state for the specific date
- [ ] Preserve request states per date even after requests complete
- [ ] Clear request results ONLY when date-to-song mapping changes (e.g., selecting new song, new playlist, shuffle)
- [ ] Keep showing potential edit states in calendar for other dates
- [ ] Preserve ALL request results after operations complete (success/error states)

### Calendar Click Behavior
- [ ] Implement correct click behavior:
  ```typescript
  if (selectedDates.length > 1) {
    // Multi-select mode
    if (clickedDate is selected) {
      // Remove from selection
      newSelection = selectedDates.filter(d => !isSameDay(d, clickedDate))
    } else {
      // Add to selection
      newSelection = [...selectedDates, clickedDate]
    }
  } else {
    // Single/Empty selection mode
    if (clickedDate is selected) {
      // Do nothing
      return
    } else {
      // Switch to this date
      newSelection = [clickedDate]
    }
  }
  ```

## Batch Edit Mode

- [ ] Clicking on search input should return to playlist list view
- [ ] Track pending edits per date
- [ ] Show loading states during operations
- [ ] Preserve ALL request results after operations complete

## Single Edit Mode

- [ ] Implement track search API route:
  ```typescript
  // pages/api/admin/tracks/search.ts
  export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q')
    // Implement Spotify track search
    // Return formatted results
  }
  ```

## Implementation Order

1. Fix calendar click behavior
2. Implement track search API
3. Fix request state management
