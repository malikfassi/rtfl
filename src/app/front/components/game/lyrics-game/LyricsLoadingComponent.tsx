import React from 'react';
import { cn } from '@/app/front/lib/utils';

interface LyricsLoadingComponentProps {
  className?: string;
}

// Varying widths read as more "text-like" than uniform bars.
const LINE_WIDTHS = ['92%', '78%', '85%', '65%', '90%', '72%', '80%', '60%'];

function ShimmerBar({ width }: { width: string }) {
  return (
    <div
      className="h-4 rounded-md bg-muted relative overflow-hidden"
      style={{ width }}
    >
      <div className="shimmer-sweep" />
    </div>
  );
}

export function LyricsLoadingComponent({ className = '' }: LyricsLoadingComponentProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Title and artist placeholders */}
      <div className="space-y-2">
        <ShimmerBar width="55%" />
        <ShimmerBar width="35%" />
      </div>

      {/* Lyrics placeholder */}
      <div className="space-y-3 pt-2">
        {LINE_WIDTHS.map((width, index) => (
          <ShimmerBar key={index} width={width} />
        ))}
      </div>

      <style jsx>{`
        .shimmer-sweep {
          position: absolute;
          inset: 0;
          transform: translateX(-100%);
          background: linear-gradient(
            90deg,
            transparent,
            hsl(var(--foreground) / 0.08),
            transparent
          );
          animation: shimmer-sweep 1.6s ease-in-out infinite;
        }

        @keyframes shimmer-sweep {
          100% {
            transform: translateX(100%);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .shimmer-sweep {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
