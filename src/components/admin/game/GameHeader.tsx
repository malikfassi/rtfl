import React from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/Button';

interface GameHeaderProps {
  date: string;
  onDelete: () => void;
  isDeleting: boolean;
}

export function GameHeader({ date, onDelete, isDeleting }: GameHeaderProps) {
  const formattedDate = format(new Date(date), 'MM.dd.yyyy');

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this game?')) {
      onDelete();
    }
  };

  return (
    <header className="flex items-center justify-between border-b border-primary/10 px-6 py-4">
      <h1 className="font-mono text-xl">
        <span className="opacity-50">{'>'} </span>
        {formattedDate}
      </h1>
      <Button
        variant="danger"
        size="sm"
        onClick={handleDelete}
        isLoading={isDeleting}
        prefix="x"
      >
        Delete Game
      </Button>
    </header>
  );
} 