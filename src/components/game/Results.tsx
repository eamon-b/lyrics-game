import type { Puzzle, Decade } from '@/types/puzzle';
import type { SongGuess } from '@/types/game';
import { getMaxPossibleScore, formatShareResult } from '@/lib/scoring';
import { getShareUrl } from '@/lib/compression';

interface ResultsProps {
  puzzle: Puzzle;
  guesses: Record<Decade, SongGuess>;
  themeGuess: string;
  isThemeCorrect: boolean;
  score: number;
  onPlayAgain: () => void;
}

const DECADES: Decade[] = ['1960s', '1970s', '1980s', '1990s', '2000s', '2010s', '2020s'];

export function Results({
  puzzle,
  guesses,
  themeGuess,
  isThemeCorrect,
  score,
  onPlayAgain,
}: ResultsProps) {
  const maxScore = getMaxPossibleScore();
  const percentage = Math.round((score / maxScore) * 100);

  const songResults = DECADES.map((decade) => ({
    correct: guesses[decade].isArtistCorrect && guesses[decade].isTitleCorrect,
    hintsUsed: guesses[decade].hintsUsed,
  }));

  const correctCount = songResults.filter((r) => r.correct).length;

  const handleShare = async () => {
    const shareText = formatShareResult(
      songResults,
      isThemeCorrect,
      score,
      puzzle.puzzleNumber
    ).replace('[URL]', getShareUrl(puzzle));

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Lyrics Puzzle',
          text: shareText,
        });
      } catch {
        // User cancelled or share failed
        await navigator.clipboard.writeText(shareText);
        alert('Results copied to clipboard!');
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      alert('Results copied to clipboard!');
    }
  };

  const handleCopyLink = async () => {
    const url = getShareUrl(puzzle);
    await navigator.clipboard.writeText(url);
    alert('Puzzle link copied!');
  };

  return (
    <div className="results">
      <h2>Results</h2>

      <div className="score-display">
        <div className="score-circle">
          <span className="score-value">{score}</span>
          <span className="score-max">/ {maxScore}</span>
        </div>
        <div className="score-percentage">{percentage}%</div>
      </div>

      <div className="stats">
        <div className="stat">
          <span className="stat-value">{correctCount}</span>
          <span className="stat-label">Songs Correct</span>
        </div>
        <div className="stat">
          <span className="stat-value">{isThemeCorrect ? 'Yes!' : 'No'}</span>
          <span className="stat-label">Theme Guessed</span>
        </div>
      </div>

      <div className="theme-reveal">
        <h3>The Theme Was:</h3>
        <div className={`theme-answer ${isThemeCorrect ? 'correct' : 'incorrect'}`}>
          {puzzle.theme}
        </div>
        {!isThemeCorrect && themeGuess && (
          <div className="your-guess">
            Your guess: "{themeGuess}"
          </div>
        )}
      </div>

      <div className="songs-breakdown">
        <h3>Song Breakdown</h3>
        {puzzle.songs.map((song) => {
          const guess = guesses[song.decade];
          const isCorrect = guess.isArtistCorrect && guess.isTitleCorrect;

          return (
            <div
              key={song.id}
              className={`song-result ${isCorrect ? 'correct' : 'incorrect'}`}
            >
              <span className="decade">{song.decade}</span>
              <div className="song-info">
                <strong>{song.artist}</strong> - "{song.title}"
                <div className="connection">{song.connectionHint}</div>
              </div>
              <span className="result-icon">{isCorrect ? '*' : 'X'}</span>
            </div>
          );
        })}
      </div>

      <div className="actions">
        <button className="share-btn" onClick={handleShare}>
          Share Results
        </button>
        <button className="copy-link-btn" onClick={handleCopyLink}>
          Copy Puzzle Link
        </button>
        <button className="play-again-btn" onClick={onPlayAgain}>
          Play Again
        </button>
      </div>
    </div>
  );
}
