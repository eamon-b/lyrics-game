import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import { GenerateRequestSchema } from './lib/schemas.js';
import { GeniusClient } from './lib/genius.js';
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
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const geniusToken = process.env.GENIUS_ACCESS_TOKEN;
    console.log('GENIUS_ACCESS_TOKEN present:', !!geniusToken, 'length:', geniusToken?.length);
    if (!geniusToken) {
      return res.status(500).json({
        error: 'Configuration error',
        message: 'Genius API token not configured',
      });
    }

    const genius = new GeniusClient(geniusToken);

    const puzzle = await assemblePuzzle(anthropic, genius, theme, difficulty);

    return res.status(200).json(puzzle);
  } catch (error) {
    console.error('Error generating puzzle:', error);

    // Handle Anthropic API errors
    if (error instanceof Anthropic.APIError) {
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
