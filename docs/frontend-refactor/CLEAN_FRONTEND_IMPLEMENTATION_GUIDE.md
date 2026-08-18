# Clean Frontend Implementation Guide

## Overview

This guide provides step-by-step instructions to build a new clean frontend architecture from scratch while preserving the existing implementation. The new architecture follows these principles:

- **Trust the Backend**: Display data exactly as provided
- **Minimal State**: Only UI interactions, no business logic
- **Clean Separation**: Pure display vs interaction components
- **Optimistic Updates**: Immediate feedback with backend sync

## Prerequisites

- Existing frontend in `src/app/front/components/game/lyrics-game/`
- Backend API providing `GameState` with pre-masked tokens
- React Query for data fetching
- TypeScript for type safety

## Implementation Steps

### Step 1: Backup Current Frontend

**Goal**: Preserve existing implementation as fallback

```bash
# Create backup directory
mkdir -p src/app/front/components/game/lyrics-game-old

# Move current implementation
mv src/app/front/components/game/lyrics-game/* src/app/front/components/game/lyrics-game-old/

# Keep the directory structure
mkdir -p src/app/front/components/game/lyrics-game
```

**Verification**: 
- Old components are safely backed up
- New directory is empty and ready

### Step 2: Setup New Directory Structure

**Goal**: Create clean directory structure for new components

```bash
# Create new component files
touch src/app/front/components/game/lyrics-game/LyricsGame.tsx
touch src/app/front/components/game/lyrics-game/MaskedLyricsDisplay.tsx
touch src/app/front/components/game/lyrics-game/GameHeader.tsx
touch src/app/front/components/game/lyrics-game/GuessInput.tsx
touch src/app/front/components/game/lyrics-game/GuessHistory.tsx
touch src/app/front/components/game/lyrics-game/GameCompletion.tsx
touch src/app/front/components/game/lyrics-game/index.ts
touch src/app/front/components/game/lyrics-game/styles.css
```

**Directory Structure**:
```
lyrics-game/
├── LyricsGame.tsx           # Container component
├── MaskedLyricsDisplay.tsx  # Pure display component
├── GameHeader.tsx           # Header display
├── GuessInput.tsx           # Input form
├── GuessHistory.tsx         # Guess list with interactions
├── GameCompletion.tsx       # Win state component
├── index.ts                 # Exports
└── styles.css               # Component styles
```

### Step 3: Create Simplified Types

**Goal**: Define clean TypeScript interfaces

**File**: `src/app/front/components/game/lyrics-game/types.ts`

```typescript
import type { Token, Guess } from '@/app/types';

export interface LyricsGameProps {
  date: string;
}

export interface MaskedLyricsDisplayProps {
  title?: Token[];
  artist?: Token[];
  lyrics?: Token[];
  highlightedWord: string | null;
  scrollToWord: string | null;
  showFullLyrics: boolean;
  fullSongData?: {
    title: string;
    artist: string;
    lyrics: string;
  };
}

export interface GameHeaderProps {
  date: string;
  isGameWon: boolean;
  guessCount: number;
}

export interface GuessInputProps {
  onGuessSubmit: (guess: string) => Promise<void>;
  pendingGuess: string | null;
  disabled: boolean;
}

export interface GuessHistoryProps {
  guesses: Guess[];
  highlightedWord: string | null;
  onGuessHover: (word: string | null) => void;
  onGuessClick: (word: string) => void;
}

export interface GameCompletionProps {
  songData: {
    title: string;
    artist: string;
    lyrics: string;
  };
  guessCount: number;
  showFullLyrics: boolean;
  onShowFullLyrics: () => void;
  onShare: () => void;
}
```

### Step 4: Build MaskedLyricsDisplay Component

**Goal**: Create pure display component with no event handlers

**File**: `src/app/front/components/game/lyrics-game/MaskedLyricsDisplay.tsx`

```typescript
import { useRef, useEffect } from 'react';
import { cn } from '@/app/front/lib/utils';
import type { MaskedLyricsDisplayProps } from './types';

export const MaskedLyricsDisplay = ({
  title,
  artist,
  lyrics,
  highlightedWord,
  scrollToWord,
  showFullLyrics,
  fullSongData
}: MaskedLyricsDisplayProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to selected word
  useEffect(() => {
    if (scrollToWord && scrollContainerRef.current) {
      const targetElement = scrollContainerRef.current.querySelector(
        `[data-word="${scrollToWord}"]`
      );
      targetElement?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  }, [scrollToWord]);
  
  const renderTokens = (tokens: Token[], section: string) => {
    return tokens.map((token, index) => {
      const isGuessable = token.isToGuess;
      const isHighlighted = isGuessable && highlightedWord === token.value;
      
      return (
        <span
          key={`${section}-${index}`}
          className={cn(
            'token',
            isGuessable && 'guessable',
            isHighlighted && 'highlighted'
          )}
          data-word={isGuessable ? token.value : undefined}
        >
          {token.value}
        </span>
      );
    });
  };
  
  // Show full lyrics if requested
  if (showFullLyrics && fullSongData) {
    return (
      <div className="full-lyrics-display">
        <h2 className="song-title">{fullSongData.title}</h2>
        <h3 className="song-artist">{fullSongData.artist}</h3>
        <div className="lyrics-content">
          {fullSongData.lyrics.split('\n').map((line, i) => (
            <div key={i} className="lyrics-line">{line}</div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div ref={scrollContainerRef} className="masked-lyrics-display">
      {title && (
        <div className="title-section">
          {renderTokens(title, 'title')}
        </div>
      )}
      
      {artist && (
        <div className="artist-section">
          {renderTokens(artist, 'artist')}
        </div>
      )}
      
      {lyrics && (
        <div className="lyrics-section">
          {renderTokens(lyrics, 'lyrics')}
        </div>
      )}
    </div>
  );
};
```

**Key Points**:
- Pure display component - no event handlers
- Trusts backend masking completely
- Auto-scroll functionality for selected words
- Conditional full lyrics display

### Step 5: Build GameHeader Component

**Goal**: Simple header showing game metadata

**File**: `src/app/front/components/game/lyrics-game/GameHeader.tsx`

```typescript
import type { GameHeaderProps } from './types';

export const GameHeader = ({ date, isGameWon, guessCount }: GameHeaderProps) => {
  const formattedDate = new Date(date).toLocaleDateString();
  
  return (
    <header className="game-header">
      <div className="game-info">
        <h1>Lyrics Game</h1>
        <div className="game-meta">
          <span className="game-date">{formattedDate}</span>
          <span className="guess-count">{guessCount} guesses</span>
          {isGameWon && (
            <span className="win-badge">🎉 Completed!</span>
          )}
        </div>
      </div>
    </header>
  );
};
```

### Step 6: Build GuessInput Component

**Goal**: Form with optimistic updates and validation

**File**: `src/app/front/components/game/lyrics-game/GuessInput.tsx`

```typescript
import { useState, FormEvent } from 'react';
import { cn } from '@/app/front/lib/utils';
import type { GuessInputProps } from './types';

export const GuessInput = ({ onGuessSubmit, pendingGuess, disabled }: GuessInputProps) => {
  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const guess = input.trim().toLowerCase();
    
    if (!guess || disabled || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await onGuessSubmit(guess);
      setInput(''); // Clear on success
    } catch (error) {
      // Error handling - input stays for retry
      console.error('Guess failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="guess-input">
      <div className="input-group">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={disabled ? "Game completed!" : "Enter your guess..."}
          disabled={disabled || isSubmitting}
          className={cn(
            'guess-field',
            pendingGuess && 'pending',
            disabled && 'disabled'
          )}
        />
        <button
          type="submit"
          disabled={!input.trim() || disabled || isSubmitting}
          className="submit-button"
        >
          {isSubmitting ? 'Submitting...' : 'Guess'}
        </button>
      </div>
      
      {pendingGuess && (
        <div className="pending-feedback">
          Checking "{pendingGuess}"...
        </div>
      )}
    </form>
  );
};
```

### Step 7: Build GuessHistory Component

**Goal**: Display guesses with word interaction handling

**File**: `src/app/front/components/game/lyrics-game/GuessHistory.tsx`

```typescript
import { cn } from '@/app/front/lib/utils';
import type { GuessHistoryProps } from './types';

export const GuessHistory = ({ 
  guesses, 
  highlightedWord, 
  onGuessHover, 
  onGuessClick 
}: GuessHistoryProps) => {
  const validGuesses = guesses.filter(g => g.valid);
  const invalidGuesses = guesses.filter(g => !g.valid);
  
  const renderGuess = (guess: Guess) => {
    const isHighlighted = highlightedWord === guess.word;
    
    return (
      <div
        key={guess.id}
        className={cn(
          'guess-item',
          guess.valid ? 'valid' : 'invalid',
          isHighlighted && 'highlighted'
        )}
        onMouseEnter={() => guess.valid && onGuessHover(guess.word)}
        onMouseLeave={() => guess.valid && onGuessHover(null)}
        onClick={() => guess.valid && onGuessClick(guess.word)}
      >
        <span className="guess-word">{guess.word}</span>
        <span className="guess-status">
          {guess.valid ? '✓' : '✗'}
        </span>
      </div>
    );
  };
  
  return (
    <div className="guess-history">
      {validGuesses.length > 0 && (
        <div className="valid-guesses">
          <h3>Correct Guesses ({validGuesses.length})</h3>
          <div className="guess-grid">
            {validGuesses.map(renderGuess)}
          </div>
        </div>
      )}
      
      {invalidGuesses.length > 0 && (
        <div className="invalid-guesses">
          <h3>Incorrect Guesses ({invalidGuesses.length})</h3>
          <div className="guess-list">
            {invalidGuesses.map(renderGuess)}
          </div>
        </div>
      )}
      
      {guesses.length === 0 && (
        <div className="no-guesses">
          No guesses yet. Start by guessing a word!
        </div>
      )}
    </div>
  );
};
```

### Step 8: Build GameCompletion Component

**Goal**: Win state with "Show Full Lyrics" button

**File**: `src/app/front/components/game/lyrics-game/GameCompletion.tsx`

```typescript
import type { GameCompletionProps } from './types';

export const GameCompletion = ({ 
  songData, 
  guessCount, 
  showFullLyrics, 
  onShowFullLyrics, 
  onShare 
}: GameCompletionProps) => {
  return (
    <div className="game-completion">
      <div className="completion-header">
        <h2>🎉 Congratulations!</h2>
        <p>You solved today's lyrics game!</p>
      </div>
      
      <div className="song-reveal">
        <h3>"{songData.title}"</h3>
        <p>by {songData.artist}</p>
      </div>
      
      <div className="completion-stats">
        <div className="stat">
          <span className="stat-value">{guessCount}</span>
          <span className="stat-label">guesses</span>
        </div>
      </div>
      
      <div className="completion-actions">
        <button 
          onClick={onShowFullLyrics} 
          className="show-full-lyrics-button"
          disabled={showFullLyrics}
        >
          Show Full Lyrics
        </button>
        
        <button onClick={onShare} className="share-button">
          Share Your Results
        </button>
      </div>
    </div>
  );
};
```

### Step 9: Build LyricsGame Container

**Goal**: Main container component managing all state and coordination

**File**: `src/app/front/components/game/lyrics-game/LyricsGame.tsx`

```typescript
import { useState } from 'react';
import { useGameState, useGuess } from '@/app/front/hooks/usePlayer';
import { LoadingState } from '@/app/front/components/ui/LoadingState';
import { ErrorState } from '@/app/front/components/ui/ErrorState';
import { MaskedLyricsDisplay } from './MaskedLyricsDisplay';
import { GameHeader } from './GameHeader';
import { GuessInput } from './GuessInput';
import { GuessHistory } from './GuessHistory';
import { GameCompletion } from './GameCompletion';
import type { LyricsGameProps } from './types';

export const LyricsGame = ({ date }: LyricsGameProps) => {
  // Backend data (single source of truth)
  const { data: gameState, isLoading } = useGameState(date);
  const guessMutation = useGuess(date);
  
  // UI-only state
  const [highlightedWord, setHighlightedWord] = useState<string | null>(null);
  const [scrollToWord, setScrollToWord] = useState<string | null>(null);
  const [pendingGuess, setPendingGuess] = useState<string | null>(null);
  const [showFullLyrics, setShowFullLyrics] = useState(false);
  
  // Derived state (no complex calculations)
  const isGameWon = !!gameState?.song;
  const maskedData = gameState?.masked;
  const guesses = gameState?.guesses || [];
  
  // Event handlers
  const handleWordClick = (word: string) => {
    setHighlightedWord(word);
    setScrollToWord(word);
  };
  
  const handleGuessSubmit = async (guess: string) => {
    setPendingGuess(guess);
    try {
      await guessMutation.mutateAsync(guess);
      // Auto-highlight newly guessed word
      setHighlightedWord(guess);
      setScrollToWord(guess);
    } finally {
      setPendingGuess(null);
    }
  };
  
  const handleShowFullLyrics = () => {
    setShowFullLyrics(true);
  };
  
  const handleShare = () => {
    // TODO: Implement share functionality
    console.log('Share functionality to be implemented');
  };
  
  if (isLoading) return <LoadingState />;
  if (!gameState) return <ErrorState />;
  
  return (
    <div className="lyrics-game">
      <GameHeader 
        date={date}
        isGameWon={isGameWon}
        guessCount={guesses.filter(g => g.valid).length}
      />
      
      <MaskedLyricsDisplay
        title={maskedData?.title}
        artist={maskedData?.artist}
        lyrics={maskedData?.lyrics}
        highlightedWord={highlightedWord}
        scrollToWord={scrollToWord}
        showFullLyrics={showFullLyrics}
        fullSongData={gameState.song}
      />
      
      <GuessInput
        onGuessSubmit={handleGuessSubmit}
        pendingGuess={pendingGuess}
        disabled={isGameWon}
      />
      
      <GuessHistory
        guesses={guesses}
        highlightedWord={highlightedWord}
        onGuessHover={setHighlightedWord}
        onGuessClick={handleWordClick}
      />
      
      {isGameWon && (
        <GameCompletion
          songData={gameState.song}
          guessCount={guesses.filter(g => g.valid).length}
          showFullLyrics={showFullLyrics}
          onShowFullLyrics={handleShowFullLyrics}
          onShare={handleShare}
        />
      )}
    </div>
  );
};
```

### Step 10: Add Component Styles

**Goal**: Clean CSS following the design system

**File**: `src/app/front/components/game/lyrics-game/styles.css`

```css
/* Main layout */
.lyrics-game {
  display: grid;
  grid-template-rows: auto 1fr auto auto;
  gap: 1rem;
  height: 100vh;
  padding: 1rem;
}

/* Token display */
.token {
  display: inline;
  transition: all 0.2s ease;
}

.token.guessable {
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
}

.token.highlighted {
  background-color: var(--highlight-color);
  font-weight: bold;
}

/* Preserve line breaks and spacing */
.lyrics-section {
  white-space: pre-wrap;
  line-height: 1.6;
}

/* Masked lyrics display */
.masked-lyrics-display {
  overflow-y: auto;
  padding: 1rem;
  scroll-behavior: smooth;
}

.title-section {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.artist-section {
  font-size: 1.2rem;
  color: var(--text-secondary);
  margin-bottom: 1rem;
}

/* Full lyrics display */
.full-lyrics-display {
  text-align: center;
  padding: 2rem;
}

.song-title {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.song-artist {
  font-size: 1.5rem;
  color: var(--text-secondary);
  margin-bottom: 2rem;
}

.lyrics-content {
  text-align: left;
  max-width: 600px;
  margin: 0 auto;
}

.lyrics-line {
  margin-bottom: 0.5rem;
}

/* Game header */
.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.game-meta {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.win-badge {
  background: var(--success-color);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
}

/* Guess input */
.guess-input {
  padding: 1rem;
  border-top: 1px solid var(--border-color);
}

.input-group {
  display: flex;
  gap: 0.5rem;
}

.guess-field {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 1rem;
}

.guess-field:disabled {
  background: var(--disabled-bg);
  color: var(--disabled-text);
}

.guess-field.pending {
  border-color: var(--warning-color);
}

.submit-button {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.submit-button:disabled {
  background: var(--disabled-color);
  cursor: not-allowed;
}

.pending-feedback {
  margin-top: 0.5rem;
  color: var(--warning-color);
  font-style: italic;
}

/* Guess history */
.guess-history {
  padding: 1rem;
  max-height: 300px;
  overflow-y: auto;
}

.valid-guesses,
.invalid-guesses {
  margin-bottom: 1rem;
}

.guess-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.5rem;
}

.guess-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.guess-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.guess-item.valid {
  background: var(--success-light);
  border: 1px solid var(--success-color);
}

.guess-item.invalid {
  background: var(--error-light);
  border: 1px solid var(--error-color);
}

.guess-item.highlighted {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.guess-status {
  margin-left: 0.5rem;
  font-weight: bold;
}

/* Game completion */
.game-completion {
  text-align: center;
  padding: 1rem;
  background: var(--completion-bg);
  border-radius: 8px;
  border-top: 1px solid var(--border-color);
}

.completion-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1rem;
}

.show-full-lyrics-button,
.share-button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.show-full-lyrics-button {
  background: var(--primary-color);
  color: white;
}

.show-full-lyrics-button:hover:not(:disabled) {
  background: var(--primary-color-dark);
  transform: translateY(-1px);
}

.show-full-lyrics-button:disabled {
  background: var(--disabled-color);
  cursor: not-allowed;
  opacity: 0.6;
}

.share-button {
  background: var(--secondary-color);
  color: white;
}

.share-button:hover {
  background: var(--secondary-color-dark);
  transform: translateY(-1px);
}

/* Responsive design */
@media (max-width: 768px) {
  .lyrics-game {
    grid-template-rows: auto 1fr auto;
    padding: 0.5rem;
  }
  
  .game-header {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .completion-actions {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .guess-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  }
}
```

### Step 11: Create Index File

**Goal**: Clean exports for the new components

**File**: `src/app/front/components/game/lyrics-game/index.ts`

```typescript
export { LyricsGame } from './LyricsGame';
export { MaskedLyricsDisplay } from './MaskedLyricsDisplay';
export { GameHeader } from './GameHeader';
export { GuessInput } from './GuessInput';
export { GuessHistory } from './GuessHistory';
export { GameCompletion } from './GameCompletion';
export type * from './types';
```

### Step 12: Update Page Route

**Goal**: Switch to use new LyricsGame component

**File**: Update the game page route (likely `src/app/front/game/[date]/page.tsx`)

```typescript
// Replace old import
// import { LyricsGame } from '@/app/front/components/game/lyrics-game-old';

// With new import
import { LyricsGame } from '@/app/front/components/game/lyrics-game';

// Component usage remains the same
export default function GamePage({ params }: { params: { date: string } }) {
  return <LyricsGame date={params.date} />;
}
```

## Testing Checklist

### Basic Functionality
- [ ] Game loads with masked lyrics displayed correctly
- [ ] Guess submission works and updates game state
- [ ] Valid/invalid guesses are handled properly
- [ ] Backend masking is displayed exactly as provided

### Word Highlighting
- [ ] Hovering over guesses highlights words in lyrics
- [ ] Clicking guesses highlights and scrolls to words
- [ ] Highlighting syncs between GuessHistory and MaskedLyricsDisplay
- [ ] Auto-scroll works smoothly to selected words

### Game Completion
- [ ] Win condition triggers GameCompletion component
- [ ] "Show Full Lyrics" button appears only when won
- [ ] Button click displays full lyrics correctly
- [ ] Button becomes disabled after clicking

### Optimistic Updates
- [ ] Guess submission shows immediate "Checking..." feedback
- [ ] Successful guesses auto-highlight and scroll
- [ ] Failed guesses show appropriate error handling
- [ ] Input clears on successful submission

### Responsive Design
- [ ] Layout works on mobile and desktop
- [ ] Touch interactions work on mobile
- [ ] Components stack properly on small screens
- [ ] Text remains readable at all sizes

## Rollback Plan

If issues arise, quickly revert by:

1. **Restore old components**:
   ```bash
   rm -rf src/app/front/components/game/lyrics-game
   mv src/app/front/components/game/lyrics-game-old src/app/front/components/game/lyrics-game
   ```

2. **Update imports back to old structure**

3. **Test that old functionality works**

## Success Criteria

- ✅ New frontend is functionally equivalent to old version
- ✅ Code is significantly simpler with fewer components
- ✅ No business logic in frontend - only UI interactions
- ✅ All user interactions work smoothly
- ✅ Performance is equal or better than old version
- ✅ Old version is safely preserved as backup

This implementation provides a clean, maintainable frontend that trusts the backend completely while delivering an excellent user experience. 