import { useState } from 'react';
import type { Puzzle } from '@/types/puzzle';

interface ThemeGuessProps {
  puzzle: Puzzle;
  onSubmit: (guess: string) => void;
}

export function ThemeGuess({ puzzle, onSubmit }: ThemeGuessProps) {
  const [guess, setGuess] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (guess.trim()) {
      onSubmit(guess.trim());
    }
  };

  return (
    <div className="theme-guess">
      <h2>Final Challenge!</h2>
      <p className="hint">
        <strong>Hint:</strong> {puzzle.themeHint}
      </p>

      <div className="songs-summary">
        <p>The songs were:</p>
        <ul>
          {puzzle.songs.map((song) => (
            <li key={song.id}>
              <span className="decade">{song.decade}:</span>{' '}
              <strong>{song.artist}</strong> - "{song.title}"
            </li>
          ))}
        </ul>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label htmlFor="theme-guess">What theme connects all these songs?</label>
          <input
            id="theme-guess"
            type="text"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            placeholder="Enter the theme..."
            autoComplete="off"
            autoFocus
          />
        </div>
        <button type="submit" disabled={!guess.trim()}>
          Submit Answer
        </button>
      </form>
    </div>
  );
}
