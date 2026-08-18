import type { GameCompletionProps } from './types';

export const GameCompletion = ({ 
  songData, 
  guessCount, 
  showFullLyrics, 
  onShowFullLyrics, 
  onShare 
}: GameCompletionProps) => {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-lg border border-blue-200 text-center">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-blue-900 mb-2">🎉 Congratulations!</h2>
        <p className="text-blue-700">You solved today&apos;s lyrics game!</p>
      </div>
      
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-blue-800 mb-1">
          &ldquo;{songData.title || 'Unknown Title'}&rdquo;
        </h3>
        <p className="text-blue-600 italic">by {songData.artist || 'Unknown Artist'}</p>
      </div>
      
      <div className="mb-6">
        <div className="inline-flex flex-col items-center px-4 py-3 bg-white rounded-lg shadow-sm">
          <span className="text-2xl font-bold text-blue-800">{guessCount}</span>
          <span className="text-sm text-gray-600">guesses</span>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button 
          onClick={onShowFullLyrics} 
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          disabled={showFullLyrics}
        >
          Show Full Lyrics
        </button>
        
        <button 
          onClick={onShare} 
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          Share Your Results
        </button>
      </div>
    </div>
  );
};
