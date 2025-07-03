import React from "react";
import { cn } from "@/app/front/lib/utils";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  message = "An error occurred while loading this content.",
  onRetry,
  className
}: ErrorStateProps) {
  return (
    <div data-testid="error-state" className={cn("flex flex-col items-center justify-center p-8 text-center", className)}>
      <div className="rounded-full bg-accent-error/10 p-3 mb-4">
        <svg
          className="w-6 h-6 text-accent-error"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-primary-dark mb-2">{title}</h3>
      <p className="text-sm text-primary-muted mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 text-sm font-medium text-white bg-primary-dark rounded-md hover:bg-primary-dark/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark"
        >
          Try again
        </button>
      )}
    </div>
  );
} 