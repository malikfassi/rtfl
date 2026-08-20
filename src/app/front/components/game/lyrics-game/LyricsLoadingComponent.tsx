import React from 'react';
import { cn } from '@/app/front/lib/utils';

interface LyricsLoadingComponentProps {
  className?: string;
}

const LINES: Array<Array<number>> = [
  [3, 5, 4, 7],
  [2, 6, 4, 3, 5],
  [4, 8, 3],
  [6, 3, 5],
];

function Block({ ch, delayMs }: { ch: number; delayMs: number }) {
  return (
    <span
      className="block rounded-[4px] bg-rtfl-raised animate-rtfl-breathe"
      style={{ width: `${ch}ch`, height: '17px', animationDelay: `${delayMs}ms` }}
    />
  );
}

export function LyricsLoadingComponent({ className = '' }: LyricsLoadingComponentProps) {
  let delay = 0;
  return (
    <div className={cn('flex flex-col gap-[14px]', className)}>
      {LINES.map((line, lineIdx) => (
        <div key={lineIdx} className="flex gap-[0.42em] items-baseline">
          {line.map((ch, i) => {
            delay += 60;
            return <Block key={i} ch={ch} delayMs={delay % 400} />;
          })}
        </div>
      ))}
    </div>
  );
}
