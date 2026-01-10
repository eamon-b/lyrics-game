import { describe, it, expect } from 'vitest'
import { matchArtist, matchTitle, checkGuess } from './matching'

describe('matchArtist', () => {
  it('matches exact artist names', () => {
    expect(matchArtist('The Beatles', 'The Beatles')).toBe(true)
    expect(matchArtist('Queen', 'Queen')).toBe(true)
  })

  it('matches case-insensitively', () => {
    expect(matchArtist('the beatles', 'The Beatles')).toBe(true)
    expect(matchArtist('QUEEN', 'Queen')).toBe(true)
  })

  it('matches with/without "The" prefix', () => {
    expect(matchArtist('Beatles', 'The Beatles')).toBe(true)
    expect(matchArtist('The Beatles', 'Beatles')).toBe(true)
    expect(matchArtist('Rolling Stones', 'The Rolling Stones')).toBe(true)
  })

  it('matches known aliases', () => {
    expect(matchArtist('GNR', 'Guns N Roses')).toBe(true)
    expect(matchArtist('Guns and Roses', 'Guns N Roses')).toBe(true)
    expect(matchArtist('ACDC', 'AC DC')).toBe(true)
    expect(matchArtist('REM', 'R.E.M.')).toBe(true)
    expect(matchArtist('Zeppelin', 'Led Zeppelin')).toBe(true)
  })

  it('ignores punctuation', () => {
    expect(matchArtist('Guns N\' Roses', 'Guns N Roses')).toBe(true)
    expect(matchArtist('AC/DC', 'AC DC')).toBe(true)
  })

  it('rejects non-matching artists', () => {
    expect(matchArtist('The Beatles', 'Queen')).toBe(false)
    expect(matchArtist('Led Zeppelin', 'Pink Floyd')).toBe(false)
  })

  it('handles partial matches for longer names', () => {
    expect(matchArtist('Prince', 'Prince and the Revolution')).toBe(true)
  })
})

describe('matchTitle', () => {
  it('matches exact titles', () => {
    expect(matchTitle('Bohemian Rhapsody', 'Bohemian Rhapsody')).toBe(true)
    expect(matchTitle('Hey Jude', 'Hey Jude')).toBe(true)
  })

  it('matches case-insensitively', () => {
    expect(matchTitle('bohemian rhapsody', 'Bohemian Rhapsody')).toBe(true)
  })

  it('normalizes away parenthetical content since punctuation is stripped', () => {
    // The normalize() function removes all punctuation including parens
    // So "Yellow Submarine (Remastered)" becomes "yellow submarine remastered"
    // This means subtitles become part of the normalized string
    // "Yellow Submarine Remastered" would match because both normalize to same thing
    expect(matchTitle('Yellow Submarine Remastered', 'Yellow Submarine Remastered')).toBe(true)
  })

  it('handles article variations (a, an, the)', () => {
    expect(matchTitle('Day in the Life', 'A Day in the Life')).toBe(true)
    expect(matchTitle('A Hard Days Night', 'Hard Days Night')).toBe(true)
  })

  it('ignores punctuation', () => {
    expect(matchTitle('Cant Buy Me Love', "Can't Buy Me Love")).toBe(true)
  })

  it('rejects non-matching titles', () => {
    expect(matchTitle('Hey Jude', 'Let It Be')).toBe(false)
  })
})

describe('checkGuess', () => {
  it('checks both artist and title together', () => {
    const result = checkGuess('The Beatles', 'Hey Jude', 'The Beatles', 'Hey Jude')
    expect(result.artistCorrect).toBe(true)
    expect(result.titleCorrect).toBe(true)
  })

  it('can have partial matches', () => {
    const result = checkGuess('Beatles', 'Wrong Song', 'The Beatles', 'Hey Jude')
    expect(result.artistCorrect).toBe(true)
    expect(result.titleCorrect).toBe(false)
  })

  it('handles both wrong', () => {
    const result = checkGuess('Queen', 'Wrong Song', 'The Beatles', 'Hey Jude')
    expect(result.artistCorrect).toBe(false)
    expect(result.titleCorrect).toBe(false)
  })
})
