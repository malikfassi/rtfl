# Frontend Component Updates TODO

## Guess Input Updates
- [x] Make placeholder in input shorter
- [x] Remove padding from guess-input class

## Guess History Updates  
- [x] Show hide no-hit guesses toggle only if 1 guess at least
- [x] Remove border top and margin top from guess-history

## Layout Updates
- [x] Put path to victory on top of input guess
- [x] Always display right column elements, remove conditions
- [x] Give more space to central column and less space to the right column

## Path to Victory Updates
- [x] Check computation of path to victory component data

## Implementation Order
1. ✅ Fix GuessInput component (placeholder + padding)
2. ✅ Fix GuessHistory component (toggle condition + border/margin)
3. ✅ Fix LyricsGame layout (column spacing + always show right column)
4. ✅ Fix PathToVictory data computation
5. ✅ Test all changes

## Summary of Changes Made

### GuessInput Component
- Shortened placeholder from "Type your guess and press Enter..." to "Type your guess..."
- Removed `guess-input` class from form element to remove padding

### GuessHistory Component  
- Added condition `filteredGuesses.length > 0` to only show toggle when there's at least 1 guess
- Removed `border-t border-primary-muted/10` classes from container

### LyricsGame Layout
- Moved PathToVictory above GuessInput in the left column
- Removed conditional rendering for ShareButton (now always shows)
- Changed grid from `grid-cols-[320px_1fr_320px]` to `grid-cols-[280px_1fr_280px]` for better spacing

### PathToVictory Data
- Replaced placeholder data with real computation based on gameState
- Calculates actual progress for lyrics, title, and artist based on valid guesses
- Counts total words and found words dynamically 