import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { GeniusClient, parseLyricsIntoSections } from './genius.js';
import { extractAllSnippets } from './snippetExtractor.js';
import { generateSongSelectionPrompt, generateReplacementPrompt } from './prompts.js';
import { SongSelectionResponseSchema, SongSelectionSchema, type SongSelection } from './schemas.js';
import type { Puzzle, SongPuzzle, Difficulty, Decade } from './types.js';

const MAX_REPLACEMENT_ATTEMPTS = 2;
const DECADES: Decade[] = ['1960s', '1970s', '1980s', '1990s', '2000s', '2010s', '2020s'];

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
  const message = await ctx.anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 4096,
    system: 'You are a music expert. Respond with valid JSON only. No explanations, no markdown - just raw JSON starting with {',
    messages: [
      {
        role: 'user',
        content: generateSongSelectionPrompt(ctx.theme, ctx.difficulty),
      },
      {
        role: 'assistant',
        content: '{',
      },
    ],
  });

  const textContent = message.content.find((b) => b.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  const jsonText = '{' + textContent.text;

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (e) {
    throw new Error(`Failed to parse Claude's response as JSON: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }

  return SongSelectionResponseSchema.parse(parsed);
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
  const message = await ctx.anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    system: 'You are a music expert. Respond with valid JSON only.',
    messages: [
      {
        role: 'user',
        content: generateReplacementPrompt(ctx.theme, decade, ctx.difficulty, failedSongs),
      },
      {
        role: 'assistant',
        content: '{',
      },
    ],
  });

  const textContent = message.content.find((b) => b.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  const jsonText = '{' + textContent.text;

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (e) {
    throw new Error(`Failed to parse replacement song response as JSON: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }

  return SongSelectionSchema.parse(parsed);
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
