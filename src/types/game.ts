import type { Puzzle, Decade, Difficulty } from './puzzle';

export interface SongGuess {
  artistGuess: string;
  titleGuess: string;
  isArtistCorrect: boolean;
  isTitleCorrect: boolean;
  hintsUsed: number; // 0 = hard only, 1 = +medium, 2 = +easy
  attempts: number;
  revealed: boolean;
}

export type GamePhase = 'input' | 'generating' | 'playing' | 'theme-guess' | 'results';

export interface GameState {
  puzzle: Puzzle | null;
  currentDecadeIndex: number;
  guesses: Record<Decade, SongGuess>;
  themeGuess: string;
  isThemeCorrect: boolean;
  gamePhase: GamePhase;
  score: number;
  startTime: number;
  difficulty: Difficulty;
  isDaily: boolean;
}

export interface ScoreBreakdown {
  basePoints: number;
  hintPenalty: number;
  themeBonus: number;
  total: number;
}

export interface DailyStats {
  lastPlayedDate: string;
  currentStreak: number;
  maxStreak: number;
  gamesPlayed: number;
  totalScore: number;
  averageScore: number;
}
