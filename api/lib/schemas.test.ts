import { describe, it, expect } from 'vitest'
import {
  LyricSnippetSchema,
  SongPuzzleSchema,
  PuzzleResponseSchema,
  GenerateRequestSchema
} from './schemas'

describe('LyricSnippetSchema', () => {
  it('accepts valid snippets', () => {
    const valid = {
      text: 'Some lyric text that is long enough',
      difficulty: 'medium',
    }
    expect(() => LyricSnippetSchema.parse(valid)).not.toThrow()
  })

  it('rejects text that is too short', () => {
    const invalid = {
      text: 'Short',
      difficulty: 'medium',
    }
    expect(() => LyricSnippetSchema.parse(invalid)).toThrow()
  })

  it('rejects invalid difficulty', () => {
    const invalid = {
      text: 'Some lyric text that is long enough',
      difficulty: 'impossible',
    }
    expect(() => LyricSnippetSchema.parse(invalid)).toThrow()
  })
})

describe('SongPuzzleSchema', () => {
  const validSong = {
    decade: '1980s',
    artist: 'Queen',
    title: 'Bohemian Rhapsody',
    year: 1975,
    snippets: [
      { text: 'Is this the real life? Is this just fantasy?', difficulty: 'easy' },
      { text: 'Caught in a landslide, no escape from reality', difficulty: 'medium' },
      { text: 'Open your eyes, look up to the skies and see', difficulty: 'hard' },
    ],
    connectionHint: 'A song about a condemned man',
  }

  it('accepts valid song puzzles', () => {
    expect(() => SongPuzzleSchema.parse(validSong)).not.toThrow()
  })

  it('requires exactly 3 snippets', () => {
    const twoSnippets = {
      ...validSong,
      snippets: validSong.snippets.slice(0, 2),
    }
    expect(() => SongPuzzleSchema.parse(twoSnippets)).toThrow()
  })

  it('rejects invalid decades', () => {
    const invalidDecade = {
      ...validSong,
      decade: '1950s',
    }
    expect(() => SongPuzzleSchema.parse(invalidDecade)).toThrow()
  })

  it('rejects years outside valid range', () => {
    const invalidYear = {
      ...validSong,
      year: 1955,
    }
    expect(() => SongPuzzleSchema.parse(invalidYear)).toThrow()
  })
})

describe('PuzzleResponseSchema', () => {
  const createValidSong = (decade: string, year: number) => ({
    decade,
    artist: 'Test Artist',
    title: 'Test Song',
    year,
    snippets: [
      { text: 'First lyric snippet here with enough text', difficulty: 'easy' },
      { text: 'Second lyric snippet here with enough text', difficulty: 'medium' },
      { text: 'Third lyric snippet here with enough text', difficulty: 'hard' },
    ],
    connectionHint: 'Test hint',
  })

  const validPuzzle = {
    theme: 'Love',
    themeHint: 'Songs about romantic feelings',
    songs: [
      createValidSong('1960s', 1965),
      createValidSong('1970s', 1975),
      createValidSong('1980s', 1985),
      createValidSong('1990s', 1995),
      createValidSong('2000s', 2005),
      createValidSong('2010s', 2015),
      createValidSong('2020s', 2022),
    ],
  }

  it('accepts valid puzzle responses', () => {
    expect(() => PuzzleResponseSchema.parse(validPuzzle)).not.toThrow()
  })

  it('requires exactly 7 songs', () => {
    const sixSongs = {
      ...validPuzzle,
      songs: validPuzzle.songs.slice(0, 6),
    }
    expect(() => PuzzleResponseSchema.parse(sixSongs)).toThrow()
  })
})

describe('GenerateRequestSchema', () => {
  it('accepts valid requests', () => {
    const valid = { theme: 'love', difficulty: 'medium' }
    expect(() => GenerateRequestSchema.parse(valid)).not.toThrow()
  })

  it('defaults difficulty to medium', () => {
    const result = GenerateRequestSchema.parse({ theme: 'love' })
    expect(result.difficulty).toBe('medium')
  })

  it('rejects empty theme', () => {
    const invalid = { theme: '', difficulty: 'medium' }
    expect(() => GenerateRequestSchema.parse(invalid)).toThrow()
  })

  it('rejects invalid difficulty', () => {
    const invalid = { theme: 'love', difficulty: 'super-hard' }
    expect(() => GenerateRequestSchema.parse(invalid)).toThrow()
  })
})
