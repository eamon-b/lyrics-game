import type { LyricSection } from './types.js';

/**
 * Parse lyrics text into structured sections.
 * Recognizes section headers like [Verse 1], [Chorus], [Bridge], etc.
 * Lyrics without section headers are treated as implicit verses.
 */
export function parseLyricsIntoSections(lyrics: string): LyricSection[] {
  const lines = lyrics.split('\n');
  const sections: LyricSection[] = [];

  let currentSection: LyricSection | null = null;
  const sectionCounts: Record<string, number> = {
    verse: 0,
    chorus: 0,
    bridge: 0,
    'pre-chorus': 0,
    intro: 0,
    outro: 0,
    other: 0,
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // Check for section headers like [Verse 1], [Chorus], [Bridge], etc.
    const sectionMatch = trimmed.match(/^\[([^\]]+)\]$/);

    if (sectionMatch) {
      // Save previous section if it has content
      if (currentSection && currentSection.lines.length > 0) {
        sections.push(currentSection);
      }

      // Parse section type
      const sectionName = sectionMatch[1].toLowerCase();
      let sectionType: LyricSection['type'] = 'other';
      let sectionNumber: number | undefined;

      if (sectionName.includes('verse')) {
        sectionType = 'verse';
        sectionCounts.verse++;
        sectionNumber = sectionCounts.verse;
      } else if (sectionName.includes('chorus') || sectionName.includes('hook')) {
        sectionType = 'chorus';
        sectionCounts.chorus++;
        sectionNumber = sectionCounts.chorus;
      } else if (sectionName.includes('bridge')) {
        sectionType = 'bridge';
        sectionCounts.bridge++;
        sectionNumber = sectionCounts.bridge;
      } else if (sectionName.includes('pre-chorus') || sectionName.includes('prechorus') || sectionName.includes('pre chorus')) {
        sectionType = 'pre-chorus';
        sectionCounts['pre-chorus']++;
        sectionNumber = sectionCounts['pre-chorus'];
      } else if (sectionName.includes('intro')) {
        sectionType = 'intro';
        sectionCounts.intro++;
        sectionNumber = sectionCounts.intro;
      } else if (sectionName.includes('outro')) {
        sectionType = 'outro';
        sectionCounts.outro++;
        sectionNumber = sectionCounts.outro;
      } else {
        sectionType = 'other';
        sectionCounts.other++;
        sectionNumber = sectionCounts.other;
      }

      currentSection = {
        type: sectionType,
        number: sectionNumber,
        lines: [],
      };
    } else if (trimmed) {
      // Add line to current section
      if (!currentSection) {
        // No section header yet, create implicit first section
        sectionCounts.verse++;
        currentSection = {
          type: 'verse',
          number: sectionCounts.verse,
          lines: [],
        };
      }
      currentSection.lines.push(trimmed);
    }
  }

  // Save final section
  if (currentSection && currentSection.lines.length > 0) {
    sections.push(currentSection);
  }

  return sections;
}
