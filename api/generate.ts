import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { generatePuzzlePrompt } from '../src/lib/prompts';
import { PuzzleResponseSchema, GenerateRequestSchema } from '../src/lib/schemas';
import type { Puzzle, SongPuzzle } from '../src/types/puzzle';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

function transformToPuzzle(
  response: z.infer<typeof PuzzleResponseSchema>,
  difficulty: 'easy' | 'medium' | 'hard'
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
    id: generateId(),
    theme: response.theme,
    themeHint: response.themeHint,
    songs,
    difficulty,
    createdAt: new Date().toISOString(),
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate request body
  const parseResult = GenerateRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      error: 'Invalid request',
      details: parseResult.error.issues,
    });
  }

  const { theme, difficulty } = parseResult.data;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: generatePuzzlePrompt(theme, difficulty),
        },
      ],
    });

    // Extract the text content
    const textContent = message.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    // Parse the JSON response
    let jsonText = textContent.text;

    // Handle markdown code blocks if present
    const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1].trim();
    }

    const parsed = JSON.parse(jsonText);

    // Validate against schema
    const validated = PuzzleResponseSchema.parse(parsed);

    // Transform to full Puzzle type
    const puzzle = transformToPuzzle(validated, difficulty);

    return res.status(200).json(puzzle);
  } catch (error) {
    console.error('Error generating puzzle:', error);

    if (error instanceof z.ZodError) {
      return res.status(500).json({
        error: 'Invalid response from AI',
        details: error.issues,
      });
    }

    if (error instanceof SyntaxError) {
      return res.status(500).json({
        error: 'Failed to parse AI response as JSON',
      });
    }

    return res.status(500).json({
      error: 'Failed to generate puzzle',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
