import { LyricsGame } from "@/app/front/components/game/LyricsGame";
import { format } from "date-fns";
import { redirect } from "next/navigation";
import { ROUTES, isValidDate, getCurrentDate, matchRoute } from "@/app/front/lib/routes";
import { notFound } from "next/navigation";

export default async function GameCatchAllPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  
  // Handle archive paths by redirecting to the root archive path
  if (slug?.length === 1 && slug[0] === "archive") {
    redirect(ROUTES.ARCHIVE.ROOT);
  }
  if (slug?.length === 2 && slug[0] === "archive") {
    redirect(ROUTES.ARCHIVE.BY_MONTH(slug[1]));
  }
  if (slug?.length === 2 && slug[0] === "front" && slug[1] === "archive") {
    redirect(ROUTES.ARCHIVE.ROOT);
  }
  if (slug?.length === 3 && slug[0] === "front" && slug[1] === "archive") {
    redirect(ROUTES.ARCHIVE.BY_MONTH(slug[2]));
  }

  // Treat undefined, [], [""], and ['front', 'game'] as no slug (root path)
  const isRootPath = !slug || 
    slug.length === 0 || 
    (slug.length === 1 && slug[0] === "") ||
    (slug.length === 2 && slug[0] === "front" && slug[1] === "game");
  
  const today = getCurrentDate();
  const date = isRootPath ? today : slug.join('-');

  // Check if date is valid - only for non-root paths
  const isValidDatePath = isRootPath ? true : isValidDate(date);
  
  // Return 404 for invalid paths
  if (!isValidDatePath) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background font-mono">
      <div className="p-8">
        <LyricsGame date={date} game={undefined} rickrollMode={false} />
      </div>
    </div>
  );
} 