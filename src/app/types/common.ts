// Core shared interfaces
export interface Token {
  value: string;
  isToGuess: boolean;
}

export interface Guess {
  id: string;
  word: string;
  valid: boolean;
}

export interface Color {
  bg: string;
  text: string;
}

// Word state for rendering
export interface WordState {
  isFound: boolean;
  shouldShow: boolean;
  isNewlyFound: boolean;
  isHovered: boolean;
  isSelected: boolean;
}

// Common response types
export type ErrorResponse = { error: string };
export type SuccessResponse<T> = T;

// Common utility types
export interface GuessSegment {
  id: string;
  hits: number;
  colorIndex: number;
} 