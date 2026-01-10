import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { VercelKV } from '@vercel/kv';
import Anthropic from '@anthropic-ai/sdk';
import { generatePuzzlePrompt, DAILY_THEMES } from './lib/prompts.js';
import { PuzzleResponseSchema } from './lib/schemas.js';
import type { Puzzle, SongPuzzle } from './lib/types.js';

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

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

function transformToPuzzle(
  response: typeof PuzzleResponseSchema._type,
  puzzleNumber: number
): Puzzle {
  const songs: SongPuzzle[] = response.songs.map((song) => ({
    id: generateId(),
    decade: song.decade,
    artist: song.artist,
    title: song.title,
    year: song.year,
    snippets: song.snippets,
    connectionHint: song.connectionHint,
  }));

  return {
    id: `daily-${puzzleNumber}`,
    theme: response.theme,
    themeHint: response.themeHint,
    songs,
    difficulty: 'medium',
    createdAt: new Date().toISOString(),
    puzzleNumber,
  };
}

async function generateDailyPuzzle(puzzleNumber: number): Promise<Puzzle> {
  const theme = getTodaysTheme(puzzleNumber);

  const message = await getAnthropic().messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: generatePuzzlePrompt(theme, 'medium'),
      },
    ],
  });

  const textContent = message.content.find((block) => block.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  let jsonText = textContent.text;
  const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonText = jsonMatch[1].trim();
  }

  const parsed = JSON.parse(jsonText);
  const validated = PuzzleResponseSchema.parse(parsed);

  return transformToPuzzle(validated, puzzleNumber);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const puzzleNumber = getPuzzleNumber();
  const cacheKey = `daily-puzzle-${puzzleNumber}`;

  // Helper to calculate time until next puzzle
  const getNextPuzzleTime = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);
    return tomorrow.getTime() - now.getTime();
  };

  try {
    const kv = await getKV();
    let puzzle: Puzzle | null = null;

    // Try to get cached puzzle if KV is available
    if (kv) {
      puzzle = await kv.get<Puzzle>(cacheKey);
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
      cached: kv !== null,
    });
  } catch (error) {
    console.error('Error getting daily puzzle:', error);

    return res.status(500).json({
      error: 'Failed to get daily puzzle',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
