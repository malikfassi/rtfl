"use client";

import React, { useState } from 'react';
import { cn } from '@/app/front/lib/utils';
import type { ShareButtonProps } from './types';

export const ShareButton = ({ 
  gameStats, 
  songInfo, 
  date,
  className 
}: ShareButtonProps) => {
  const [isSharing, setIsSharing] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [customShareText, setCustomShareText] = useState('');

  const generateShareText = () => {
    const accuracy = gameStats.accuracy;
    const totalGuesses = gameStats.totalGuesses;
    const correctGuesses = gameStats.correctGuesses;
    
    // Create engaging callout based on performance
    let callout = '';
    if (accuracy >= 90) {
      callout = `🏆 Just crushed today's lyrics game! Think you can beat my score?`;
    } else if (accuracy >= 75) {
      callout = `🎯 Had a great time with today's lyrics challenge! Want to try?`;
    } else if (accuracy >= 50) {
      callout = `🎵 Just played today's lyrics game! It's tougher than it looks!`;
    } else {
      callout = `🎵 Tried today's lyrics game! Could use some help from music lovers!`;
    }
    
    let text = `${callout}\n\n`;
    text += `📊 My stats: ${correctGuesses}/${totalGuesses} (${accuracy}% accuracy)\n`;
    
    if (songInfo.title && songInfo.artist) {
      text += `🎤 Song: ${songInfo.title} by ${songInfo.artist}\n`;
    } else {
      text += `🎤 Still guessing the song...\n`;
    }
    
    text += `\n🎮 Challenge yourself at: ${window.location.origin}`;
    
    return text;
  };

  const getPerformanceEmoji = () => {
    const accuracy = gameStats.accuracy;
    if (accuracy >= 90) return '🏆';
    if (accuracy >= 75) return '🎯';
    if (accuracy >= 50) return '👍';
    return '💪';
  };

  const getPerformanceMessage = () => {
    const accuracy = gameStats.accuracy;
    if (accuracy >= 90) return 'Legendary! Challenge your friends to beat this!';
    if (accuracy >= 75) return 'Great job! Share this fun challenge!';
    if (accuracy >= 50) return 'Not bad! Invite friends to try!';
    return 'Keep trying! Share with music lovers!';
  };

  const getSocialCTA = () => {
    const accuracy = gameStats.accuracy;
    if (accuracy >= 90) return '🏆 Challenge your friends to beat this score!';
    if (accuracy >= 75) return '🎯 Invite friends to try this fun game!';
    if (accuracy >= 50) return '🎵 Share this daily challenge!';
    return '💪 Get your friends to help you improve!';
  };

  const handleShare = async () => {
    setIsSharing(true);
    
    try {
      const shareText = customShareText || generateShareText();
      
      // Try native sharing first
      if (navigator.share) {
        await navigator.share({
          title: `Lyrics Game ${date}`,
          text: shareText,
          url: window.location.origin
        });
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(shareText);
        
        // Show success message (you could add a toast here)
        alert('Game results copied to clipboard!');
      }
    } catch (error) {
      console.error('Failed to share:', error);
      // Fallback to clipboard if sharing fails
      try {
        await navigator.clipboard.writeText(customShareText || generateShareText());
        alert('Game results copied to clipboard!');
      } catch (clipboardError) {
        console.error('Failed to copy to clipboard:', clipboardError);
        alert('Failed to share game results');
      }
    } finally {
      setIsSharing(false);
      setShowPopup(false);
    }
  };

  const handleTwitterShare = () => {
    const text = customShareText || generateShareText();
    const url = encodeURIComponent(window.location.origin);
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${url}`;
    window.open(twitterUrl, '_blank');
    setShowPopup(false);
  };

  const handleFacebookShare = () => {
    const url = encodeURIComponent(window.location.origin);
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    window.open(facebookUrl, '_blank');
    setShowPopup(false);
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Main Share Button - Flat design with just share icon */}
      <div className="input-container">
        <button
          onClick={() => setShowPopup(true)}
          disabled={isSharing}
          className={cn(
            "w-full px-4 py-3 border-0 rounded-xl bg-card text-foreground shadow-sm focus:outline-none focus:ring-2 ring-1 ring-primary/20 focus:ring-primary/40 transition-all duration-200 text-base font-medium flex items-center justify-center",
            isSharing && "opacity-50 cursor-not-allowed",
            "guess-field-share"
          )}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
          </svg>
        </button>
      </div>

      {/* Share Popup */}
      {showPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background border border-border rounded-lg p-6 max-w-md w-full space-y-4 relative">
            {/* X Button */}
            <button
              onClick={() => setShowPopup(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Share Text */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-center">Share Your Results</h3>
              
              {/* Text to be shared */}
              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {customShareText || generateShareText()}
                </div>
              </div>

              {/* Share Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleShare}
                  disabled={isSharing}
                  className={cn(
                    "w-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium transition-colors flex items-center justify-center gap-2",
                    isSharing && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isSharing ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Sharing...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                      </svg>
                      Share Results
                    </>
                  )}
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={handleTwitterShare}
                    className="flex-1 bg-[#1DA1F2] text-white hover:bg-[#1DA1F2]/90 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                    </svg>
                    Twitter
                  </button>
                  
                  <button
                    onClick={handleFacebookShare}
                    className="flex-1 bg-[#4267B2] text-white hover:bg-[#4267B2]/90 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    Facebook
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Quick Stats Display (outside popup) */}
      <div className="bg-muted/50 rounded-lg p-3 text-center">
        <div className="text-xs text-muted-foreground mb-1">Your Score</div>
        <div className="font-mono text-lg font-bold text-foreground">
          {gameStats.correctGuesses}/{gameStats.totalGuesses}
        </div>
        <div className="text-xs text-muted-foreground">
          {gameStats.accuracy}% accuracy
        </div>
      </div>
    </div>
  );
}; 