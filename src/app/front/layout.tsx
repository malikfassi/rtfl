import './globals.css';

import { TooltipProvider } from "@/app/front/components/ui/Tooltip";
import { Providers } from './providers';

export const metadata = {
  title: "Read The F***ing Lyrics",
  description: "A game where you guess song lyrics",
};

export default function FrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <TooltipProvider>
        {children}
      </TooltipProvider>
    </Providers>
  );
} 