"use client";

import React, { useState } from 'react';
import { cn } from '@/app/front/lib/utils';

interface PlayerIdBadgeProps {
  playerId: string;
  className?: string;
}

export const PlayerIdBadge = ({ playerId, className }: PlayerIdBadgeProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(playerId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch (err) {
      console.error('Failed to copy player id:', err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="click to copy your player id"
      className={cn(
        'font-mono text-rtfl-ink-3 hover:text-rtfl-ink-2 transition-colors duration-150 truncate block text-left w-full',
        className
      )}
    >
      id · {copied ? 'copied!' : playerId}
    </button>
  );
};
