import { describe, it, expect } from 'vitest'
import {
  extractSnippet,
  extractAllSnippets,
  validateSnippetExtraction,
} from './snippetExtractor'
import type { LyricSection } from './types'
import type { SnippetGuidance } from './schemas'

describe('extractSnippet', () => {
  const sampleSections: LyricSection[] = [
    {
      type: 'verse',
      number: 1,
      lines: [
        'Is this the real life',
        'Is this just fantasy',
        'Caught in a landslide',
        'No escape from reality',
      ],
    },
    {
      type: 'chorus',
      number: 1,
      lines: [
        'Open your eyes',
        'Look up to the skies and see',
        'I am just a poor boy',
        'I need no sympathy',
      ],
    },
    {
      type: 'verse',
      number: 2,
      lines: [
        'Easy come easy go',
        'Little high little low',
        'Any way the wind blows',
        'Doesnt really matter to me',
      ],
    },
  ]

  it('extracts snippet from correct section and line range', () => {
    const guidance: SnippetGuidance = {
      difficulty: 'medium',
      section: 'verse',
      verseNumber: 1,
      lineRange: { start: 1, end: 2 },
      keywords: ['real', 'life', 'fantasy'],
      description: 'Opening lines',
    }

    const result = extractSnippet(sampleSections, guidance)
    expect(result.success).toBe(true)
    expect(result.snippet?.text).toContain('real life')
    expect(result.snippet?.difficulty).toBe('medium')
  })

  it('falls back to searching by section type when verse number does not match', () => {
    const guidance: SnippetGuidance = {
      difficulty: 'easy',
      section: 'verse',
      verseNumber: 99, // Non-existent verse
      lineRange: { start: 1, end: 2 },
      keywords: ['easy', 'come', 'go'],
      description: 'Second verse',
    }

    const result = extractSnippet(sampleSections, guidance)
    expect(result.success).toBe(true)
    expect(result.snippet?.text).toContain('Easy come easy go')
  })

  it('searches all sections when section type does not match', () => {
    const guidance: SnippetGuidance = {
      difficulty: 'hard',
      section: 'bridge', // No bridge exists
      lineRange: { start: 1, end: 2 },
      keywords: ['poor', 'boy', 'sympathy'],
      description: 'Some section',
    }

    const result = extractSnippet(sampleSections, guidance)
    expect(result.success).toBe(true)
    expect(result.snippet?.text).toContain('poor boy')
  })

  it('returns failure when no keywords match', () => {
    const guidance: SnippetGuidance = {
      difficulty: 'medium',
      section: 'verse',
      lineRange: { start: 1, end: 2 },
      keywords: ['nonexistent', 'words', 'here', 'nowhere'],
      description: 'Not in the song',
    }

    const result = extractSnippet(sampleSections, guidance)
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('handles out of bounds line range gracefully', () => {
    const guidance: SnippetGuidance = {
      difficulty: 'easy',
      section: 'verse',
      verseNumber: 1,
      lineRange: { start: 100, end: 103 },
      keywords: ['real', 'life', 'fantasy'],
      description: 'Out of bounds',
    }

    const result = extractSnippet(sampleSections, guidance)
    // Should still find it via keyword fallback
    expect(result.success).toBe(true)
  })
})

describe('extractAllSnippets', () => {
  const sampleSections: LyricSection[] = [
    {
      type: 'verse',
      number: 1,
      lines: ['Line one here', 'Line two here', 'Line three here'],
    },
    {
      type: 'chorus',
      number: 1,
      lines: ['Chorus line one', 'Chorus line two', 'Chorus line three'],
    },
    {
      type: 'bridge',
      number: 1,
      lines: ['Bridge line one', 'Bridge line two'],
    },
  ]

  it('extracts all 3 snippets successfully', () => {
    const guidances: SnippetGuidance[] = [
      {
        difficulty: 'hard',
        section: 'bridge',
        lineRange: { start: 1, end: 2 },
        keywords: ['Bridge', 'line'],
        description: 'Bridge section',
      },
      {
        difficulty: 'medium',
        section: 'verse',
        lineRange: { start: 1, end: 2 },
        keywords: ['Line', 'one', 'two'],
        description: 'First verse',
      },
      {
        difficulty: 'easy',
        section: 'chorus',
        lineRange: { start: 1, end: 2 },
        keywords: ['Chorus', 'line'],
        description: 'Chorus',
      },
    ]

    const result = extractAllSnippets(sampleSections, guidances)
    expect(result.success).toBe(true)
    expect(result.snippets).toHaveLength(3)
    expect(result.errors).toHaveLength(0)
  })

  it('sorts snippets by difficulty (hard, medium, easy)', () => {
    const guidances: SnippetGuidance[] = [
      {
        difficulty: 'easy',
        section: 'chorus',
        lineRange: { start: 1, end: 2 },
        keywords: ['Chorus', 'line'],
        description: 'Chorus',
      },
      {
        difficulty: 'hard',
        section: 'bridge',
        lineRange: { start: 1, end: 2 },
        keywords: ['Bridge', 'line'],
        description: 'Bridge',
      },
      {
        difficulty: 'medium',
        section: 'verse',
        lineRange: { start: 1, end: 2 },
        keywords: ['Line', 'one'],
        description: 'Verse',
      },
    ]

    const result = extractAllSnippets(sampleSections, guidances)
    expect(result.success).toBe(true)
    expect(result.snippets[0].difficulty).toBe('hard')
    expect(result.snippets[1].difficulty).toBe('medium')
    expect(result.snippets[2].difficulty).toBe('easy')
  })

  it('fails if not all 3 snippets can be extracted', () => {
    const guidances: SnippetGuidance[] = [
      {
        difficulty: 'hard',
        section: 'verse',
        lineRange: { start: 1, end: 2 },
        keywords: ['Line', 'one'],
        description: 'Verse',
      },
      {
        difficulty: 'medium',
        section: 'chorus',
        lineRange: { start: 1, end: 2 },
        keywords: ['Chorus', 'line'],
        description: 'Chorus',
      },
      {
        difficulty: 'easy',
        section: 'outro',
        lineRange: { start: 1, end: 2 },
        keywords: ['nonexistent', 'words', 'xyz', 'abc'],
        description: 'Does not exist',
      },
    ]

    const result = extractAllSnippets(sampleSections, guidances)
    expect(result.success).toBe(false)
    expect(result.snippets.length).toBeLessThan(3)
    expect(result.errors.length).toBeGreaterThan(0)
  })
})

describe('validateSnippetExtraction', () => {
  const sampleSections: LyricSection[] = [
    {
      type: 'verse',
      number: 1,
      lines: ['First line', 'Second line', 'Third line'],
    },
  ]

  it('returns valid when all guidances can be extracted', () => {
    const guidances: SnippetGuidance[] = [
      {
        difficulty: 'easy',
        section: 'verse',
        lineRange: { start: 1, end: 3 },
        keywords: ['First', 'Second', 'Third'],
        description: 'All lines',
      },
    ]

    const result = validateSnippetExtraction(sampleSections, guidances)
    expect(result.valid).toBe(true)
    expect(result.missing).toHaveLength(0)
  })

  it('returns missing guidances when extraction fails', () => {
    const guidances: SnippetGuidance[] = [
      {
        difficulty: 'easy',
        section: 'verse',
        lineRange: { start: 1, end: 2 },
        keywords: ['First', 'Second'],
        description: 'Works',
      },
      {
        difficulty: 'hard',
        section: 'bridge',
        lineRange: { start: 1, end: 2 },
        keywords: ['nothere', 'missing', 'words', 'xyz'],
        description: 'Does not work',
      },
    ]

    const result = validateSnippetExtraction(sampleSections, guidances)
    expect(result.valid).toBe(false)
    expect(result.missing).toHaveLength(1)
    expect(result.missing[0].difficulty).toBe('hard')
  })
})
