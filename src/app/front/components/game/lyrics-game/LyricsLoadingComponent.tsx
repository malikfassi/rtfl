import React from 'react';

interface LyricsLoadingComponentProps {
  className?: string;
}

export function LyricsLoadingComponent({ className = '' }: LyricsLoadingComponentProps) {
  // Lorem ipsum lyrics formatted like real music
  const placeholderLyrics = [
    "Lorem ipsum dolor sit amet",
    "Consectetur adipiscing elit",
    "Sed do eiusmod tempor incididunt",
    "Ut labore et dolore magna aliqua",
    "",
    "Ut enim ad minim veniam",
    "Quis nostrud exercitation ullamco",
    "Laboris nisi ut aliquip ex ea",
    "Commodo consequat duis aute",
    "",
    "Irure dolor in reprehenderit",
    "Voluptate velit esse cillum",
    "Dolore eu fugiat nulla pariatur",
    "Excepteur sint occaecat cupidatat",
    "",
    "Non proident sunt in culpa",
    "Qui officia deserunt mollit",
    "Anim id est laborum sed ut",
    "Perspiciatis unde omnis iste"
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Title and Artist Placeholders */}
      <div className="text-center space-y-2">
        <div className="h-8 bg-gradient-to-r from-muted/20 to-muted/40 rounded animate-pulse">
          <div className="loading-beam" />
        </div>
        <div className="h-6 bg-gradient-to-r from-muted/20 to-muted/30 rounded animate-pulse">
          <div className="loading-beam" />
        </div>
      </div>

      {/* Lyrics Placeholder */}
      <div className="space-y-4">
        {placeholderLyrics.map((line, index) => (
          <div key={index} className="relative">
            {line === '' ? (
              <div className="h-4" /> // Empty line spacing
            ) : (
              <div className="h-6 bg-gradient-to-r from-muted/20 to-muted/40 rounded animate-pulse">
                <div className="loading-beam" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Add CSS for the glowing beam effect
const beamStyles = `
  .loading-beam {
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
    animation: beam-sweep 2s ease-in-out infinite;
  }

  @keyframes beam-sweep {
    0% {
      left: -100%;
    }
    50% {
      left: 100%;
    }
    100% {
      left: 100%;
    }
  }
`;

// Inject styles if not already present
if (typeof document !== 'undefined') {
  const styleId = 'lyrics-loading-beam-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = beamStyles;
    document.head.appendChild(style);
  }
} 