import { z } from 'zod';

export const LyricSnippetSchema = z.object({
  text: z.string().min(10).max(300),
  difficulty: z.enum(['easy', 'medium', 'hard']),
});

export const SongPuzzleSchema = z.object({
  id: z.string().min(1),
  decade: z.enum(['1960s', '1970s', '1980s', '1990s', '2000s', '2010s', '2020s']),
  artist: z.string().min(1).max(100),
  title: z.string().min(1).max(150),
  year: z.number().min(1960).max(2029),
  snippets: z.array(LyricSnippetSchema).length(3),
  connectionHint: z.string().max(300),
});

export const PuzzleResponseSchema = z.object({
  id: z.string().min(1),
  theme: z.string(),
  themeHint: z.string().max(200),
  songs: z.array(SongPuzzleSchema).length(7),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  createdAt: z.string(),
  puzzleNumber: z.number().optional(),
});

export type PuzzleResponse = z.infer<typeof PuzzleResponseSchema>;

export const GenerateRequestSchema = z.object({
  theme: z.string().min(1).max(100),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
});

export type GenerateRequest = z.infer<typeof GenerateRequestSchema>;

// New schemas for song selection (Claude returns guidance, not lyrics)
export const SnippetGuidanceSchema = z.object({
  difficulty: z.enum(['easy', 'medium', 'hard']),
  section: z.enum(['verse', 'chorus', 'bridge', 'pre-chorus', 'intro', 'outro', 'other']),
  verseNumber: z.number().optional(),
  lineRange: z.object({ start: z.number(), end: z.number() }),
  keywords: z.array(z.string()).min(3).max(8),
  description: z.string().max(200),
  // Fallback lyrics to use if Genius API fails - 2-4 lines of actual lyrics
  fallbackLyrics: z.string().max(400).optional(),
});

export const SongSelectionSchema = z.object({
  decade: z.enum(['1960s', '1970s', '1980s', '1990s', '2000s', '2010s', '2020s']),
  artist: z.string().min(1).max(100),
  title: z.string().min(1).max(150),
  year: z.number().min(1960).max(2029),
  snippetGuidance: z.array(SnippetGuidanceSchema).length(3),
  connectionHint: z.string().max(300),
  alternates: z.array(z.object({
    artist: z.string(),
    title: z.string(),
    year: z.number(),
  })).max(3).optional(),
});

export const SongSelectionResponseSchema = z.object({
  theme: z.string(),
  themeHint: z.string().max(200),
  songs: z.array(SongSelectionSchema).length(7),
});

export type SongSelectionResponse = z.infer<typeof SongSelectionResponseSchema>;
export type SongSelection = z.infer<typeof SongSelectionSchema>;
export type SnippetGuidance = z.infer<typeof SnippetGuidanceSchema>;
