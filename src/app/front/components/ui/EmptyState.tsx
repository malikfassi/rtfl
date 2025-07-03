import React from "react";
import { cn } from "@/app/front/lib/utils";

interface EmptyStateProps {
  title?: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  title = "No data found",
  message = "There's nothing to display at the moment.",
  action,
  className
}: EmptyStateProps) {
  return (
    <div data-testid="empty-state" className={cn("flex flex-col items-center justify-center p-8 text-center", className)}>
      <div className="rounded-full bg-primary/10 p-3 mb-4">
        <svg
          className="w-6 h-6 text-primary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-primary-dark mb-2">{title}</h3>
      <p className="text-sm text-primary-muted mb-4">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 text-sm font-medium text-white bg-primary-dark rounded-md hover:bg-primary-dark/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark"
        >
          {action.label}
        </button>
      )}
    </div>
  );
} 