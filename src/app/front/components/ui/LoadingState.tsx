import React from "react";
import { cn } from "@/app/front/lib/utils";

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({ message = "Loading...", className }: LoadingStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8", className)}>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-dark" />
      <p className="mt-4 text-sm text-primary-muted">{message}</p>
    </div>
  );
} 