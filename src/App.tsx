import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGameState } from '@/hooks/useGameState';
import { ThemeInput } from '@/components/ThemeInput';
import { PuzzleGrid } from '@/components/game/PuzzleGrid';
import { ThemeGuess } from '@/components/game/ThemeGuess';
import { Results } from '@/components/game/Results';
import { Loading } from '@/components/Loading';
import { decodePuzzleFromUrl } from '@/lib/compression';

function App() {
  const [searchParams] = useSearchParams();
  const {
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
  } = useGameState();

  // Check for puzzle in URL on mount
  useEffect(() => {
    const encodedPuzzle = searchParams.get('p');
    if (encodedPuzzle && state.gamePhase === 'input') {
      const puzzle = decodePuzzleFromUrl(encodedPuzzle);
      if (puzzle) {
        loadPuzzle(puzzle);
      }
    }
  }, [searchParams, state.gamePhase, loadPuzzle]);

  return (
    <div className="app">
      <header className="app-header">
        <h1 onClick={resetGame} style={{ cursor: 'pointer' }}>
          Lyrics Puzzle
        </h1>
      </header>

      <main className="app-main">
        {error && (
          <div className="error-banner">
            {error}
            <button onClick={() => window.location.reload()}>Retry</button>
          </div>
        )}

        {state.gamePhase === 'input' && (
          <ThemeInput
            onSubmit={startCustomGame}
            onDailyClick={startDailyGame}
            isLoading={isLoading}
          />
        )}

        {state.gamePhase === 'generating' && (
          <Loading />
        )}

        {state.gamePhase === 'playing' && state.puzzle && (
          <PuzzleGrid
            puzzle={state.puzzle}
            currentIndex={state.currentDecadeIndex}
            guesses={state.guesses}
            onGuess={submitGuess}
            onHint={requestHint}
            onSkip={skipSong}
          />
        )}

        {state.gamePhase === 'theme-guess' && state.puzzle && (
          <ThemeGuess
            puzzle={state.puzzle}
            onSubmit={submitThemeGuess}
          />
        )}

        {state.gamePhase === 'results' && state.puzzle && (
          <Results
            puzzle={state.puzzle}
            guesses={state.guesses}
            themeGuess={state.themeGuess}
            isThemeCorrect={state.isThemeCorrect}
            score={state.score}
            onPlayAgain={resetGame}
          />
        )}
      </main>

      <footer className="app-footer">
        <p>Guess the songs, find the theme!</p>
      </footer>
    </div>
  );
}

export default App;
