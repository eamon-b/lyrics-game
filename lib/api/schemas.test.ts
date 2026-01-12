import { describe, it, expect } from 'vitest'
import {
  LyricSnippetSchema,
  SongPuzzleSchema,
  PuzzleResponseSchema,
  GenerateRequestSchema,
  SnippetGuidanceSchema,
  SongSelectionSchema,
  SongSelectionResponseSchema
} from './schemas.js'

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
    id: 'song-123',
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
  let songIdCounter = 0
  const createValidSong = (decade: string, year: number) => ({
    id: `song-${++songIdCounter}`,
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
    id: 'puzzle-123',
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
    difficulty: 'medium',
    createdAt: '2024-01-01T00:00:00.000Z',
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

describe('SnippetGuidanceSchema', () => {
  const validGuidance = {
    difficulty: 'medium',
    section: 'verse',
    verseNumber: 1,
    lineRange: { start: 1, end: 3 },
    keywords: ['word1', 'word2', 'word3'],
    description: 'Test description',
  }

  it('accepts valid snippet guidance', () => {
    expect(() => SnippetGuidanceSchema.parse(validGuidance)).not.toThrow()
  })

  it('accepts guidance without verseNumber', () => {
    const { verseNumber, ...withoutVerseNumber } = validGuidance
    expect(() => SnippetGuidanceSchema.parse(withoutVerseNumber)).not.toThrow()
  })

  it('rejects invalid section type', () => {
    const invalid = { ...validGuidance, section: 'instrumental' }
    expect(() => SnippetGuidanceSchema.parse(invalid)).toThrow()
  })

  it('requires at least 3 keywords', () => {
    const invalid = { ...validGuidance, keywords: ['word1', 'word2'] }
    expect(() => SnippetGuidanceSchema.parse(invalid)).toThrow()
  })

  it('rejects more than 8 keywords', () => {
    const invalid = {
      ...validGuidance,
      keywords: ['w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7', 'w8', 'w9'],
    }
    expect(() => SnippetGuidanceSchema.parse(invalid)).toThrow()
  })
})

describe('SongSelectionSchema', () => {
  const validGuidance = {
    difficulty: 'hard',
    section: 'verse',
    lineRange: { start: 1, end: 3 },
    keywords: ['word1', 'word2', 'word3'],
    description: 'Test description',
  }

  const validSelection = {
    decade: '1980s',
    artist: 'Queen',
    title: 'Bohemian Rhapsody',
    year: 1975,
    snippetGuidance: [
      { ...validGuidance, difficulty: 'hard' },
      { ...validGuidance, difficulty: 'medium' },
      { ...validGuidance, difficulty: 'easy' },
    ],
    connectionHint: 'A song about a condemned man',
    alternates: [
      { artist: 'A-ha', title: 'Take On Me', year: 1985 },
    ],
  }

  it('accepts valid song selection', () => {
    expect(() => SongSelectionSchema.parse(validSelection)).not.toThrow()
  })

  it('accepts selection without alternates', () => {
    const { alternates, ...withoutAlternates } = validSelection
    expect(() => SongSelectionSchema.parse(withoutAlternates)).not.toThrow()
  })

  it('requires exactly 3 snippet guidances', () => {
    const invalid = {
      ...validSelection,
      snippetGuidance: validSelection.snippetGuidance.slice(0, 2),
    }
    expect(() => SongSelectionSchema.parse(invalid)).toThrow()
  })
})

describe('SongSelectionResponseSchema', () => {
  const createValidGuidance = (difficulty: string) => ({
    difficulty,
    section: 'verse',
    lineRange: { start: 1, end: 3 },
    keywords: ['word1', 'word2', 'word3'],
    description: 'Test description',
  })

  const createValidSelection = (decade: string, year: number) => ({
    decade,
    artist: 'Test Artist',
    title: 'Test Song',
    year,
    snippetGuidance: [
      createValidGuidance('hard'),
      createValidGuidance('medium'),
      createValidGuidance('easy'),
    ],
    connectionHint: 'Test hint',
  })

  const validResponse = {
    theme: 'Love',
    themeHint: 'Songs about romantic feelings',
    songs: [
      createValidSelection('1960s', 1965),
      createValidSelection('1970s', 1975),
      createValidSelection('1980s', 1985),
      createValidSelection('1990s', 1995),
      createValidSelection('2000s', 2005),
      createValidSelection('2010s', 2015),
      createValidSelection('2020s', 2022),
    ],
  }

  it('accepts valid song selection response', () => {
    expect(() => SongSelectionResponseSchema.parse(validResponse)).not.toThrow()
  })

  it('requires exactly 7 songs', () => {
    const invalid = {
      ...validResponse,
      songs: validResponse.songs.slice(0, 6),
    }
    expect(() => SongSelectionResponseSchema.parse(invalid)).toThrow()
  })

  it('rejects theme hint over 200 characters', () => {
    const invalid = {
      ...validResponse,
      themeHint: 'x'.repeat(201),
    }
    expect(() => SongSelectionResponseSchema.parse(invalid)).toThrow()
  })
})
