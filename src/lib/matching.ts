// Fuzzy matching for artist and song title guesses

function normalize(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

// Common variations to handle
const ARTIST_ALIASES: Record<string, string[]> = {
  'the beatles': ['beatles'],
  'the rolling stones': ['rolling stones'],
  'the who': ['who'],
  'the doors': ['doors'],
  'the beach boys': ['beach boys'],
  'led zeppelin': ['zeppelin'],
  'pink floyd': ['floyd'],
  'guns n roses': ['guns and roses', 'gnr'],
  'ac dc': ['acdc'],
  'r.e.m.': ['rem'],
  'u2': [],
  'prince': ['prince and the revolution'],
  'beyonce': ['beyoncé'],
};

function getAliases(name: string): string[] {
  const normalized = normalize(name);
  const aliases = [normalized];

  // Check predefined aliases
  for (const [key, values] of Object.entries(ARTIST_ALIASES)) {
    if (normalized === key || values.includes(normalized)) {
      aliases.push(key, ...values);
    }
  }

  // Handle "The X" vs "X"
  if (normalized.startsWith('the ')) {
    aliases.push(normalized.slice(4));
  } else {
    aliases.push(`the ${normalized}`);
  }

  return [...new Set(aliases)];
}

export function matchArtist(guess: string, correct: string): boolean {
  const guessNorm = normalize(guess);
  const correctAliases = getAliases(correct);

  // Exact match with any alias
  if (correctAliases.includes(guessNorm)) {
    return true;
  }

  // Check if guess matches any alias
  const guessAliases = getAliases(guess);
  for (const alias of guessAliases) {
    if (correctAliases.includes(alias)) {
      return true;
    }
  }

  // Fuzzy match - check if one contains the other (for longer names)
  const correctNorm = normalize(correct);
  if (guessNorm.length >= 4 && correctNorm.length >= 4) {
    if (correctNorm.includes(guessNorm) || guessNorm.includes(correctNorm)) {
      return true;
    }
  }

  return false;
}

export function matchTitle(guess: string, correct: string): boolean {
  const guessNorm = normalize(guess);
  const correctNorm = normalize(correct);

  // Exact match
  if (guessNorm === correctNorm) {
    return true;
  }

  // Handle parenthetical subtitles: "Song (Something)" matches "Song"
  const correctBase = correctNorm.replace(/\s*\(.*\)\s*$/, '').trim();
  const guessBase = guessNorm.replace(/\s*\(.*\)\s*$/, '').trim();

  if (guessBase === correctBase || guessBase === correctNorm || guessNorm === correctBase) {
    return true;
  }

  // Handle "A X" vs "X" (articles)
  const articles = ['a ', 'an ', 'the '];
  let guessWithout = guessNorm;
  let correctWithout = correctNorm;

  for (const article of articles) {
    if (guessNorm.startsWith(article)) {
      guessWithout = guessNorm.slice(article.length);
    }
    if (correctNorm.startsWith(article)) {
      correctWithout = correctNorm.slice(article.length);
    }
  }

  if (guessWithout === correctWithout) {
    return true;
  }

  return false;
}

export function checkGuess(
  artistGuess: string,
  titleGuess: string,
  correctArtist: string,
  correctTitle: string
): { artistCorrect: boolean; titleCorrect: boolean } {
  return {
    artistCorrect: matchArtist(artistGuess, correctArtist),
    titleCorrect: matchTitle(titleGuess, correctTitle),
  };
}
