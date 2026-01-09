import { useState } from 'react';
import type { SongPuzzle } from '@/types/puzzle';
import type { SongGuess } from '@/types/game';

interface PuzzleCardProps {
  song: SongPuzzle;
  guess: SongGuess;
  isActive: boolean;
  onGuess: (artist: string, title: string) => void;
  onHint: () => void;
  onSkip: () => void;
}

export function PuzzleCard({
  song,
  guess,
  isActive,
  onGuess,
  onHint,
  onSkip,
}: PuzzleCardProps) {
  const [artistInput, setArtistInput] = useState('');
  const [titleInput, setTitleInput] = useState('');

  const isComplete = guess.revealed || (guess.isArtistCorrect && guess.isTitleCorrect);
  const canRequestHint = guess.hintsUsed < 2 && !isComplete;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (artistInput.trim() && titleInput.trim()) {
      onGuess(artistInput.trim(), titleInput.trim());
    }
  };

  // Get visible snippets based on hints used
  const visibleSnippets = song.snippets.filter((snippet) => {
    if (snippet.difficulty === 'hard') return true;
    if (snippet.difficulty === 'medium') return guess.hintsUsed >= 1;
    if (snippet.difficulty === 'easy') return guess.hintsUsed >= 2;
    return false;
  });

  return (
    <div className={`puzzle-card ${isActive ? 'active' : ''} ${isComplete ? 'complete' : ''}`}>
      <div className="card-header">
        <span className="decade-badge">{song.decade}</span>
        {isComplete && (
          <span className={`result-badge ${guess.isArtistCorrect && guess.isTitleCorrect ? 'correct' : 'skipped'}`}>
            {guess.isArtistCorrect && guess.isTitleCorrect ? 'Correct!' : 'Skipped'}
          </span>
        )}
      </div>

      <div className="lyrics-section">
        {visibleSnippets.map((snippet, i) => (
          <blockquote
            key={i}
            className={`lyric-snippet ${snippet.difficulty}`}
          >
            "{snippet.text}"
            <span className="hint-level">
              {snippet.difficulty === 'hard' && 'Hard'}
              {snippet.difficulty === 'medium' && 'Medium'}
              {snippet.difficulty === 'easy' && 'Easy'}
            </span>
          </blockquote>
        ))}
      </div>

      {isComplete ? (
        <div className="answer-reveal">
          <div className="answer">
            <strong>{song.artist}</strong> - "{song.title}" ({song.year})
          </div>
          <div className="connection">
            <em>Theme connection:</em> {song.connectionHint}
          </div>
        </div>
      ) : isActive ? (
        <form className="guess-form" onSubmit={handleSubmit}>
          <div className="input-row">
            <input
              type="text"
              placeholder="Artist"
              value={artistInput}
              onChange={(e) => setArtistInput(e.target.value)}
              className={guess.attempts > 0 && guess.isArtistCorrect ? 'correct' : ''}
              autoComplete="off"
            />
            <input
              type="text"
              placeholder="Song title"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              className={guess.attempts > 0 && guess.isTitleCorrect ? 'correct' : ''}
              autoComplete="off"
            />
          </div>

          {guess.attempts > 0 && !(guess.isArtistCorrect && guess.isTitleCorrect) && (
            <div className="feedback">
              {guess.isArtistCorrect && !guess.isTitleCorrect && 'Artist correct! Wrong song.'}
              {!guess.isArtistCorrect && guess.isTitleCorrect && 'Song correct! Wrong artist.'}
              {!guess.isArtistCorrect && !guess.isTitleCorrect && 'Not quite. Try again!'}
              <span className="attempts">Attempt {guess.attempts}/3</span>
            </div>
          )}

          <div className="button-row">
            <button type="submit" disabled={!artistInput.trim() || !titleInput.trim()}>
              Guess
            </button>
            {canRequestHint && (
              <button type="button" className="hint-btn" onClick={onHint}>
                Hint (-{guess.hintsUsed === 0 ? 15 : 15} pts)
              </button>
            )}
            <button type="button" className="skip-btn" onClick={onSkip}>
              Skip
            </button>
          </div>
        </form>
      ) : (
        <div className="waiting">
          {isComplete ? null : <span>Waiting...</span>}
        </div>
      )}
    </div>
  );
}
