import React from 'react';

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
        className={`animate-spin border-2 border-foreground/20 border-t-foreground ${sizeClasses[size]}`}
        role="status"
        aria-label="Loading"
      />
    </div>
  );
} 