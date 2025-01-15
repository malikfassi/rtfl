'use client';

interface GameStats {
  totalGuesses: number;
  correctGuesses: number;
  averageGuessTime?: number;
  totalPlayTime?: number;
}

interface PlayerStats {
  userId: string;
  username: string;
  gamesPlayed: number;
  gamesWon: number;
  averageGuesses: number;
  averageTime: number;
}

interface StatsProps {
  gameStats: GameStats;
  topPlayers?: PlayerStats[];
  isLoading?: boolean;
}

export function Stats({ gameStats, topPlayers = [], isLoading = false }: StatsProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Current Game Stats */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Game Statistics</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-3xl font-bold text-blue-600">
              {gameStats.totalGuesses}
            </div>
            <div className="text-sm text-gray-500 mt-1">Total Guesses</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-3xl font-bold text-green-600">
              {gameStats.correctGuesses}
            </div>
            <div className="text-sm text-gray-500 mt-1">Correct Guesses</div>
          </div>
          {gameStats.averageGuessTime && (
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600">
                {Math.round(gameStats.averageGuessTime)}s
              </div>
              <div className="text-sm text-gray-500 mt-1">Average Time per Guess</div>
            </div>
          )}
          {gameStats.totalPlayTime && (
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-orange-600">
                {Math.round(gameStats.totalPlayTime / 60)}m
              </div>
              <div className="text-sm text-gray-500 mt-1">Total Play Time</div>
            </div>
          )}
        </div>
      </section>

      {/* Leaderboard */}
      {topPlayers.length > 0 && (
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Top Players</h2>
          <div className="space-y-4">
            {topPlayers.map((player, index) => (
              <div
                key={player.userId}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-bold text-gray-400">
                    #{index + 1}
                  </div>
                  <div>
                    <div className="font-semibold">{player.username}</div>
                    <div className="text-sm text-gray-500">
                      {player.gamesWon} / {player.gamesPlayed} games won
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    {Math.round(player.averageGuesses * 10) / 10} guesses/game
                  </div>
                  <div className="text-sm text-gray-500">
                    {Math.round(player.averageTime / 60)}m avg. time
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
} 