import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';
import { GenerateRequestSchema } from './lib/schemas.js';
import { assemblePuzzle } from './lib/puzzleAssembler.js';

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
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: 'Configuration error',
        message: 'OpenAI API key not configured',
      });
    }

    const openai = new OpenAI({
      apiKey,
    });

    const puzzle = await assemblePuzzle(openai, theme, difficulty);

    return res.status(200).json(puzzle);
  } catch (error) {
    console.error('Error generating puzzle:', error);

    // Handle OpenAI API errors
    if (error instanceof OpenAI.APIError) {
      return res.status(error.status || 500).json({
        error: 'API error',
        message: error.message,
      });
    }

    return res.status(500).json({
      error: 'Failed to generate puzzle',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
