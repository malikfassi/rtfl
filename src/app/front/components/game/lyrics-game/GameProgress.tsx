import React from "react";
import { cn } from "@/app/front/lib/utils";

interface GameProgressProps {
  foundWords: number;
  totalWords: number;
  hoveredGuess?: string;  // guess ID
  guessSegments: Array<{
    id: string;
    hits: number;
    colorIndex: number;
  }>;
  artistComplete?: string;  // guess ID
  titleComplete?: string;  // guess ID
  colors: Array<{ bg: string; text: string; }>;
  className?: string;
  onSegmentHover?: (guessId: string | null) => void;
}

export function GameProgress({ 
  foundWords, 
  totalWords, 
  hoveredGuess,
  guessSegments,
  artistComplete,
  titleComplete,
  colors,
  className,
  onSegmentHover
}: GameProgressProps) {
  const progress = foundWords / totalWords;
  const isNearCompletion = progress >= 0.8;
  const showWin = isNearCompletion && artistComplete && titleComplete;
  const percentage = Math.round(progress * 100);

  // Calculate total width for all segments
  const totalSegmentWidth = guessSegments.reduce((acc, seg) => acc + seg.hits, 0);
  const segmentScale = foundWords / totalSegmentWidth;

  return (
    <div className={cn("relative group", className)}>
      {showWin && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 text-xs font-medium text-accent-success animate-pulse">
          WIN!
        </div>
      )}
      <div className="relative">
        <div className="absolute -top-5 left-0 right-0 flex justify-between items-center text-xs text-primary-muted">
          <span>{foundWords}/{totalWords} words</span>
          <div className="flex items-center gap-2">
            {artistComplete && (
              <span className="text-accent-success">Artist ✓</span>
            )}
            {titleComplete && (
              <span className="text-accent-success">Title ✓</span>
            )}
            <span>{percentage}%</span>
          </div>
        </div>
        <div className="h-1 group-hover:h-[4px] bg-primary-muted/10 rounded-full overflow-hidden transition-all duration-300">
          <div className="relative h-full">
            {/* Colored segments for each guess */}
            {guessSegments.map((segment, i) => {
              const prevWidth = guessSegments
                .slice(0, i)
                .reduce((acc, seg) => acc + seg.hits, 0);
              const width = segment.hits / totalWords * 100;
              
              const isHovered = segment.id === hoveredGuess;
              const color = colors[segment.colorIndex];
              
              return (
                <div
                  key={segment.id}
                  className={cn(
                    "absolute top-0 bottom-0 transition-all duration-300 cursor-pointer",
                    color.bg,
                    isHovered && "opacity-80 scale-y-125"
                  )}
                  style={{
                    left: `${(prevWidth / totalWords) * 100}%`,
                    width: `${width}%`
                  }}
                  onMouseEnter={() => onSegmentHover?.(segment.id)}
                  onMouseLeave={() => onSegmentHover?.(null)}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
} 