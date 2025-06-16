import React from 'react';
import { cn } from "@/app/front/lib/utils";
import { GameContainerProps } from './types';

export function GameContainer({ children, className }: GameContainerProps) {
  return (
    <div className={cn(
      "flex flex-col min-h-screen bg-background",
      className
    )}>
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
} 