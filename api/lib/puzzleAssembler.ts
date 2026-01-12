import OpenAI from 'openai';
import { generatePuzzlePrompt } from './prompts.js';
import { LLMPuzzleResponseSchema } from './schemas.js';
import type { Puzzle, SongPuzzle, Difficulty } from './types.js';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Call OpenAI API with retry logic.
 */
async function callOpenAIWithRetry(
  openai: OpenAI,
  prompt: string,
  maxRetries = MAX_RETRIES
): Promise<string> {
  const errors: string[] = [];

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[OpenAI] Attempt ${attempt}/${maxRetries}`);

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a music expert creating content for an educational trivia game. Respond with valid JSON only. No markdown formatting, no explanations - just raw JSON starting with {',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content in OpenAI response');
      }

      console.log(`[OpenAI] Success (${content.length} chars)`);
      return content;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`[OpenAI] Attempt ${attempt} failed:`, errorMsg);
      errors.push(`Attempt ${attempt}: ${errorMsg}`);

      if (attempt < maxRetries) {
        await delay(RETRY_DELAY_MS * attempt);
      }
    }
  }

  throw new Error(`All OpenAI API attempts failed:\n${errors.join('\n')}`);
}

export async function assemblePuzzle(
  openai: OpenAI,
  theme: string,
  difficulty: Difficulty
): Promise<Puzzle> {
  console.log(`Generating puzzle for theme: "${theme}", difficulty: ${difficulty}`);

  // Generate the prompt
  const prompt = generatePuzzlePrompt(theme, difficulty);

  // Call OpenAI
  const jsonText = await callOpenAIWithRetry(openai, prompt);

  // Parse JSON response
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (e) {
    console.error('[OpenAI] JSON parse error:', e);
    console.error('[OpenAI] Failed to parse response text:', jsonText);
    throw new Error(`Failed to parse OpenAI response as JSON: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }

  // Validate with schema
  const llmResponse = LLMPuzzleResponseSchema.parse(parsed);

  console.log('[OpenAI] Parsed puzzle:');
  console.log(`[OpenAI] Theme: ${llmResponse.theme}`);
  console.log(`[OpenAI] Hint: ${llmResponse.themeHint}`);
  llmResponse.songs.forEach((song, i) => {
    console.log(`[OpenAI]   ${i + 1}. ${song.artist} - ${song.title} (${song.year})`);
  });

  // Convert to Puzzle format with IDs
  const songs: SongPuzzle[] = llmResponse.songs.map((song) => ({
    id: generateId(),
    decade: song.decade,
    artist: song.artist,
    title: song.title,
    year: song.year,
    snippets: song.snippets,
    connectionHint: song.connectionHint,
  }));

  return {
    id: generateId(),
    theme: llmResponse.theme,
    themeHint: llmResponse.themeHint,
    songs,
    difficulty,
    createdAt: new Date().toISOString(),
  };
}

// Version for daily puzzles that includes puzzle number
export async function assembleDailyPuzzle(
  openai: OpenAI,
  theme: string,
  puzzleNumber: number
): Promise<Puzzle> {
  const puzzle = await assemblePuzzle(openai, theme, 'medium');

  return {
    ...puzzle,
    id: `daily-${puzzleNumber}`,
    puzzleNumber,
  };
}
