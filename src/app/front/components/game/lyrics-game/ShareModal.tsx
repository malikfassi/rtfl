import React, { useState, useEffect } from 'react';
import { cn } from "@/app/front/lib/utils";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareText: string;
  gameUrl: string;
}

export function ShareModal({ isOpen, onClose, shareText, gameUrl }: ShareModalProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isVisible) return null;

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(gameUrl)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(gameUrl)}&quote=${encodeURIComponent(shareText)}`;

  const handleCopyToClipboard = async () => {
    try {
      const fullText = `${shareText}\n\n${gameUrl}`;
      await navigator.clipboard.writeText(fullText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div 
      className={cn(
        "fixed inset-0 bg-black/50 flex items-center justify-center z-50 transition-opacity duration-300",
        isOpen ? "opacity-100" : "opacity-0"
      )}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
    >
      <div 
        className={cn(
          "bg-background rounded-lg p-6 max-w-sm mx-4 space-y-4 border border-primary-muted/20 transform transition-transform duration-300",
          isOpen ? "scale-100" : "scale-95"
        )}
      >
        <h3 id="share-modal-title" className="font-bold text-lg mb-4 text-primary-dark">
          Challenge your friends!
        </h3>
        <div className="bg-primary-muted/5 rounded-lg p-3 mb-4">
          <div className="text-sm text-primary-dark whitespace-pre-line font-mono leading-relaxed">
            {shareText}
          </div>
          <div className="text-xs text-accent-info mt-2 break-all">{gameUrl}</div>
        </div>
        <div className="space-y-3">
          <button
            onClick={handleCopyToClipboard}
            className={cn(
              "w-full px-4 py-3 rounded-lg transition-colors font-medium flex items-center justify-center gap-2",
              isCopied 
                ? "bg-accent-success/10 text-accent-success" 
                : "bg-accent-info/10 hover:bg-accent-info/20 text-accent-info"
            )}
            aria-label="Copy to clipboard"
          >
            {isCopied ? (
              <>
                <span>✅</span>
                <span>Copied!</span>
              </>
            ) : (
              <>
                <span>📋</span>
                <span>Copy to Clipboard</span>
              </>
            )}
          </button>
          <a
            href={twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full px-4 py-3 bg-accent-info/10 hover:bg-accent-info/20 text-accent-info rounded-lg transition-colors font-medium text-center"
            aria-label="Share on Twitter"
          >
            <span className="flex items-center justify-center gap-2">
              <span>🐦</span>
              <span>Share on Twitter</span>
            </span>
          </a>
          <a
            href={facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full px-4 py-3 bg-accent-info/10 hover:bg-accent-info/20 text-accent-info rounded-lg transition-colors font-medium text-center"
            aria-label="Share on Facebook"
          >
            <span className="flex items-center justify-center gap-2">
              <span>📘</span>
              <span>Share on Facebook</span>
            </span>
          </a>
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-primary-muted/10 hover:bg-primary-muted/20 text-primary-dark rounded-lg transition-colors font-medium"
            aria-label="Close modal"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
} 