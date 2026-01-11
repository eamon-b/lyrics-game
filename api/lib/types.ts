export type Decade = '1960s' | '1970s' | '1980s' | '1990s' | '2000s' | '2010s' | '2020s';

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
  snippets: LyricSnippet[];
  connectionHint: string;
}

export interface Puzzle {
  id: string;
  theme: string;
  themeHint: string;
  songs: SongPuzzle[];
  difficulty: Difficulty;
  createdAt: string;
  puzzleNumber?: number;
}

// SnippetGuidance, SongSelection, and SongSelectionResponse are defined in schemas.ts
// Import them from there to avoid duplication

// Genius API types
export interface GeniusSearchResult {
  id: number;
  title: string;
  artist_names: string;
  url: string;
}

export interface LyricSection {
  type: 'verse' | 'chorus' | 'bridge' | 'pre-chorus' | 'intro' | 'outro' | 'other';
  number?: number;
  lines: string[];
}
