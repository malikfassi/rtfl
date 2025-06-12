"use client";

import { Toaster } from "@/app/front/components/ui/toaster";
import { TooltipProvider } from "@/app/front/components/ui/Tooltip";
import { Providers } from '@/app/front/providers';

export default function ArchiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <TooltipProvider>
        {children}
        <Toaster />
      </TooltipProvider>
    </Providers>
  );
} 