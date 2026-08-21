import type { GameState } from './game';

// Archive component props
export interface ArchiveContentProps {
  month?: string;
}

export interface CalendarViewProps {
  month: string;
  games: GameState[];
}

export interface MonthArchivePageProps {
  params: Promise<{ month: string }>;
}
