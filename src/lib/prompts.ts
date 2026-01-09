import type { Difficulty } from '@/types/puzzle';

export function generatePuzzlePrompt(theme: string, difficulty: Difficulty): string {
  const difficultyGuide = {
    easy: `
- Choose well-known hits that most people would recognize
- Theme connections can be more direct and obvious
- Lyrics should be from memorable parts of the songs`,
    medium: `
- Mix of popular hits and moderately known songs
- Theme connections should be interesting but not too obscure
- Lyrics should be recognizable but not always the most famous lines`,
    hard: `
- Include some lesser-known songs alongside classics
- Theme connections can be more subtle or creative
- Lyrics should be challenging - avoid the most obvious chorus lines`,
  };

  return `You are a music expert creating a lyrics guessing game puzzle.

THEME: "${theme}"

Create a puzzle with exactly 7 songs - one from each decade (1960s, 1970s, 1980s, 1990s, 2000s, 2010s, 2020s).

REQUIREMENTS:
1. Every song MUST clearly connect to the theme "${theme}"
2. Songs should be from well-known artists that people have heard of
3. The theme connection should be interesting - it could be in the lyrics, the title, or what the song is about
4. Vary the genres across decades when possible

DIFFICULTY LEVEL: ${difficulty.toUpperCase()}
${difficultyGuide[difficulty]}

FOR EACH SONG, PROVIDE:
- decade: The decade (e.g., "1980s")
- artist: Artist name exactly as commonly known
- title: Exact official song title
- year: Release year
- snippets: An array of exactly 3 lyric snippets:
  1. difficulty: "hard" - An obscure or atmospheric line that's difficult to identify. Avoid including the song title.
  2. difficulty: "medium" - A recognizable line but not the most famous part
  3. difficulty: "easy" - An iconic, well-known line (often from the chorus)
- connectionHint: Brief explanation of how this song connects to the theme (this is revealed after guessing)

LYRIC SNIPPET RULES:
- Each snippet should be 1-3 lines (10-50 words)
- Use actual lyrics from the song (be accurate)
- Hard snippets should NOT contain the song title
- Snippets should be distinct from each other (different parts of the song)

THEME HINT:
Also provide a "themeHint" - a clever clue that helps players guess the connecting theme after they've identified some songs. Don't make it too obvious.

Respond with valid JSON matching this exact structure:
{
  "theme": "${theme}",
  "themeHint": "A clever hint about the theme",
  "songs": [
    {
      "decade": "1960s",
      "artist": "Artist Name",
      "title": "Song Title",
      "year": 1965,
      "snippets": [
        { "text": "Hard lyric line here", "difficulty": "hard" },
        { "text": "Medium lyric line here", "difficulty": "medium" },
        { "text": "Easy lyric line here", "difficulty": "easy" }
      ],
      "connectionHint": "How this connects to the theme"
    }
    // ... 6 more songs for 1970s through 2020s
  ]
}`;
}

export const DAILY_THEMES = [
  'rain',
  'fire',
  'colors',
  'dancing',
  'dreams',
  'roads and journeys',
  'the moon',
  'heartbreak',
  'cities',
  'time',
  'freedom',
  'stars',
  'money',
  'summer',
  'night',
  'love letters',
  'running',
  'home',
  'water',
  'eyes',
  'angels',
  'heaven and hell',
  'cars',
  'telephone calls',
  'waiting',
  'crazy',
  'names in the title',
  'animals',
  'numbers',
  'seasons',
];
