import { LoadingState } from "../ui/LoadingState";
import { ErrorState } from "../ui/ErrorState";
import { EmptyState } from "../ui/EmptyState";
import { useRouter } from "next/navigation";
import { useAdminGames } from "@/app/front/hooks/useAdmin";

export default function AdminDashboard() {
  const router = useRouter();
  const { data: games, isLoading, error, refetch } = useAdminGames();

  const navigateToCreateGame = () => {
    router.push("/admin/games/new");
  };

  if (isLoading) {
    return <LoadingState message="Loading admin dashboard..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load dashboard"
        message={error.message || "An error occurred while loading the dashboard"}
        onRetry={() => {
          refetch();
        }}
      />
    );
  }

  if (!games || games.length === 0) {
    return (
      <EmptyState
        title="No games found"
        message="There are no games available for this month"
        action={{
          label: "Create new game",
          onClick: navigateToCreateGame
        }}
      />
    );
  }

  // ... rest of the component code ...
} 