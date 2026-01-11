import { useState } from 'react';
import type { Difficulty } from '@/types/puzzle';

interface ThemeInputProps {
  onSubmit: (theme: string, difficulty: Difficulty) => void;
  onDailyClick: () => void;
  isLoading: boolean;
}

const SUGGESTED_THEMES = [
  'songs from Shrek movies',
  'songs for your git commit messages',
  'songs banned from radio at some point',
];

export function ThemeInput({ onSubmit, onDailyClick, isLoading }: ThemeInputProps) {
  const [theme, setTheme] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (theme.trim()) {
      onSubmit(theme.trim(), difficulty);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setTheme(suggestion);
  };

  return (
    <div className="theme-input">
      <h1>Lyrics Puzzle</h1>
      <p className="subtitle">
        Guess the songs from their lyrics, then find the theme that connects them all!
      </p>

      <button
        className="daily-button"
        onClick={onDailyClick}
        disabled={isLoading}
      >
        Play Today's Puzzle
      </button>

      <div className="divider">
        <span>or create your own</span>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label htmlFor="theme">Enter a theme:</label>
          <input
            id="theme"
            type="text"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder="e.g., colors, rain, dancing..."
            disabled={isLoading}
            autoComplete="off"
          />
        </div>

        <div className="suggestions">
          {SUGGESTED_THEMES.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className="suggestion-chip"
              onClick={() => handleSuggestionClick(suggestion)}
              disabled={isLoading}
            >
              {suggestion}
            </button>
          ))}
        </div>

        <div className="input-group">
          <label>Difficulty:</label>
          <div className="difficulty-buttons">
            {(['easy', 'medium', 'hard'] as const).map((d) => (
              <button
                key={d}
                type="button"
                className={`difficulty-btn ${difficulty === d ? 'active' : ''}`}
                onClick={() => setDifficulty(d)}
                disabled={isLoading}
              >
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="submit-button"
          disabled={!theme.trim() || isLoading}
        >
          {isLoading ? 'Generating...' : 'Generate Puzzle'}
        </button>
      </form>
    </div>
  );
}
