import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { VercelKV } from '@vercel/kv';
import Anthropic from '@anthropic-ai/sdk';
import { DAILY_THEMES } from '../lib/api/prompts.js';
import { assembleDailyPuzzle } from '../lib/api/puzzleAssembler.js';
import type { Puzzle } from '../lib/api/types.js';

// Lazy initialization to ensure env vars are loaded at request time
let _kv: VercelKV | null = null;
async function getKV(): Promise<VercelKV | null> {
  if (!_kv) {
    const url = process.env.KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN;
    if (!url || !token) {
      return null;
    }
    // Dynamic import to avoid issues at module load time
    const { createClient } = await import('@vercel/kv');
    _kv = createClient({ url, token });
  }
  return _kv;
}

let _anthropic: Anthropic | null = null;
function getAnthropic(): Anthropic {
  if (!_anthropic) {
    _anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return _anthropic;
}

// Get a deterministic puzzle number based on date
function getPuzzleNumber(): number {
  const startDate = new Date('2024-01-01');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = today.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1;
}

// Get today's theme based on puzzle number
function getTodaysTheme(puzzleNumber: number): string {
  return DAILY_THEMES[puzzleNumber % DAILY_THEMES.length];
}

async function generateDailyPuzzle(puzzleNumber: number): Promise<Puzzle> {
  const theme = getTodaysTheme(puzzleNumber);
  return assembleDailyPuzzle(getAnthropic(), theme, puzzleNumber);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const puzzleNumber = getPuzzleNumber();
  const cacheKey = `daily-puzzle-${puzzleNumber}`;

  // Helper to calculate time until next puzzle (uses local time)
  const getNextPuzzleTime = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.getTime() - now.getTime();
  };

  try {
    const kv = await getKV();
    let puzzle: Puzzle | null = null;
    let wasFromCache = false;

    // Try to get cached puzzle if KV is available
    if (kv) {
      puzzle = await kv.get<Puzzle>(cacheKey);
      wasFromCache = puzzle !== null;
    }

    if (!puzzle) {
      // Generate new puzzle
      console.log(`Generating daily puzzle #${puzzleNumber}`);
      puzzle = await generateDailyPuzzle(puzzleNumber);

      // Cache for 24 hours if KV is available
      if (kv) {
        await kv.set(cacheKey, puzzle, { ex: 86400 });
      }
    }

    return res.status(200).json({
      puzzle,
      puzzleNumber,
      nextPuzzleIn: getNextPuzzleTime(),
      cached: wasFromCache,
    });
  } catch (error) {
    console.error('Error getting daily puzzle:', error);

    return res.status(500).json({
      error: 'Failed to get daily puzzle',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
