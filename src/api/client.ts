import type { Puzzle, Difficulty } from '@/types/puzzle';

const API_BASE = '/api';

export interface GenerateResponse {
  puzzle: Puzzle;
}

export interface DailyResponse {
  puzzle: Puzzle;
  puzzleNumber: number;
  nextPuzzleIn: number;
}

export async function generatePuzzle(
  theme: string,
  difficulty: Difficulty = 'medium'
): Promise<Puzzle> {
  const response = await fetch(`${API_BASE}/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ theme, difficulty }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `Failed to generate puzzle: ${response.status}`);
  }

  return response.json();
}

export async function getDailyPuzzle(): Promise<DailyResponse> {
  const response = await fetch(`${API_BASE}/daily`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `Failed to get daily puzzle: ${response.status}`);
  }

  return response.json();
}
