import { LoadingState } from "../ui/LoadingState";
import { ErrorState } from "../ui/ErrorState";
import { EmptyState } from "../ui/EmptyState";
import { useState, useEffect } from "react";
import { getMonthGamesMetadata } from "@/app/front/lib/services/game-service";
import { getTodayDate } from "@/app/front/lib/utils/date-formatting";

export default function Archive() {
  const [games, setGames] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchArchiveData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const today = getTodayDate();
      const month = today.substring(0, 7); // Get YYYY-MM format
      const data = await getMonthGamesMetadata(month);
      setGames(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch archive data'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArchiveData();
  }, []);

  if (isLoading) {
    return <LoadingState message="Loading archive..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load archive"
        message={error.message || "An error occurred while loading the archive"}
        onRetry={() => {
          // Reset error state and retry loading
          setError(null);
          fetchArchiveData();
        }}
      />
    );
  }

  if (!games || games.length === 0) {
    return (
      <EmptyState
        title="No games found"
        message="There are no games available in the archive"
      />
    );
  }

  // ... rest of the component code ...
} 