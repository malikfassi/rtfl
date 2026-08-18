import './globals.css';

import { Toaster } from "@/app/front/components/ui/toaster";
import { TooltipProvider } from "@/app/front/components/ui/Tooltip";
import { ThemeToggle } from "@/app/front/components/ui/ThemeToggle";
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
        <ThemeToggle className="fixed bottom-4 right-4 z-50 shadow-md" />
        <Toaster />
      </TooltipProvider>
    </Providers>
  );
} 