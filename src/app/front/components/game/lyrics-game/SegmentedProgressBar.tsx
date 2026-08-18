import React from 'react';
import { cn } from '@/app/front/lib/utils';
import { getWordColorDeterministic } from '@/app/front/lib/utils/color-management';

export interface SegmentedProgressBarProps {
  guesses: Array<{ word: string; hits: number }>;
  total: number;
  highlightedWord?: string;
  barHeight?: string;
  ariaLabel?: string;
}

export const SegmentedProgressBar: React.FC<SegmentedProgressBarProps> = ({
  guesses,
  total,
  highlightedWord,
  barHeight = 'h-3',
  ariaLabel = '',
}) => {
  let accPercent = 0;

  return (
    <div className={cn('relative', barHeight, 'bg-primary-muted/10 rounded-full overflow-hidden')} role="progressbar" aria-label={ariaLabel}>
      {guesses.map((guess, index) => {
        if (!guess.hits || total === 0) return null;

        // Use deterministic color based on the word itself
        const color = getWordColorDeterministic(guess.word);

        const isHovered = highlightedWord === guess.word;

        const widthPercent = (guess.hits / total) * 100;
        if (widthPercent <= 0) return null;
        const leftPercent = accPercent;
        accPercent += widthPercent;

        return (
          <div
            key={guess.word + '-' + index}
            className={cn(
              'absolute top-0 h-full transition-all duration-500 ease-out',
              color.bg,
              isHovered && [
                'scale-y-110',
                'z-10',
                'shadow-lg',
                'shadow-black/20'
              ]
            )}
            style={{
              left: `${leftPercent}%`,
              width: `${widthPercent}%`,
            }}
            title={`${guess.word} (${guess.hits})`}
          />
        );
      })}
    </div>
  );
};
