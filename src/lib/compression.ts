import LZString from 'lz-string';
import type { Puzzle } from '@/types/puzzle';

interface CompressedPuzzle {
  id: string;
  t: string; // theme
  th: string; // themeHint
  d: string; // difficulty
  s: {
    d: string; // decade (e.g., "60" for 1960s)
    a: string; // artist
    n: string; // title (name)
    y: number; // year
    sn: { t: string; d: string }[]; // snippets
    c: string; // connectionHint
  }[];
}

export function encodePuzzleToUrl(puzzle: Puzzle): string {
  const compressed: CompressedPuzzle = {
    id: puzzle.id,
    t: puzzle.theme,
    th: puzzle.themeHint,
    d: puzzle.difficulty[0], // 'e', 'm', or 'h'
    s: puzzle.songs.map((song) => ({
      d: song.decade.slice(2, 4), // "1960s" -> "60"
      a: song.artist,
      n: song.title,
      y: song.year,
      sn: song.snippets.map((sn) => ({
        t: sn.text,
        d: sn.difficulty[0],
      })),
      c: song.connectionHint,
    })),
  };

  const json = JSON.stringify(compressed);
  const encoded = LZString.compressToEncodedURIComponent(json);

  return encoded;
}

export function decodePuzzleFromUrl(encoded: string): Puzzle | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(encoded);
    if (!json) return null;

    const compressed: CompressedPuzzle = JSON.parse(json);

    const difficultyMap: Record<string, 'easy' | 'medium' | 'hard'> = {
      e: 'easy',
      m: 'medium',
      h: 'hard',
    };

    const puzzle: Puzzle = {
      id: compressed.id,
      theme: compressed.t,
      themeHint: compressed.th,
      difficulty: difficultyMap[compressed.d] || 'medium',
      createdAt: new Date().toISOString(),
      songs: compressed.s.map((song, index) => ({
        id: `${compressed.id}-${index}`,
        decade: `19${song.d}s` as Puzzle['songs'][0]['decade'],
        artist: song.a,
        title: song.n,
        year: song.y,
        snippets: song.sn.map((sn) => ({
          text: sn.t,
          difficulty: difficultyMap[sn.d] || 'medium',
        })),
        connectionHint: song.c,
      })),
    };

    // Fix decades for 2000s, 2010s, 2020s
    puzzle.songs = puzzle.songs.map((song) => {
      const decadeNum = parseInt(song.decade.slice(2, 4));
      if (decadeNum < 30) {
        return {
          ...song,
          decade: `20${song.decade.slice(2)}` as typeof song.decade,
        };
      }
      return song;
    });

    return puzzle;
  } catch {
    return null;
  }
}

export function getShareUrl(puzzle: Puzzle): string {
  const encoded = encodePuzzleToUrl(puzzle);
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  return `${baseUrl}/play?p=${encoded}`;
}
