import { LoadingState } from "../ui/LoadingState";
import { ErrorState } from "../ui/ErrorState";
import { useAdminGamesWithSurroundingMonths } from "@/app/front/hooks/useAdmin";

export default function Calendar() {
  const { isLoading, error, refetch } = useAdminGamesWithSurroundingMonths();

  if (isLoading) {
    return <LoadingState message="Loading calendar..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load calendar"
        message={error.message || "An error occurred while loading the calendar"}
        onRetry={() => {
          refetch();
        }}
      />
    );
  }

  // ... rest of the component code ...
} 