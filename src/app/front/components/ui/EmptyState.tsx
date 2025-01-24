import React from 'react';

interface EmptyStateProps {
  message: string;
  icon?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ message, icon = '>', action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8 text-center font-mono">
      {icon && <span className="text-2xl text-primary opacity-50">{icon}</span>}
      <p className="text-sm opacity-70">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="text-sm text-primary hover:opacity-80"
        >
          {action.label}
        </button>
      )}
    </div>
  );
} 