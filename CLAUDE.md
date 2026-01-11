# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Lyrics Puzzle is a React-based word game where players guess songs from lyric snippets across 7 decades (1960s-2020s), then guess the connecting theme. Puzzles are generated via Claude AI. The app is deployed on Vercel.

## Commands

```bash
# Development
npm run dev       # Start Vite dev server (frontend only)
npm run dev:api   # Start Vercel dev server (frontend + API functions)
npm run build     # TypeScript check + Vite build
npm run lint      # ESLint
npm run preview   # Preview production build

# Testing
npm run test      # Run Vitest in watch mode
npm run test:run  # Run tests once
npm run test:ui   # Open Vitest UI
npm run test:coverage  # Run tests with coverage report
```

For local API testing, use `npm run dev:api` which runs both frontend and serverless functions via Vercel CLI.

## Architecture

### Frontend (src/)
- **React + TypeScript + Vite** with path alias `@/` → `src/`
- Single-page app using `react-router-dom` for routing
- Main game state managed in `useGameState` hook - handles all game phases: input → generating → playing → theme-guess → results
- Types defined in `src/types/` - `Puzzle` (7 songs with snippets) and `GameState`

### Backend (api/)
- **Vercel Serverless Functions** with separate tsconfig (`api/tsconfig.json`)
- `api/generate.ts` - POST endpoint, creates custom puzzles
- `api/daily.ts` - GET endpoint, returns daily puzzle (cached 24h in Vercel KV)
- **Puzzle generation flow**:
  1. Claude provides song selections with snippet guidance (section, keywords, line ranges)
  2. Genius API fetches actual lyrics for each song
  3. Snippets extracted based on Claude's guidance
  4. If lyrics unavailable, retries with alternate songs
- Key modules:
  - `api/lib/puzzleAssembler.ts` - Orchestrates the full puzzle generation flow
  - `api/lib/genius.ts` - Genius API client for search and lyrics scraping
  - `api/lib/snippetExtractor.ts` - Extracts snippets from lyrics using guidance
  - `api/lib/prompts.ts` - Claude prompts for song selection
  - `api/lib/schemas.ts` - Zod schemas for validation

### Key Libraries
- **Puzzle generation**: `@anthropic-ai/sdk` calling `claude-sonnet-4-5`
- **Daily puzzle caching**: `@vercel/kv`
- **Validation**: `zod` for request/response schemas
- **URL sharing**: `lz-string` for compressing puzzles into shareable URLs

### Game Logic
- `src/lib/matching.ts` - Fuzzy matching for artist/title guesses (handles aliases like "The Beatles"/"Beatles")
- `src/lib/scoring.ts` - Points: 100 per correct song, penalties for hints (15/30), +100 theme bonus
- `src/lib/compression.ts` - Encodes/decodes puzzles to URL-safe strings for sharing

## Environment Variables

Required for API functions:
- `ANTHROPIC_API_KEY` - Claude API key
- `GENIUS_ACCESS_TOKEN` - Genius API access token for fetching lyrics
- `KV_REST_API_URL` / `KV_REST_API_TOKEN` - Vercel KV (daily puzzle caching)

## Testing

Tests use **Vitest** with `happy-dom` environment. Test files are colocated with source files using `.test.ts` suffix.

### Test Coverage

- `src/lib/matching.test.ts` - Fuzzy matching logic for artist/title guesses
- `src/lib/scoring.test.ts` - Score calculation and result formatting
- `api/lib/schemas.test.ts` - Zod schema validation

### VSCode Debugging

Launch configurations available in `.vscode/launch.json`:

- **Debug Vitest Tests** - Debug all tests
- **Debug Current Test File** - Debug the currently open test file
- **Debug Vercel Dev** - Debug full stack with API functions
- **Chrome: Debug Frontend** - Debug frontend in Chrome

## Notes

- Daily themes rotate through a fixed list in `DAILY_THEMES` array (defined in `api/lib/prompts.ts`)
- Puzzle number is deterministic based on days since 2024-01-01
