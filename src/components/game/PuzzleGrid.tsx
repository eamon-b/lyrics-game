import type { Puzzle, Decade } from '@/types/puzzle';
import type { SongGuess } from '@/types/game';
import { PuzzleCard } from './PuzzleCard';

interface PuzzleGridProps {
  puzzle: Puzzle;
  currentIndex: number;
  guesses: Record<Decade, SongGuess>;
  onGuess: (artist: string, title: string) => void;
  onHint: () => void;
  onSkip: () => void;
}

export function PuzzleGrid({
  puzzle,
  currentIndex,
  guesses,
  onGuess,
  onHint,
  onSkip,
}: PuzzleGridProps) {
  return (
    <div className="puzzle-grid">
      <div className="progress-bar">
        <div className="progress-text">
          Song {Math.min(currentIndex + 1, 7)} of 7
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${((currentIndex) / 7) * 100}%` }}
          />
        </div>
      </div>

      <div className="cards-container">
        {puzzle.songs.map((song, index) => (
          <PuzzleCard
            key={song.id}
            song={song}
            guess={guesses[song.decade]}
            isActive={index === currentIndex}
            onGuess={onGuess}
            onHint={onHint}
            onSkip={onSkip}
          />
        ))}
      </div>
    </div>
  );
}
