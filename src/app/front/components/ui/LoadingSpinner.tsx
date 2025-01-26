import React from 'react';
import { cn } from '@/app/front/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingSpinner({ size = 'md' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className="flex items-center justify-center">
      <div
        className={cn(
          "animate-spin rounded-full",
          "border-2 border-primary-muted/20 border-t-primary-dark",
          sizeClasses[size]
        )}
        role="status"
        aria-label="Loading"
      />
    </div>
  );
} 