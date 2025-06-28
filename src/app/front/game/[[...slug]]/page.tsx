import { LyricsGame } from "@/app/front/components/game/LyricsGame";
import { redirect } from "next/navigation";
import { ROUTES, isValidDate, getCurrentDate } from "@/app/front/lib/routes";
import { getCurrentGame } from "@/app/front/lib/game-server";
import { isFutureDate } from "@/app/front/lib/utils/date-formatting";
import { ERROR_MESSAGES } from "@/app/front/lib/error-messages";

export default async function GameCatchAllPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  
  // Treat undefined, [], [""], and ['front', 'game'] as no slug (root path)
  const isRootPath = !slug || 
    slug.length === 0 || 
    (slug.length === 1 && slug[0] === "") ||
    (slug.length === 2 && slug[0] === "front" && slug[1] === "game");
  
  const today = getCurrentDate();
  const date = isRootPath ? today : slug.join('-');

  // Check if date is valid - only for non-root paths
  const isValidDatePath = isRootPath ? true : isValidDate(date);
  
  // Redirect invalid paths to home with error
  if (!isValidDatePath) {
    redirect(`${ROUTES.HOME}?error=invalid_date&message=${encodeURIComponent(ERROR_MESSAGES.INVALID_DATE)}`);
  }

  // Check if date is in the future and redirect to rickroll
  if (isFutureDate(date)) {
    redirect('/rickroll');
  }

  // Fetch game data
  const game = await getCurrentGame(date);

  return (
    <div className="min-h-screen bg-background font-mono">
      <div className="p-8">
        <LyricsGame date={date} game={game} />
      </div>
    </div>
  );
} 