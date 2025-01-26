import React from "react";
import { cn } from "@/app/front/lib/utils";

interface GameProgressProps {
  foundWords: number;
  totalWords: number;
  className?: string;
  hoveredGuess?: string;
  guessSegments: Array<{
    id: string;
    hits: number;
    colorIndex: number;
  }>;
  artistComplete?: string;
  titleComplete?: string;
  colors: Array<{ bg: string; text: string; }>;
  onSegmentHover?: (guessId: string | null) => void;
}

export function GameProgress({
  foundWords,
  totalWords,
  className,
  hoveredGuess,
  guessSegments,
  artistComplete,
  titleComplete,
  colors,
  onSegmentHover
}: GameProgressProps) {
  // Calculate percentage based on unique words found vs total unique words
  const percentage = Math.min(100, Math.round((foundWords / totalWords) * 100));

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <div className="font-medium text-primary-dark">Progress</div>
        <div className="text-primary-muted">
          {percentage}%
        </div>
      </div>

      <div className="h-2 bg-primary-muted/5 rounded-full overflow-hidden">
        {guessSegments.map((segment, i) => {
          const prevWidth = guessSegments
            .slice(0, i)
            .reduce((acc, seg) => acc + seg.hits, 0);
          const width = segment.hits / totalWords * 100;

          return (
            <div
              key={segment.id}
              className={cn(
                "h-full transition-all duration-200",
                colors[segment.colorIndex].bg,
                hoveredGuess === segment.id ? "opacity-100" : "opacity-70"
              )}
              style={{
                width: `${width}%`,
                marginLeft: `${prevWidth / totalWords * 100}%`
              }}
              onMouseEnter={() => onSegmentHover?.(segment.id)}
              onMouseLeave={() => onSegmentHover?.(null)}
            />
          );
        })}
      </div>

      <div className="flex items-center gap-2 text-xs">
        {artistComplete && (
          <div className="px-2 py-1 rounded-md bg-accent-success/10 text-accent-success">
            Artist Found
          </div>
        )}
        {titleComplete && (
          <div className="px-2 py-1 rounded-md bg-accent-success/10 text-accent-success">
            Title Found
          </div>
        )}
      </div>
    </div>
  );
} 