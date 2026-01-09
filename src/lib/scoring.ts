import type { ScoreBreakdown } from '@/types/game';
import type { Difficulty } from '@/types/puzzle';

const BASE_POINTS_PER_SONG = 100;
const HINT_PENALTIES = {
  0: 0,   // Hard only - no penalty
  1: 15,  // Used medium hint
  2: 30,  // Used easy hint
};
const THEME_BONUS = 100;

export function calculateSongScore(
  isCorrect: boolean,
  hintsUsed: number,
  _difficulty: Difficulty
): number {
  if (!isCorrect) return 0;

  const base = BASE_POINTS_PER_SONG;
  const penalty = HINT_PENALTIES[hintsUsed as keyof typeof HINT_PENALTIES] || 0;

  return Math.max(0, base - penalty);
}

export function calculateTotalScore(
  songScores: number[],
  themeCorrect: boolean
): ScoreBreakdown {
  const basePoints = songScores.reduce((sum, score) => sum + score, 0);
  const hintPenalty = songScores.reduce((sum, score) => {
    return sum + (BASE_POINTS_PER_SONG - score);
  }, 0);
  const themeBonus = themeCorrect ? THEME_BONUS : 0;

  return {
    basePoints: songScores.filter((s) => s > 0).length * BASE_POINTS_PER_SONG,
    hintPenalty,
    themeBonus,
    total: basePoints + themeBonus,
  };
}

export function getMaxPossibleScore(): number {
  return 7 * BASE_POINTS_PER_SONG + THEME_BONUS; // 800 max
}

export function formatShareResult(
  songResults: { correct: boolean; hintsUsed: number }[],
  themeCorrect: boolean,
  score: number,
  puzzleNumber?: number
): string {
  const date = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  const decadeLabels = ['60s', '70s', '80s', '90s', '00s', '10s', '20s'];

  const resultLine = songResults
    .map((result, i) => {
      const label = decadeLabels[i];
      if (!result.correct) return `${label}: X`;
      if (result.hintsUsed === 0) return `${label}: *`;
      if (result.hintsUsed === 1) return `${label}: ~`;
      return `${label}: .`;
    })
    .join(' | ');

  const header = puzzleNumber
    ? `Lyrics Puzzle #${puzzleNumber} - ${date}`
    : `Lyrics Puzzle - ${date}`;

  const themeStatus = themeCorrect ? 'Theme: *' : 'Theme: X';

  return `${header}
${resultLine}
${themeStatus}
Score: ${score}/${getMaxPossibleScore()}

Play at: [URL]`;
}
