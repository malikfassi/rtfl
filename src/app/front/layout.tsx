import './globals.css';

import { Toaster } from "@/app/front/components/ui/toaster";
import { TooltipProvider } from "@/app/front/components/ui/Tooltip";
import { Providers } from './providers';

export const metadata = {
  title: "Read The F***ing Lyrics",
  description: "A game where you guess song lyrics",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-background">
        <Providers>
          <TooltipProvider>
            {children}
            <Toaster />
          </TooltipProvider>
        </Providers>
      </body>
    </html>
  );
} 