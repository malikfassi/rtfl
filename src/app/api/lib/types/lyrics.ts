export interface MaskedLyrics {
  title: Token[];
  artist: Token[];
  lyrics: Token[];
}

export interface Token {
  value: string;      // The actual text
  isToGuess: boolean; // Whether this token should be guessed
}


export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }; 