import React from 'react';
import { GameProgressProps, YesterdayStatsProps } from './types';
import { GameProgress } from './GameProgress';
import { YesterdayStats } from '../YesterdayStats';

interface GameSidebarProps {
  progressProps: GameProgressProps;
  yesterdayStatsProps: YesterdayStatsProps;
  className?: string;
}

export function GameSidebar({ progressProps, yesterdayStatsProps, className }: GameSidebarProps) {
  return (
    <div data-testid="game-sidebar" className={className}>
      <div className="sticky top-8 space-y-8">
        <GameProgress {...progressProps} />
        <YesterdayStats {...yesterdayStatsProps} />
      </div>
    </div>
  );
} 