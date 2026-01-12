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

// Schema for LLM response with direct lyrics
export const LLMSongSchema = z.object({
  decade: z.enum(['1960s', '1970s', '1980s', '1990s', '2000s', '2010s', '2020s']),
  artist: z.string().min(1).max(100),
  title: z.string().min(1).max(150),
  year: z.number().min(1960).max(2029),
  snippets: z.array(LyricSnippetSchema).length(3),
  connectionHint: z.string().max(300),
});

export const LLMPuzzleResponseSchema = z.object({
  theme: z.string(),
  themeHint: z.string().max(200),
  songs: z.array(LLMSongSchema).length(7),
});

export type LLMPuzzleResponse = z.infer<typeof LLMPuzzleResponseSchema>;
export type LLMSong = z.infer<typeof LLMSongSchema>;
