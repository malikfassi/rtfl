import type { GameState } from './game';

// Archive component props
export interface ArchiveContentProps {
  month?: string;
}

export interface CalendarViewProps {
  month: string;
  games: GameState[];
}

export interface ErrorContextType {
  showError: (message: string) => void;
  hideError: () => void;
  errorMessage: string | null;
  isVisible: boolean;
}

export interface ErrorProviderProps {
  children: React.ReactNode;
}

export interface MonthArchivePageProps {
  params: Promise<{ month: string }>;
}
