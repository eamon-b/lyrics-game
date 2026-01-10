import { describe, it, expect } from 'vitest'
import { calculateSongScore, calculateTotalScore, getMaxPossibleScore, formatShareResult } from './scoring'

describe('calculateSongScore', () => {
  it('returns 0 for incorrect guesses', () => {
    expect(calculateSongScore(false, 0, 'medium')).toBe(0)
    expect(calculateSongScore(false, 2, 'easy')).toBe(0)
  })

  it('returns full points with no hints', () => {
    expect(calculateSongScore(true, 0, 'hard')).toBe(100)
  })

  it('applies hint penalties correctly', () => {
    expect(calculateSongScore(true, 1, 'medium')).toBe(85) // 100 - 15
    expect(calculateSongScore(true, 2, 'easy')).toBe(70) // 100 - 30
  })
})

describe('calculateTotalScore', () => {
  it('sums all song scores', () => {
    const scores = [100, 85, 70, 100, 0, 85, 70]
    const result = calculateTotalScore(scores, false)
    expect(result.total).toBe(510) // sum of scores, no theme bonus
  })

  it('adds theme bonus when theme is correct', () => {
    const scores = [100, 100, 100, 100, 100, 100, 100]
    const result = calculateTotalScore(scores, true)
    expect(result.total).toBe(800) // 700 + 100 theme bonus
    expect(result.themeBonus).toBe(100)
  })

  it('calculates base points correctly', () => {
    const scores = [100, 0, 85, 0, 70, 0, 100]
    const result = calculateTotalScore(scores, false)
    expect(result.basePoints).toBe(400) // 4 correct songs * 100
  })

  it('calculates hint penalty correctly', () => {
    const scores = [100, 85, 70, 100, 100, 100, 100]
    const result = calculateTotalScore(scores, false)
    // Penalty = (100-100) + (100-85) + (100-70) + ... = 0 + 15 + 30 + 0 + 0 + 0 + 0 = 45
    expect(result.hintPenalty).toBe(45)
  })
})

describe('getMaxPossibleScore', () => {
  it('returns 800 (7 songs * 100 + theme bonus)', () => {
    expect(getMaxPossibleScore()).toBe(800)
  })
})

describe('formatShareResult', () => {
  it('formats results with correct symbols', () => {
    const songResults = [
      { correct: true, hintsUsed: 0 },  // *
      { correct: true, hintsUsed: 1 },  // ~
      { correct: true, hintsUsed: 2 },  // .
      { correct: false, hintsUsed: 0 }, // X
      { correct: true, hintsUsed: 0 },  // *
      { correct: true, hintsUsed: 1 },  // ~
      { correct: true, hintsUsed: 2 },  // .
    ]

    const result = formatShareResult(songResults, true, 655)
    expect(result).toContain('60s: *')
    expect(result).toContain('70s: ~')
    expect(result).toContain('80s: .')
    expect(result).toContain('90s: X')
    expect(result).toContain('Theme: *')
    expect(result).toContain('Score: 655/800')
  })

  it('includes puzzle number when provided', () => {
    const songResults = Array(7).fill({ correct: true, hintsUsed: 0 })
    const result = formatShareResult(songResults, true, 800, 42)
    expect(result).toContain('Lyrics Puzzle #42')
  })

  it('shows theme as X when incorrect', () => {
    const songResults = Array(7).fill({ correct: true, hintsUsed: 0 })
    const result = formatShareResult(songResults, false, 700)
    expect(result).toContain('Theme: X')
  })
})
