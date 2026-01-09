import { useState, useCallback } from 'react';
import type { GameState, SongGuess, GamePhase } from '@/types/game';
import type { Puzzle, Decade, Difficulty } from '@/types/puzzle';
import { generatePuzzle, getDailyPuzzle } from '@/api/client';
import { checkGuess } from '@/lib/matching';
import { calculateSongScore, calculateTotalScore } from '@/lib/scoring';

const DECADES_LIST: Decade[] = ['1960s', '1970s', '1980s', '1990s', '2000s', '2010s', '2020s'];

function createEmptyGuesses(): Record<Decade, SongGuess> {
  const guesses: Partial<Record<Decade, SongGuess>> = {};
  for (const decade of DECADES_LIST) {
    guesses[decade] = {
      artistGuess: '',
      titleGuess: '',
      isArtistCorrect: false,
      isTitleCorrect: false,
      hintsUsed: 0,
      attempts: 0,
      revealed: false,
    };
  }
  return guesses as Record<Decade, SongGuess>;
}

const initialState: GameState = {
  puzzle: null,
  currentDecadeIndex: 0,
  guesses: createEmptyGuesses(),
  themeGuess: '',
  isThemeCorrect: false,
  gamePhase: 'input',
  score: 0,
  startTime: 0,
  difficulty: 'medium',
  isDaily: false,
};

export function useGameState() {
  const [state, setState] = useState<GameState>(initialState);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const startCustomGame = useCallback(async (theme: string, difficulty: Difficulty) => {
    setError(null);
    setIsLoading(true);
    setState((s) => ({ ...s, gamePhase: 'generating' }));

    try {
      const puzzle = await generatePuzzle(theme, difficulty);
      setState({
        ...initialState,
        puzzle,
        guesses: createEmptyGuesses(),
        gamePhase: 'playing',
        startTime: Date.now(),
        difficulty,
        isDaily: false,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate puzzle');
      setState((s) => ({ ...s, gamePhase: 'input' }));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startDailyGame = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    setState((s) => ({ ...s, gamePhase: 'generating' }));

    try {
      const { puzzle } = await getDailyPuzzle();
      setState({
        ...initialState,
        puzzle,
        guesses: createEmptyGuesses(),
        gamePhase: 'playing',
        startTime: Date.now(),
        difficulty: 'medium',
        isDaily: true,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get daily puzzle');
      setState((s) => ({ ...s, gamePhase: 'input' }));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadPuzzle = useCallback((puzzle: Puzzle) => {
    setState({
      ...initialState,
      puzzle,
      guesses: createEmptyGuesses(),
      gamePhase: 'playing',
      startTime: Date.now(),
      difficulty: puzzle.difficulty,
      isDaily: !!puzzle.puzzleNumber,
    });
  }, []);

  const submitGuess = useCallback(
    (artistGuess: string, titleGuess: string) => {
      setState((s) => {
        if (!s.puzzle || s.gamePhase !== 'playing') return s;

        const currentSong = s.puzzle.songs[s.currentDecadeIndex];
        const decade = currentSong.decade;
        const currentGuess = s.guesses[decade];

        const { artistCorrect, titleCorrect } = checkGuess(
          artistGuess,
          titleGuess,
          currentSong.artist,
          currentSong.title
        );

        const newGuess: SongGuess = {
          artistGuess,
          titleGuess,
          isArtistCorrect: artistCorrect,
          isTitleCorrect: titleCorrect,
          hintsUsed: currentGuess.hintsUsed,
          attempts: currentGuess.attempts + 1,
          revealed: artistCorrect && titleCorrect,
        };

        const newGuesses = { ...s.guesses, [decade]: newGuess };

        // Check if we should move to next song or theme guess
        const isLastSong = s.currentDecadeIndex === 6;
        const isCorrect = artistCorrect && titleCorrect;

        let newPhase: GamePhase = s.gamePhase;
        let newIndex = s.currentDecadeIndex;

        if (isCorrect || newGuess.attempts >= 3) {
          // Move to next song or theme guess
          if (isLastSong) {
            newPhase = 'theme-guess';
          } else {
            newIndex = s.currentDecadeIndex + 1;
          }
        }

        return {
          ...s,
          guesses: newGuesses,
          currentDecadeIndex: newIndex,
          gamePhase: newPhase,
        };
      });
    },
    []
  );

  const requestHint = useCallback(() => {
    setState((s) => {
      if (!s.puzzle || s.gamePhase !== 'playing') return s;

      const currentSong = s.puzzle.songs[s.currentDecadeIndex];
      const decade = currentSong.decade;
      const currentGuess = s.guesses[decade];

      if (currentGuess.hintsUsed >= 2) return s; // Already at max hints

      const newGuess: SongGuess = {
        ...currentGuess,
        hintsUsed: currentGuess.hintsUsed + 1,
      };

      return {
        ...s,
        guesses: { ...s.guesses, [decade]: newGuess },
      };
    });
  }, []);

  const skipSong = useCallback(() => {
    setState((s) => {
      if (!s.puzzle || s.gamePhase !== 'playing') return s;

      const currentSong = s.puzzle.songs[s.currentDecadeIndex];
      const decade = currentSong.decade;

      const newGuess: SongGuess = {
        ...s.guesses[decade],
        revealed: true,
      };

      const newGuesses = { ...s.guesses, [decade]: newGuess };

      const isLastSong = s.currentDecadeIndex === 6;

      return {
        ...s,
        guesses: newGuesses,
        currentDecadeIndex: isLastSong ? s.currentDecadeIndex : s.currentDecadeIndex + 1,
        gamePhase: isLastSong ? 'theme-guess' : s.gamePhase,
      };
    });
  }, []);

  const submitThemeGuess = useCallback((guess: string) => {
    setState((s) => {
      if (!s.puzzle || s.gamePhase !== 'theme-guess') return s;

      // Normalize and compare
      const normalizedGuess = guess.toLowerCase().trim();
      const normalizedTheme = s.puzzle.theme.toLowerCase().trim();

      const isCorrect =
        normalizedGuess === normalizedTheme ||
        normalizedTheme.includes(normalizedGuess) ||
        normalizedGuess.includes(normalizedTheme);

      // Calculate final score
      const songScores = DECADES_LIST.map((decade) => {
        const songGuess = s.guesses[decade];
        const isCorrectGuess = songGuess.isArtistCorrect && songGuess.isTitleCorrect;
        return calculateSongScore(isCorrectGuess, songGuess.hintsUsed, s.difficulty);
      });

      const scoreBreakdown = calculateTotalScore(songScores, isCorrect);

      return {
        ...s,
        themeGuess: guess,
        isThemeCorrect: isCorrect,
        score: scoreBreakdown.total,
        gamePhase: 'results',
      };
    });
  }, []);

  const resetGame = useCallback(() => {
    setState(initialState);
    setError(null);
  }, []);

  return {
    state,
    error,
    isLoading,
    startCustomGame,
    startDailyGame,
    loadPuzzle,
    submitGuess,
    requestHint,
    skipSong,
    submitThemeGuess,
    resetGame,
  };
}
