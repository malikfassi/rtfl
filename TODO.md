# RTFL Game TODO List

## High Priority

### Routing & Structure
- [x] Update Next.js config to simplify routes
- [x] Set up root route (`/`) to show today's game
- [ ] Add "Never Gonna Give You Up" as default song for invalid dates

### Core Game Features
- [x] Show games in calendar format in archive
- [x] Game Date Display
  - [x] Create DateDisplay component
    - [x] Show formatted date for archived games
    - [x] Show countdown to tomorrow for today's game
    - [x] Handle timezone differences
- [x] Maintain input focus after guess submission
- [x] Track and display number of hits per guess
- [x] Add game completion features
  - [x] Integrate Spotify player when song is revealed
  - [x] Add reveal lyrics button for won games
    - [x] Smooth transition for revealing words
    - [x] Different colors for revealed vs guessed words

## Visual Enhancements

### Progress Bar
- [x] Add glowing indicator at 80% mark
- [x] Enhance progress bar visual feedback

### Animations
- [x] Implement scramble title animation
  - [x] Individual letter scrambling
  - [x] 3-second pause between scrambles
  - [x] Slot machine-like effect
- [x] Add found word animations
  - [x] Implement word diff tracking
  - [x] Add landing animation
  - [x] Add fade-in effect

### Styling Updates
- [x] Update guess list styling
  - [x] Remove background colors
  - [x] Use color-coded text based on validity and number of hits
  - [x] Reduce player ID font size
- [x] Add hover effects
  - [x] Highlight corresponding lyrics on guess hover
- [x] Update MaskedLyrics layout
  - [x] Remove Title and Artist labels
  - [x] Show as "MaskedTitle by Masked Artist"

## Technical Debt
- [x] Ensure proper color inheritance
- [x] Review and update color palette implementation

## Word Count Fix
- [ ] Fix percentage calculation to count words instead of characters
- [ ] Update progress display to reflect accurate word count

## Guess History Improvements
- [ ] Add hit marker (×1) even for single hits
- [ ] Add background color on hover for guesses in list
- [ ] Remove "All Guesses:" label
- [ ] Add cursor-pointer to guesses
- [ ] Enhance hover effect beyond just scaling
- [ ] Apply consistent color scheme from ScrambleTitle

## Input Focus & Error Handling
- [ ] Fix input focus retention after submitting
- [ ] Remove all toast mechanisms
- [ ] Show error messages below input
- [ ] Ensure error messages use our color system

## Progress Bar Enhancements
- [ ] Fix WIN! message positioning (make absolute)
- [ ] Apply consistent color scheme from ScrambleTitle
- [ ] Ensure 80% marker is clearly visible
- [ ] Update progress bar colors to match our theme

## Game Progress
- [x] Fix percentage calculation (count unique words)
- [x] Add glowing indicator at 80% mark
- [ ] Add hover animation on progress bar
- [ ] Remove duplicated Progress label and percentage

## Guess History
- [x] Add hit marker for single hits
- [ ] Implement background color on hover for guesses
- [ ] Order guesses with most recent first
- [ ] Add toggle button to hide 0-hit guesses
- [ ] On hover of a guess, highlight its contribution in the progress bar

## Input Focus & Error Handling
- [x] Keep focus on input after submitting
- [x] Remove toast notifications
- [x] Show error messages below input
- [ ] Remove remaining popups for request responses

## Progress Bar
- [ ] Fix WIN! message positioning to be absolute

## Color System
- [x] Ensure proper color inheritance
- [x] Review and update color palette implementation

## Current Progress
- Game completion at ~1% with a focus on fixing the word count calculation
