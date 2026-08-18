import { LyricsGameWrapper } from "@/app/front/components/game/lyrics-game/LyricsGameWrapper";
import { redirect } from "next/navigation";
import { getCurrentDate } from "@/app/front/lib/routes";
import { isFutureDate } from "@/app/front/lib/utils/date-formatting";

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

  // For invalid dates, let the API handle the error instead of redirecting
  // The API will return a proper 400 error that the frontend can handle

  // Check if date is in the future and redirect to rickroll
  if (isFutureDate(date)) {
    redirect('/rickroll');
  }

  return <LyricsGameWrapper date={date} />;
} 