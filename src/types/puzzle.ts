export type Decade = '1960s' | '1970s' | '1980s' | '1990s' | '2000s' | '2010s' | '2020s';

export const DECADES: Decade[] = ['1960s', '1970s', '1980s', '1990s', '2000s', '2010s', '2020s'];

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface LyricSnippet {
  text: string;
  difficulty: Difficulty;
}

export interface SongPuzzle {
  id: string;
  decade: Decade;
  artist: string;
  title: string;
  year: number;
  snippets: LyricSnippet[]; // 3 snippets: hard, medium, easy
  connectionHint: string; // How this song relates to the theme
  geniusVerified?: boolean;
  geniusUrl?: string;
}

export interface Puzzle {
  id: string;
  theme: string;
  themeHint: string; // Clue for guessing the theme
  songs: SongPuzzle[]; // 7 songs, one per decade
  difficulty: Difficulty;
  createdAt: string;
  puzzleNumber?: number; // For daily puzzles
}
