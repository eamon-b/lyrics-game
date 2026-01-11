import type { Difficulty } from './types.js';

// Legacy function - kept for reference but no longer used
export function generatePuzzlePrompt(theme: string, difficulty: Difficulty): string {
  return generateSongSelectionPrompt(theme, difficulty);
}

export function generateSongSelectionPrompt(theme: string, difficulty: Difficulty): string {
  const difficultyGuide = {
    easy: `Choose well-known hits with memorable, easily searchable lyrics`,
    medium: `Mix of popular hits and moderately known songs`,
    hard: `Include some deeper cuts, avoid the most obvious choices`,
  };

  return `You are a music expert creating a lyrics guessing game puzzle.

THEME: "${theme}"
DIFFICULTY: ${difficulty.toUpperCase()} - ${difficultyGuide[difficulty]}

Create a puzzle with exactly 7 songs - one from each decade (1960s through 2020s).
Each song must clearly connect to the theme "${theme}".

IMPORTANT: Do NOT provide any actual song lyrics. We will fetch lyrics from a lyrics database.
Your job is only to select songs and describe WHERE to find good snippets within them.

FOR EACH SONG, PROVIDE:
- decade, artist, title, year (exact official info)
- connectionHint: How this song connects to the theme
- snippetGuidance: Array of 3 snippet guides (one each: hard, medium, easy)
- alternates: 2 backup songs from the same decade in case lyrics can't be fetched

SNIPPET GUIDANCE FORMAT:
For each difficulty level, describe WHERE to find a good snippet:
{
  "difficulty": "hard" | "medium" | "easy",
  "section": "verse" | "chorus" | "bridge" | "pre-chorus" | "intro" | "outro" | "other",
  "verseNumber": 1,  // Optional: which verse (1st, 2nd, etc.)
  "lineRange": { "start": 1, "end": 3 },  // Approximate lines within that section
  "keywords": ["word1", "word2", "word3", "word4"],  // 3-8 distinctive words that MUST appear in the snippet
  "description": "Brief description of what this section is about"
}

DO NOT include actual lyrics text. Only provide guidance for locating the right section.

SNIPPET DIFFICULTY GUIDELINES:
- HARD: Obscure verse, atmospheric line, should NOT contain song title
- MEDIUM: Recognizable but not the most famous part
- EASY: Iconic, well-known line (often from chorus)

KEYWORD RULES:
- Keywords must be distinctive words that actually appear in the lyrics of that section
- Avoid common words like "the", "and", "you", "me", "is", "it"
- Include at least one rare/distinctive word per snippet
- Keywords help us verify we found the right section
- Choose words that are unlikely to appear elsewhere in the song

Respond with valid JSON matching this structure:
{
  "theme": "${theme}",
  "themeHint": "A clever hint about the theme",
  "songs": [
    {
      "decade": "1970s",
      "artist": "Queen",
      "title": "Bohemian Rhapsody",
      "year": 1975,
      "snippetGuidance": [
        {
          "difficulty": "hard",
          "section": "verse",
          "verseNumber": 2,
          "lineRange": { "start": 1, "end": 3 },
          "keywords": ["silhouetto", "fandango", "thunderbolt", "lightning"],
          "description": "The surreal operatic section with Scaramouche"
        },
        {
          "difficulty": "medium",
          "section": "verse",
          "verseNumber": 1,
          "lineRange": { "start": 2, "end": 4 },
          "keywords": ["landslide", "escape", "reality"],
          "description": "The caught in a landslide opening section"
        },
        {
          "difficulty": "easy",
          "section": "intro",
          "lineRange": { "start": 1, "end": 2 },
          "keywords": ["real", "life", "fantasy", "caught"],
          "description": "The iconic opening question"
        }
      ],
      "connectionHint": "A man facing the ultimate consequence",
      "alternates": [
        { "artist": "A-ha", "title": "Take On Me", "year": 1985 },
        { "artist": "Tears for Fears", "title": "Everybody Wants to Rule the World", "year": 1985 }
      ]
    }
    // ... 6 more songs for other decades
  ]
}`;
}

export function generateReplacementPrompt(
  theme: string,
  decade: string,
  difficulty: Difficulty,
  failedSongs: string[]
): string {
  const failedList = failedSongs.map(s => `- ${s}`).join('\n');

  const difficultyNote = difficulty === 'hard'
    ? 'Can be a deeper cut, not necessarily a huge hit.'
    : difficulty === 'easy'
      ? 'Should be a well-known hit that most people recognize.'
      : 'Can be a mix of popular and moderately known.';

  return `I need a DIFFERENT song from the ${decade} that connects to the theme "${theme}".
Difficulty: ${difficulty.toUpperCase()} - ${difficultyNote}

The following songs didn't work (lyrics couldn't be fetched):
${failedList}

Please suggest a well-known song from a major artist where the lyrics are definitely available.
Prefer mainstream hits from major labels.

IMPORTANT: Do NOT provide any actual song lyrics. We will fetch lyrics from a lyrics database.
Your job is only to select songs and describe WHERE to find good snippets within them.

CRITICAL: You MUST provide EXACTLY 3 snippetGuidance items - one for each difficulty level (hard, medium, easy). No more, no less.

Respond with JSON in this exact format:
{
  "decade": "${decade}",
  "artist": "Artist Name",
  "title": "Song Title",
  "year": YYYY,
  "snippetGuidance": [
    {
      "difficulty": "hard",
      "section": "verse",
      "verseNumber": 1,
      "lineRange": { "start": 1, "end": 3 },
      "keywords": ["word1", "word2", "word3", "word4"],
      "description": "Description of this section"
    },
    {
      "difficulty": "medium",
      "section": "chorus",
      "lineRange": { "start": 1, "end": 2 },
      "keywords": ["word1", "word2", "word3"],
      "description": "Description of this section"
    },
    {
      "difficulty": "easy",
      "section": "chorus",
      "lineRange": { "start": 3, "end": 4 },
      "keywords": ["word1", "word2", "word3", "word4"],
      "description": "The most iconic part"
    }
  ],
  "connectionHint": "How this song connects to the theme",
  "alternates": [
    { "artist": "...", "title": "...", "year": YYYY }
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
  'songs that are sampled in hip hop classics',
  'songs used in political campaigns',
  'songs that inspired flash mobs',
  'songs from the We Are the World era',
  'songs covered on Glee',
  'songs from American Idol winners or contestants',
];
