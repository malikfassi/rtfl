import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  prefix?: string;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading,
  prefix = '>',
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const variants = {
    primary: 'bg-primary text-white hover:opacity-90',
    secondary: 'text-primary hover:bg-primary/10',
    danger: 'text-pink hover:bg-pink/10'
  };

  const sizes = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      className={`font-mono inline-flex items-center gap-2 rounded-none transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {!isLoading && <span className="opacity-50">{prefix}</span>}
      {isLoading ? (
        <span className="inline-flex items-center gap-2">
          <span className="animate-pulse">...</span>
          Loading
        </span>
      ) : (
        children
      )}
    </button>
  );
} 