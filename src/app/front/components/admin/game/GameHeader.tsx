import React from "react";
import { formatGameDate } from "@/app/front/lib/utils/date-formatting";

import { Button } from '@/app/front/components/ui/Button';

interface GameHeaderProps {
  date: string;
  onDelete: () => void;
  isDeleting: boolean;
  className?: string;
}

export function GameHeader({ date, onDelete, isDeleting, className }: GameHeaderProps) {
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this game?')) {
      onDelete();
    }
  };

  return (
    <header className={`flex items-center justify-between border-b border-primary/10 px-6 py-4 ${className}`}>
      <h2 className="text-lg font-semibold text-primary-dark">
        {formatGameDate(date)}
      </h2>
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