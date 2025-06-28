import { format } from 'date-fns';
import { Route } from 'next';

// Route patterns
export const ROUTES = {
  HOME: '/',
  GAME: {
    ROOT: '/front/game',
    BY_DATE: (date: string) => `/front/game/${date}` as Route,
  },
  ARCHIVE: {
    ROOT: '/archive',
    BY_MONTH: (month: string) => `/archive/${month}` as Route,
  },
} as const;

// Route validation
export function isValidDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

export function isValidMonth(month: string): boolean {
  return /^\d{4}-\d{2}$/.test(month);
}

// Route builders
export function buildGameRoute(date: string): Route {
  if (!isValidDate(date)) {
    throw new Error(`Invalid date format: ${date}. Expected format: YYYY-MM-DD`);
  }
  return ROUTES.GAME.BY_DATE(date);
}

export function buildArchiveRoute(month: string): Route {
  if (!isValidMonth(month)) {
    throw new Error(`Invalid month format: ${month}. Expected format: YYYY-MM`);
  }
  return ROUTES.ARCHIVE.BY_MONTH(month);
}

// Route helpers
export function getCurrentMonth(): string {
  return format(new Date(), 'yyyy-MM');
}

export function getCurrentDate(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

// Type definitions
export type GameRoute = typeof ROUTES.GAME;
export type ArchiveRoute = typeof ROUTES.ARCHIVE;
export type RoutePattern = typeof ROUTES;

// Route matching
export function matchRoute(path: string): {
  type: 'game' | 'archive' | 'home' | 'unknown';
  params?: { date?: string; month?: string };
} {
  // Remove trailing slash
  const cleanPath = path.replace(/\/$/, '');

  // Match game route
  const gameMatch = cleanPath.match(/^\/front\/game\/(\d{4}-\d{2}-\d{2})$/);
  if (gameMatch) {
    return {
      type: 'game',
      params: { date: gameMatch[1] }
    };
  }

  // Match archive route
  const archiveMatch = cleanPath.match(/^\/front\/archive\/(\d{4}-\d{2})$/);
  if (archiveMatch) {
    return {
      type: 'archive',
      params: { month: archiveMatch[1] }
    };
  }

  // Match root archive
  if (cleanPath === ROUTES.ARCHIVE.ROOT) {
    return { type: 'archive' };
  }

  // Match root game
  if (cleanPath === ROUTES.GAME.ROOT) {
    return { type: 'game' };
  }

  // Match home
  if (cleanPath === ROUTES.HOME) {
    return { type: 'home' };
  }

  return { type: 'unknown' };
} 