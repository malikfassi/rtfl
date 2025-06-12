import { LyricsGame } from "@/app/front/components/game/LyricsGame";
import { format } from "date-fns";
import { redirect } from "next/navigation";

export default async function GameCatchAllPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  
  // Handle archive paths by redirecting to the root archive path
  if (slug?.length === 1 && slug[0] === "archive") {
    console.log('[CatchAllPage] Archive path detected, redirecting to /archive');
    redirect('/archive');
  }
  if (slug?.length === 2 && slug[0] === "archive") {
    console.log('[CatchAllPage] Archive month path detected, redirecting to /archive/[month]');
    redirect(`/archive/${slug[1]}`);
  }
  if (slug?.length === 2 && slug[0] === "front" && slug[1] === "archive") {
    console.log('[CatchAllPage] Front archive path detected, redirecting to /archive');
    redirect('/archive');
  }
  if (slug?.length === 3 && slug[0] === "front" && slug[1] === "archive") {
    console.log('[CatchAllPage] Front archive month path detected, redirecting to /archive/[month]');
    redirect(`/archive/${slug[2]}`);
  }

  // Treat undefined, [], [""], and ['front', 'game'] as no slug (root path)
  const isRootPath = !slug || 
    slug.length === 0 || 
    (slug.length === 1 && slug[0] === "") ||
    (slug.length === 2 && slug[0] === "front" && slug[1] === "game");
  
  const today = format(new Date(), "yyyy-MM-dd");
  const date = isRootPath ? today : slug.join('-');
  console.log('[CatchAllPage] slug:', slug, 'isRootPath:', isRootPath, 'date:', date);

  // Check if date is valid - only for non-root paths
  const isValidDate = isRootPath ? true : /^\d{4}-\d{2}-\d{2}$/.test(date);
  const rickrollMode = !isValidDate;

  return (
    <div className="min-h-screen bg-background font-mono">
      <div className="p-8">
        <LyricsGame date={date} game={undefined} rickrollMode={rickrollMode} />
      </div>
    </div>
  );
} 