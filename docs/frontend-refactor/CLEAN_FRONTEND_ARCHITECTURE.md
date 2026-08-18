# Clean Frontend Component Architecture

## Core Principles

1. **Trust the Backend** - Display data exactly as provided, no transformation
2. **Single Responsibility** - Each component has one clear purpose
3. **Minimal State** - Only UI state that can't be derived from backend data
4. **Optimistic Updates** - Immediate UI feedback with backend sync
5. **Clean Data Flow** - Props flow down, events flow up

## Component Hierarchy

```
LyricsGame (Container)
├── GameHeader (Display)
├── MaskedLyricsDisplay (Pure Display)
├── GuessInput (Input)
├── GuessHistory (Display)
└── GameCompletion (Conditional)
```

## Component Specifications

### 1. LyricsGame (Container Component)

**Responsibility:** Data fetching, state management, event coordination

```typescript
interface LyricsGameProps {
  date: string;
}

const LyricsGame = ({ date }: LyricsGameProps) => {
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
          onShare={() => {/* share logic */}}
        />
      )}
    </div>
  );
};
```

### 2. MaskedLyricsDisplay (Pure Display Component)

**Responsibility:** Render lyrics exactly as backend provides, handle scroll behavior only

```typescript
interface MaskedLyricsDisplayProps {
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

const MaskedLyricsDisplay = ({
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
  
  // Show full lyrics if game is won
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

### 3. GuessInput (Input Component)

**Responsibility:** Handle guess input with validation and optimistic feedback

```typescript
interface GuessInputProps {
  onGuessSubmit: (guess: string) => Promise<void>;
  pendingGuess: string | null;
  disabled: boolean;
}

const GuessInput = ({ onGuessSubmit, pendingGuess, disabled }: GuessInputProps) => {
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

### 4. GuessHistory (Display Component)

**Responsibility:** Show guess history with interaction support

```typescript
interface GuessHistoryProps {
  guesses: Guess[];
  highlightedWord: string | null;
  onGuessHover: (word: string | null) => void;
  onGuessClick: (word: string) => void;
}

const GuessHistory = ({ 
  guesses, 
  highlightedWord, 
  onGuessHover, 
  onGuessClick 
}: GuessHistoryProps) => {
  const validGuesses = guesses.filter(g => g.valid);
  const invalidGuesses = guesses.filter(g => !g.valid);
  
  const renderGuess = (guess: Guess) => {
    const isHovered = highlightedWord === guess.word;
    
    return (
      <div
        key={guess.id}
        className={cn(
          'guess-item',
          guess.valid ? 'valid' : 'invalid',
          isHovered && 'hovered'
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

### 5. GameHeader (Display Component)

**Responsibility:** Show game metadata and progress

```typescript
interface GameHeaderProps {
  date: string;
  isGameWon: boolean;
  guessCount: number;
}

const GameHeader = ({ date, isGameWon, guessCount }: GameHeaderProps) => {
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

### 6. GameCompletion (Conditional Component)

**Responsibility:** Show completion state and sharing options

```typescript
interface GameCompletionProps {
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

const GameCompletion = ({ songData, guessCount, showFullLyrics, onShowFullLyrics, onShare }: GameCompletionProps) => {
  const handleToggleFullLyrics = () => {
    onShowFullLyrics();
  };

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
          onClick={handleToggleFullLyrics} 
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

## Data Management Strategy

### 1. Single Source of Truth
```typescript
// Backend provides complete game state
const gameState = useGameState(date);

// All derived state comes from this
const isGameWon = !!gameState?.song;
const validGuesses = gameState?.guesses?.filter(g => g.valid) || [];
const maskedLyrics = gameState?.masked?.lyrics || [];
```

### 2. Optimistic Updates
```typescript
// Show immediate feedback while backend processes
const [pendingGuess, setPendingGuess] = useState<string | null>(null);

const handleGuessSubmit = async (guess: string) => {
  setPendingGuess(guess); // Immediate UI feedback
  try {
    await guessMutation.mutateAsync(guess);
    // Backend updates gameState automatically via React Query
  } finally {
    setPendingGuess(null);
  }
};
```

### 3. Word Highlighting System
```typescript
// Simple state for UI interactions
const [highlightedWord, setHighlightedWord] = useState<string | null>(null);
const [scrollToWord, setScrollToWord] = useState<string | null>(null);

// Sync highlighting across components
const handleWordClick = (word: string) => {
  setHighlightedWord(word);
  setScrollToWord(word); // Triggers auto-scroll
};
```

### 4. Auto-Scroll Implementation
```typescript
// Smooth scroll to clicked/guessed words
useEffect(() => {
  if (scrollToWord && containerRef.current) {
    const element = containerRef.current.querySelector(
      `[data-word="${scrollToWord}"]`
    );
    element?.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center' 
    });
  }
}, [scrollToWord]);
```

## CSS Architecture

### 1. Token Display
```css
.token {
  display: inline;
  transition: all 0.2s ease;
}

.token.guessable {
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
}

.token.guessable:hover,
.token.highlighted {
  background-color: var(--highlight-color);
  font-weight: bold;
}

/* Preserve line breaks and spacing */
.lyrics-section {
  white-space: pre-wrap;
  line-height: 1.6;
}
```

### 2. Responsive Layout
```css
.lyrics-game {
  display: grid;
  grid-template-rows: auto 1fr auto auto;
  gap: 1rem;
  height: 100vh;
  padding: 1rem;
}

.masked-lyrics-display {
  overflow-y: auto;
  padding: 1rem;
  scroll-behavior: smooth;
}

/* Game completion styling */
.game-completion {
  text-align: center;
  padding: 1rem;
  background: var(--completion-bg);
  border-radius: 8px;
}

.completion-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1rem;
}

.show-full-lyrics-button {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
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
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.share-button:hover {
  background: var(--secondary-color-dark);
  transform: translateY(-1px);
}

@media (max-width: 768px) {
  .lyrics-game {
    grid-template-rows: auto 1fr auto;
  }
  
  .guess-history {
    max-height: 200px;
    overflow-y: auto;
  }
  
  .completion-actions {
    flex-direction: column;
    gap: 0.5rem;
  }
}
```

## Key Benefits

1. **Minimal State** - Only UI interactions, no business logic
2. **Trust Backend** - Display tokens exactly as provided
3. **Smooth UX** - Optimistic updates and auto-scroll
4. **Clean Separation** - Each component has single responsibility
5. **Easy Testing** - Pure functions with clear inputs/outputs
6. **Maintainable** - No complex state calculations or transformations

This architecture eliminates all the complex word state management, masking calculations, and progress tracking from the frontend, resulting in a clean, fast, and maintainable codebase that trusts the backend completely. 