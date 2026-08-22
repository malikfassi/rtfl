import { LyricsGameWrapper } from "@/app/front/components/game/lyrics-game/LyricsGameWrapper";
import { getCurrentDate } from "@/app/front/lib/routes";

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

  // Every unplayable date - malformed, future, or simply unscheduled - is left
  // to the API, which answers with a status the client turns into the stand-in
  // song plus the reason. One path, rather than a redirect for one case only.
  return <LyricsGameWrapper date={date} />;
} 