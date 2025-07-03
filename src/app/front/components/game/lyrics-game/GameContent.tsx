import React from 'react';
import { MaskedLyricsProps } from './types';
import { MaskedLyrics } from './MaskedLyrics';

export function GameContent(props: MaskedLyricsProps) {
  return (
    <div data-testid="game-content">
      <MaskedLyrics {...props} />
    </div>
  );
} 