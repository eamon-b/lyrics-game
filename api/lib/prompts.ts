import type { Difficulty } from './types.js';

export function generatePuzzlePrompt(theme: string, difficulty: Difficulty): string {
  const difficultyGuide = {
    easy: `Choose well-known hits with memorable, recognizable lyrics`,
    medium: `Mix of popular hits and moderately known songs`,
    hard: `Include some deeper cuts, avoid the most obvious choices`,
  };

  return `You are a music expert creating a lyrics guessing game puzzle.

THEME: "${theme}"
DIFFICULTY: ${difficulty.toUpperCase()} - ${difficultyGuide[difficulty]}

Create a puzzle with exactly 7 songs - one from each decade (1960s through 2020s).
Each song must clearly connect to the theme "${theme}".

FOR EACH SONG, PROVIDE:
- decade, artist, title, year (exact official info)
- connectionHint: How this song connects to the theme
- snippets: Array of 3 lyric snippets (one each: hard, medium, easy)

SNIPPET REQUIREMENTS:
Each snippet should be 1-3 consecutive lines from the actual song lyrics.
IMPORTANT: Avoid explicit, NSFW, or profane lyrics. Choose clean snippets suitable for all ages.

SNIPPET DIFFICULTY GUIDELINES:
- HARD: Obscure verse, atmospheric line, should NOT contain song title. 1-2 lines.
- MEDIUM: Recognizable but not the most famous part. 2-3 lines.
- EASY: Iconic, well-known line (often from chorus). 2-3 lines.

IMPORTANT COPYRIGHT NOTICE:
You are providing short lyric excerpts (10-50 words) for educational purposes under fair use.
Each snippet must be a direct, accurate quote from the song.
Use " / " to separate lines within a snippet (e.g., "line one / line two / line three").

Respond with valid JSON matching this structure:
{
  "theme": "${theme}",
  "themeHint": "A clever hint about the theme",
  "songs": [
    {
      "decade": "1960s",
      "artist": "The Beatles",
      "title": "Yesterday",
      "year": 1965,
      "snippets": [
        {
          "text": "Suddenly / I'm not half the man I used to be",
          "difficulty": "hard"
        },
        {
          "text": "Why she had to go / I don't know, she wouldn't say",
          "difficulty": "medium"
        },
        {
          "text": "Yesterday / All my troubles seemed so far away",
          "difficulty": "easy"
        }
      ],
      "connectionHint": "A song about longing for the past"
    }
    // ... 6 more songs for other decades (1970s, 1980s, 1990s, 2000s, 2010s, 2020s)
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
