import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { GeniusClient, parseLyricsIntoSections } from './genius.js';
import { extractAllSnippets } from './snippetExtractor.js';
import { generateSongSelectionPrompt, generateReplacementPrompt } from './prompts.js';
import { SongSelectionResponseSchema, SongSelectionSchema, type SongSelection } from './schemas.js';
import type { Puzzle, SongPuzzle, Difficulty, Decade } from './types.js';

const MAX_REPLACEMENT_ATTEMPTS = 2;
const DECADES: Decade[] = ['1960s', '1970s', '1980s', '1990s', '2000s', '2010s', '2020s'];

// Models to try in order if one fails
const MODELS_TO_TRY = ['claude-sonnet-4-5', 'claude-haiku-4-5'] as const;
const MAX_RETRIES_PER_MODEL = 2;
const RETRY_DELAY_MS = 1000;

interface AssemblyContext {
  anthropic: Anthropic;
  genius: GeniusClient;
  theme: string;
  difficulty: Difficulty;
}

interface SongCandidate {
  artist: string;
  title: string;
  year: number;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

interface ClaudeRequestParams {
  anthropic: Anthropic;
  system: string;
  userContent: string;
  maxTokens: number;
}

/**
 * Call Claude API with retry logic and model fallback.
 * Tries multiple models if one fails or is blocked.
 */
async function callClaudeWithRetry(params: ClaudeRequestParams): Promise<string> {
  const errors: string[] = [];

  for (const model of MODELS_TO_TRY) {
    for (let attempt = 1; attempt <= MAX_RETRIES_PER_MODEL; attempt++) {
      try {
        console.log(`[Claude] Trying ${model} (attempt ${attempt}/${MAX_RETRIES_PER_MODEL})`);

        const message = await params.anthropic.messages.create({
          model,
          max_tokens: params.maxTokens,
          system: params.system,
          messages: [
            { role: 'user', content: params.userContent },
            { role: 'assistant', content: '{' },
          ],
        });

        // Check if response was blocked or empty
        const textContent = message.content.find((b) => b.type === 'text');
        if (!textContent || textContent.type !== 'text') {
          throw new Error('No text response from Claude');
        }

        // Check stop reason - if it stopped due to content filtering, try again
        if (message.stop_reason === 'end_turn' || message.stop_reason === 'stop_sequence') {
          console.log(`[Claude] Success with ${model}`);
          return '{' + textContent.text;
        }

        // Unexpected stop reason
        console.log(`[Claude] Unexpected stop_reason: ${message.stop_reason}`);
        throw new Error(`Unexpected stop reason: ${message.stop_reason}`);

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`[Claude] ${model} attempt ${attempt} failed:`, errorMsg);
        errors.push(`${model} attempt ${attempt}: ${errorMsg}`);

        // Wait before retry (but not on last attempt of last model)
        const isLastModel = model === MODELS_TO_TRY[MODELS_TO_TRY.length - 1];
        const isLastAttempt = attempt === MAX_RETRIES_PER_MODEL;
        if (!(isLastModel && isLastAttempt)) {
          await delay(RETRY_DELAY_MS * attempt);
        }
      }
    }
  }

  throw new Error(`All Claude API attempts failed:\n${errors.join('\n')}`);
}

export async function assemblePuzzle(
  anthropic: Anthropic,
  genius: GeniusClient,
  theme: string,
  difficulty: Difficulty
): Promise<Puzzle> {
  const ctx: AssemblyContext = { anthropic, genius, theme, difficulty };

  // Step 1: Get song selections from Claude
  console.log(`Getting song selections for theme: "${theme}"`);
  const selections = await getSongSelections(ctx);

  // Step 2: Process each song - fetch lyrics and extract snippets
  const processedSongs: SongPuzzle[] = [];

  for (let i = 0; i < DECADES.length; i++) {
    const decade = DECADES[i];
    const selection = selections.songs[i];

    console.log(`Processing ${decade}: ${selection.artist} - ${selection.title}`);

    const song = await assembleSongWithRetries(ctx, selection, decade);
    processedSongs.push(song);
  }

  return {
    id: generateId(),
    theme: selections.theme,
    themeHint: selections.themeHint,
    songs: processedSongs,
    difficulty,
    createdAt: new Date().toISOString(),
  };
}

async function getSongSelections(ctx: AssemblyContext): Promise<z.infer<typeof SongSelectionResponseSchema>> {
  const userPrompt = generateSongSelectionPrompt(ctx.theme, ctx.difficulty);

  console.log('[Claude] getSongSelections - Request:');
  console.log('[Claude] Theme:', ctx.theme);
  console.log('[Claude] Difficulty:', ctx.difficulty);

  const jsonText = await callClaudeWithRetry({
    anthropic: ctx.anthropic,
    system: 'You are a music expert creating content for an educational trivia game. Respond with valid JSON only. No explanations, no markdown - just raw JSON starting with {',
    userContent: userPrompt,
    maxTokens: 4096,
  });

  console.log('[Claude] getSongSelections - Raw response length:', jsonText.length);

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (e) {
    console.error('[Claude] JSON parse error:', e);
    console.error('[Claude] Failed to parse response text:', jsonText);
    throw new Error(`Failed to parse Claude's response as JSON: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }

  console.log('[Claude] getSongSelections - Parsed songs:');
  const response = SongSelectionResponseSchema.parse(parsed);
  response.songs.forEach((song, i) => {
    console.log(`[Claude]   ${i + 1}. ${song.artist} - ${song.title} (${song.year})`);
  });

  return response;
}

async function assembleSongWithRetries(
  ctx: AssemblyContext,
  selection: SongSelection,
  decade: Decade
): Promise<SongPuzzle> {
  // Build list of candidates: primary song + alternates
  const candidates: SongCandidate[] = [
    { artist: selection.artist, title: selection.title, year: selection.year },
    ...(selection.alternates || []),
  ];

  const failedSongs: string[] = [];

  // Try each candidate
  for (const candidate of candidates) {
    try {
      const song = await tryAssembleSong(ctx, candidate, selection, decade);
      if (song) {
        return song;
      }
      failedSongs.push(`${candidate.artist} - ${candidate.title}`);
    } catch (error) {
      console.error(`Failed to process ${candidate.artist} - ${candidate.title}:`, error);
      failedSongs.push(`${candidate.artist} - ${candidate.title}`);
    }
  }

  // All candidates failed - ask Claude for replacements
  for (let attempt = 0; attempt < MAX_REPLACEMENT_ATTEMPTS; attempt++) {
    console.log(`Requesting replacement song for ${decade} (attempt ${attempt + 1})`);

    try {
      const replacement = await getReplacementSong(ctx, decade, failedSongs);
      const replacementCandidates: SongCandidate[] = [
        { artist: replacement.artist, title: replacement.title, year: replacement.year },
        ...(replacement.alternates || []),
      ];

      for (const candidate of replacementCandidates) {
        try {
          const song = await tryAssembleSong(ctx, candidate, replacement, decade);
          if (song) {
            return song;
          }
          failedSongs.push(`${candidate.artist} - ${candidate.title}`);
        } catch (error) {
          console.error(`Failed to process replacement ${candidate.artist} - ${candidate.title}:`, error);
          failedSongs.push(`${candidate.artist} - ${candidate.title}`);
        }
      }
    } catch (error) {
      console.error(`Failed to get replacement song:`, error);
    }
  }

  // Complete failure - throw error
  throw new Error(`Failed to assemble song for ${decade} after all retries. Tried: ${failedSongs.join(', ')}`);
}

async function tryAssembleSong(
  ctx: AssemblyContext,
  candidate: SongCandidate,
  selection: SongSelection,
  decade: Decade
): Promise<SongPuzzle | null> {
  // Try to assemble song from Genius lyrics
  return tryAssembleSongFromGenius(ctx, candidate, selection, decade);
}

async function tryAssembleSongFromGenius(
  ctx: AssemblyContext,
  candidate: SongCandidate,
  selection: SongSelection,
  decade: Decade
): Promise<SongPuzzle | null> {
  // Search Genius for the song
  const searchResult = await ctx.genius.searchSong(candidate.artist, candidate.title);

  if (!searchResult) {
    console.log(`Genius search failed for: ${candidate.artist} - ${candidate.title}`);
    return null;
  }

  // Scrape lyrics from Genius
  let lyrics: string;
  try {
    lyrics = await ctx.genius.scrapeLyrics(searchResult.url);
  } catch (error) {
    console.log(`Lyrics scraping failed for: ${candidate.artist} - ${candidate.title}`, error);
    return null;
  }

  // Parse lyrics into sections
  const sections = parseLyricsIntoSections(lyrics);

  if (sections.length === 0) {
    console.log(`No sections parsed from lyrics for: ${candidate.artist} - ${candidate.title}`);
    return null;
  }

  // Extract snippets using guidance
  const extractionResult = extractAllSnippets(sections, selection.snippetGuidance);

  if (!extractionResult.success) {
    console.log(
      `Snippet extraction failed for: ${candidate.artist} - ${candidate.title}`,
      extractionResult.errors
    );
    return null;
  }

  // Success! Build the song puzzle
  return {
    id: generateId(),
    decade,
    artist: candidate.artist,
    title: candidate.title,
    year: candidate.year,
    snippets: extractionResult.snippets,
    connectionHint: selection.connectionHint,
  };
}

async function getReplacementSong(
  ctx: AssemblyContext,
  decade: Decade,
  failedSongs: string[]
): Promise<SongSelection> {
  const userPrompt = generateReplacementPrompt(ctx.theme, decade, ctx.difficulty, failedSongs);

  console.log('[Claude] getReplacementSong - Request:');
  console.log('[Claude] Theme:', ctx.theme);
  console.log('[Claude] Decade:', decade);
  console.log('[Claude] Failed songs:', failedSongs.join(', '));

  const jsonText = await callClaudeWithRetry({
    anthropic: ctx.anthropic,
    system: 'You are a music expert creating content for an educational trivia game. Respond with valid JSON only.',
    userContent: userPrompt,
    maxTokens: 1024,
  });

  console.log('[Claude] getReplacementSong - Raw response length:', jsonText.length);

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (e) {
    console.error('[Claude] JSON parse error:', e);
    console.error('[Claude] Failed to parse response text:', jsonText);
    throw new Error(`Failed to parse replacement song response as JSON: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }

  const replacement = SongSelectionSchema.parse(parsed);
  console.log('[Claude] getReplacementSong - Parsed replacement:');
  console.log(`[Claude]   ${replacement.artist} - ${replacement.title} (${replacement.year})`);

  return replacement;
}

// Version for daily puzzles that includes puzzle number
export async function assembleDailyPuzzle(
  anthropic: Anthropic,
  genius: GeniusClient,
  theme: string,
  puzzleNumber: number
): Promise<Puzzle> {
  const puzzle = await assemblePuzzle(anthropic, genius, theme, 'medium');

  return {
    ...puzzle,
    id: `daily-${puzzleNumber}`,
    puzzleNumber,
  };
}
