import type { Difficulty } from './types.js';

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
- CRITICAL: You MUST provide the EXACT, VERBATIM lyrics from the song - word for word as they appear in the recording
- NEVER use placeholder descriptions like "[Lyrics about...]" or "[Verse describing...]" - these are NOT acceptable
- If you are not certain of a song's exact lyrics, choose a DIFFERENT song that you know well
- Hard snippets should NOT contain the song title
- Snippets should be distinct from each other (different parts of the song)
- Only select songs where you are confident in the precise wording of the lyrics

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
  // Classic themes
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

  // Movie & TV soundtrack references
  'songs from Shrek movies',
  'songs featured in The Office (US)',
  'songs from Guardians of the Galaxy soundtrack',
  'songs from Pulp Fiction',
  'songs from Forrest Gump',
  'songs that appeared in a James Bond film',
  'songs from The Breakfast Club',
  'songs featured in Stranger Things',
  'songs from Dirty Dancing',
  'songs from Top Gun',
  'songs that played during a movie kiss scene',
  'songs from Wayne\'s World',
  'songs featured in karaoke scenes in movies',

  // Silly programmer/nerd humor
  'songs to listen to while using vim',
  'songs about debugging at 3am',
  'songs for when your code finally compiles',
  'songs that mention computers or technology',
  'songs about math or counting',
  'songs that would play in a hacker movie montage',
  'songs for your git commit messages',

  // Absurd and funny
  'songs that mention specific foods',
  'songs with colors in the title',
  'songs you\'d hear at a grocery store',
  'songs your dad definitely knows all the words to',
  'songs that have been in a car commercial',
  'songs with ridiculous music videos',
  'songs about being a loser or failure',
  'songs that make no sense but slap',
  'songs that are secretly really sad but sound happy',
  'songs you\'d hear at a middle school dance',
  'songs your dentist plays during cleanings',
  'songs about partying that are actually depressing',
  'songs with spoken word interludes',
  'songs that sample other famous songs',
  'songs that were in Just Dance games',
  'one-hit wonders',
  'songs banned from radio at some point',
  'songs with extremely long titles',
  'songs with phone numbers in them',
  'songs that tell a complete story',
  'songs about specific days of the week',

  // Music meta themes
  'songs about other songs or music',
  'songs that reference other artists by name',
  'cover songs more famous than the original',
  'songs that were #1 on the Billboard Hot 100',
  'songs from artists who changed their name',
  'songs from bands that broke up dramatically',
  'Grammy Award winners for Song of the Year',
  'songs with famous guitar solos',
  'songs with iconic opening lines',
  'songs that were controversial when released',
  'songs from artists\' debut albums',
  'songs written for someone specific',
  'duets',
  'songs with call and response',
  'songs recorded live',

  // Seasonal and holiday
  'songs for New Year\'s Eve',
  'songs about spring',
  'back to school songs',
  'Halloween-appropriate songs',
  'songs for a summer road trip',
  'songs about winter that aren\'t Christmas songs',
  'graduation songs',
  'wedding first dance songs',
  'breakup songs for Valentine\'s Day',
  'songs about Thanksgiving or gratitude',
  'songs about Monday mornings',
  'Friday night anthems',

  // Emotional vibes
  'songs for a main character moment',
  'songs for staring dramatically out a window',
  'songs that make you want to run through an airport',
  'songs for a villain origin story',
  'songs for when you\'re the last one at the party',
  'songs about growing old',
  'songs about being young and reckless',
  'songs about nostalgia',
  'songs about revenge',
  'songs about being alone at night',
  'songs for a breakup montage',
  'songs about small towns',
  'songs about big cities',
  'songs about leaving home',
  'songs about coming back home',

  // Decades and eras
  'songs that defined the 1980s',
  'songs that defined the 1990s',
  'songs from the disco era',
  'songs from the British Invasion',
  'songs from the grunge era',
  'songs from the Motown era',
  'classic rock anthems',
  'songs from the MTV era',
  'songs from the Summer of Love (1967)',
  'Y2K era pop songs',

  // Activities
  'workout playlist essentials',
  'songs for a long drive at night',
  'songs for cooking dinner',
  'songs for cleaning the house',
  'songs for a rainy day indoors',
  'songs for a beach day',
  'songs that make people air guitar',
  'songs everyone knows the dance to',
  'songs for karaoke night',
  'songs to sing in the shower',
  'songs for a power walk',
  'campfire songs',

  // Wordplay and specifics
  'songs with place names in the title',
  'songs with questions as titles',
  'songs with exclamation points in the title',
  'songs with one-word titles',
  'songs that repeat a word many times',
  'songs with parentheses in the title',
  'songs with "baby" in the lyrics',
  'songs about the sun',
  'songs about the sea',
  'songs about flying',
  'songs about fighting',
  'songs about magic',
  'songs about royalty (kings, queens, princes)',
  'songs about specific body parts',
  'songs mentioning alcohol',
  'songs about getting older',
  'songs about youth',
  'songs about secrets',
  'songs with whistling',
  'songs with clapping',

  // Pop culture moments
  'songs that went viral on TikTok',
  'songs from Super Bowl halftime shows',
  'songs that were in Apple commercials',
  'songs from Live Aid (1985)',
  'songs that samples in hip hop classics',
  'songs used in political campaigns',
  'songs that inspired flash mobs',
  'songs from the We Are the World era',
  'songs covered on Glee',
  'songs from American Idol winners or contestants',
];
