import React, { useState } from 'react';
import { AdminGame } from '@/types/admin';
import { format } from 'date-fns';
import { Button } from '@/components/ui/Button';

interface GamePreviewProps {
  game?: AdminGame;
  selectedDates?: Date[];
  onSearchClick?: () => void;
  isMultiSelectMode?: boolean;
  games?: AdminGame[];
}

function EmptyGamePreview({ onClick }: { onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="flex h-full w-full flex-col items-center justify-center p-8 hover:bg-primary/5 transition-colors"
    >
      <div className="max-w-md text-center space-y-4">
        <h2 className="game-header">
          READ THE FUCKING LYRICS
        </h2>
        <div className="space-y-8">
          {/* Title */}
          <div className="game-section">
            <h3 className="game-section-title">Title</h3>
            <div className="game-section-content">
              <div className="game-word">
                <span className="game-word-masked animate-pulse" style={{ width: '120px' }} />
              </div>
            </div>
          </div>

          {/* Artist */}
          <div className="game-section">
            <h3 className="game-section-title">Artist</h3>
            <div className="game-section-content">
              <div className="game-word">
                <span className="game-word-masked animate-pulse" style={{ width: '80px' }} />
              </div>
            </div>
          </div>

          {/* Lyrics */}
          <div className="game-section">
            <h3 className="game-section-title">Lyrics</h3>
            <div className="game-section-content space-y-2">
              <div className="game-word">
                <span className="game-word-masked animate-pulse" style={{ width: '100px' }} />
              </div>
              <div className="game-word">
                <span className="game-word-masked animate-pulse" style={{ width: '80px' }} />
              </div>
              <div className="game-word">
                <span className="game-word-masked animate-pulse" style={{ width: '120px' }} />
              </div>
            </div>
          </div>
        </div>
        <p className="text-muted">
          Click anywhere to search for a song
        </p>
      </div>
    </button>
  );
}

function BatchPreview({ 
  dates,
  games = [],
  onSearchClick
}: { 
  dates: Date[];
  games?: AdminGame[];
  onSearchClick?: () => void;
}) {
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const selectedDate = dates[selectedDateIndex];
  const formattedDate = format(selectedDate, 'yyyy-MM-dd');
  const selectedGame = games.find(g => g.date === formattedDate);
  const totalGames = games.length;

  const handlePrevDate = () => {
    setSelectedDateIndex(prev => (prev > 0 ? prev - 1 : dates.length - 1));
  };

  const handleNextDate = () => {
    setSelectedDateIndex(prev => (prev < dates.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="flex h-full flex-col p-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="game-header">
          Batch Edit Mode
        </h2>
        <div className="flex items-center gap-4">
          <button onClick={handlePrevDate} className="calendar-nav">{'<-'}</button>
          <span className="font-mono">
            {format(selectedDate, 'MM.dd.yyyy')}
          </span>
          <button onClick={handleNextDate} className="calendar-nav">{'->'}</button>
        </div>
      </div>

      <div className="game-stats space-y-2">
        <div>{dates.length} dates selected</div>
        <div className="text-muted">{totalGames} games assigned</div>
      </div>

      {selectedGame ? (
        <div className="mt-8 p-4 border border-foreground/10 rounded-lg">
          <div className="font-mono mb-2">Current Game:</div>
          <div className="text-lg">{selectedGame.song.title}</div>
          <div className="text-sm text-muted">{selectedGame.song.artist}</div>
        </div>
      ) : (
        <div className="mt-8 p-4 border border-foreground/10 rounded-lg">
          <div className="font-mono mb-2">No game assigned</div>
          <Button
            variant="secondary"
            onClick={onSearchClick}
            className="w-full mt-2"
          >
            Choose Song
          </Button>
        </div>
      )}

      <div className="mt-auto">
        <div className="text-sm text-muted mb-2">Navigation:</div>
        <div className="font-mono text-xs">
          {'<-'} / {'->'}  Switch between dates
        </div>
      </div>
    </div>
  );
}

export function GamePreview({ 
  game, 
  selectedDates = [], 
  onSearchClick,
  isMultiSelectMode = false,
  games = []
}: GamePreviewProps) {
  const [isMasked, setIsMasked] = useState(true);

  // Show batch preview if in multi-select mode and dates are selected
  if (isMultiSelectMode && selectedDates.length > 1) {
    return (
      <BatchPreview 
        dates={selectedDates} 
        games={games}
        onSearchClick={onSearchClick}
      />
    );
  }

  // Show empty state if no game
  if (!game) {
    return <EmptyGamePreview onClick={onSearchClick} />;
  }

  // Show game preview
  const { song } = game;
  return (
    <div className="flex h-full flex-col p-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="game-header">
          READ THE FUCKING LYRICS
        </h2>
        <div className="game-stats">
          42/241 words found
        </div>
      </div>

      {/* View Controls */}
      <div className="flex gap-2 mb-8">
        <button
          className={isMasked ? 'select-button' : 'view-button'}
          onClick={() => setIsMasked(true)}
        >
          Masked View
        </button>
        <button
          className={!isMasked ? 'select-button' : 'view-button'}
          onClick={() => setIsMasked(false)}
        >
          Full View
        </button>
      </div>

      {/* Content */}
      <div className="space-y-8">
        {/* Title */}
        <div className="game-section">
          <h3 className="game-section-title">Title</h3>
          <div className="game-section-content">
            {isMasked ? (
              Array.isArray(song.maskedLyrics?.title) ? 
                song.maskedLyrics.title.map((word, index) => (
                  <React.Fragment key={index}>
                    {word === '\n' ? (
                      <br />
                    ) : /^\s+$/.test(word) ? (
                      ' '
                    ) : (
                      <span className="font-mono">{word}</span>
                    )}
                  </React.Fragment>
                )) : (
                  <div className="game-word">
                    <span className="game-word-masked animate-pulse" style={{ width: '100px' }} />
                  </div>
                )
            ) : (
              <div className="game-word">
                <span className="game-word-revealed">{song.title}</span>
              </div>
            )}
          </div>
        </div>

        {/* Artist */}
        <div className="game-section">
          <h3 className="game-section-title">Artist</h3>
          <div className="game-section-content">
            {isMasked ? (
              Array.isArray(song.maskedLyrics?.artist) ? 
                song.maskedLyrics.artist.map((word, index) => (
                  <React.Fragment key={index}>
                    {word === '\n' ? (
                      <br />
                    ) : /^\s+$/.test(word) ? (
                      ' '
                    ) : (
                      <span className="font-mono">{word}</span>
                    )}
                  </React.Fragment>
                )) : (
                  <div className="game-word">
                    <span className="game-word-masked animate-pulse" style={{ width: '80px' }} />
                  </div>
                )
            ) : (
              <div className="game-word">
                <span className="game-word-revealed">{song.artist}</span>
              </div>
            )}
          </div>
        </div>

        {/* Lyrics */}
        <div className="game-section">
          <h3 className="game-section-title">Lyrics</h3>
          <div className="game-section-content whitespace-pre-wrap">
            {isMasked ? (
              Array.isArray(song.maskedLyrics?.lyrics) ? 
                song.maskedLyrics.lyrics.map((word, index) => (
                  <React.Fragment key={index}>
                    {word === '\n' ? (
                      <br />
                    ) : /^\s+$/.test(word) ? (
                      ' '
                    ) : (
                      <span className="font-mono">{word}</span>
                    )}
                  </React.Fragment>
                )) : (
                  <div className="game-word">
                    <span className="game-word-masked animate-pulse" style={{ width: '100px' }} />
                  </div>
                )
            ) : (
              song.lyrics ? 
                song.lyrics.split(/(\n|\s+)/).filter(token => token.length > 0).map((word, index) => (
                  <React.Fragment key={index}>
                    {word === '\n' ? (
                      <br />
                    ) : /^\s+$/.test(word) ? (
                      ' '
                    ) : (
                      <span className="font-mono">{word}</span>
                    )}
                  </React.Fragment>
                )) : (
                  <div className="game-word">
                    <span className="text-muted">No lyrics available</span>
                  </div>
                )
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 