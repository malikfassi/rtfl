import React from 'react';

import { cn } from '@/app/front/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export function Button({ 
  variant = 'primary',
  size = 'md',
  className = '',
  isLoading,
  children,
  disabled,
  ...props 
}: ButtonProps) {
  const variantClasses = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary-dark focus:ring-primary-light',
    secondary: 'text-primary-dark hover:bg-primary-muted/10 focus:ring-primary-muted',
    danger: 'text-accent-error hover:bg-accent-error/10 focus:ring-accent-error'
  };

  const sizeClasses = {
    sm: 'text-sm px-3 py-1',
    md: 'px-4 py-2',
    lg: 'text-lg px-6 py-3'
  };

  return (
    <button
      className={cn(
        'rounded-lg font-medium transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="inline-flex items-center gap-2">
          <span className="animate-pulse text-primary-muted">...</span>
          Loading
        </span>
      ) : (
        children
      )}
    </button>
  );
} 