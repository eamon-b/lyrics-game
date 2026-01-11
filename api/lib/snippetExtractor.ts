import type { LyricSection, LyricSnippet } from './types.js';
import type { SnippetGuidance } from './schemas.js';

/**
 * Keyword match thresholds for snippet extraction.
 *
 * SECTION_MATCH_THRESHOLD (0.4 = 40%): Used when we found the correct section.
 * A lower threshold here since section context increases confidence.
 *
 * FALLBACK_MATCH_THRESHOLD (0.3 = 30%): Used when searching across all sections.
 * More lenient to find partial matches when section guidance was inaccurate.
 *
 * These values were chosen empirically to balance:
 * - False positives (accepting wrong snippets) - avoided by requiring some keyword matches
 * - False negatives (rejecting valid snippets) - avoided by being somewhat lenient
 */
const SECTION_MATCH_THRESHOLD = 0.4;
const FALLBACK_MATCH_THRESHOLD = 0.3;

/** Default sliding window size for searching within sections */
const DEFAULT_WINDOW_SIZE = 3;

export interface ExtractionResult {
  success: boolean;
  snippet?: LyricSnippet;
  error?: string;
}

export function extractSnippet(sections: LyricSection[], guidance: SnippetGuidance): ExtractionResult {
  // First, try to find matching section by type and verse number
  const matchingSections = sections.filter((s) => {
    if (s.type !== guidance.section) return false;
    if (guidance.verseNumber !== undefined && s.number !== guidance.verseNumber) return false;
    return true;
  });

  if (matchingSections.length > 0) {
    const section = matchingSections[0];
    const result = extractFromSection(section, guidance);
    if (result.success) {
      return result;
    }
  }

  // If section match failed, try to find section by type only (ignore verse number)
  const typeSections = sections.filter((s) => s.type === guidance.section);
  for (const section of typeSections) {
    const result = extractFromSection(section, guidance);
    if (result.success) {
      return result;
    }
  }

  // Fallback: try to find section by keywords alone across all sections
  return extractByKeywords(sections, guidance);
}

function extractFromSection(section: LyricSection, guidance: SnippetGuidance): ExtractionResult {
  const startIdx = Math.max(0, guidance.lineRange.start - 1);
  const endIdx = Math.min(section.lines.length, guidance.lineRange.end);

  if (startIdx >= section.lines.length) {
    // Line range is out of bounds, try to get some lines anyway
    const candidateLines = section.lines.slice(0, Math.min(DEFAULT_WINDOW_SIZE, section.lines.length));
    const candidateText = candidateLines.join(' / ');
    const keywordScore = calculateKeywordScore(candidateText, guidance.keywords);

    if (keywordScore >= SECTION_MATCH_THRESHOLD) {
      return {
        success: true,
        snippet: {
          text: candidateText,
          difficulty: guidance.difficulty,
        },
      };
    }
    return { success: false, error: 'Line range out of bounds' };
  }

  const candidateLines = section.lines.slice(startIdx, endIdx);
  if (candidateLines.length === 0) {
    return { success: false, error: 'No lines in range' };
  }

  const candidateText = candidateLines.join(' / ');

  // Verify keywords are present
  const keywordScore = calculateKeywordScore(candidateText, guidance.keywords);

  if (keywordScore >= SECTION_MATCH_THRESHOLD) {
    return {
      success: true,
      snippet: {
        text: candidateText,
        difficulty: guidance.difficulty,
      },
    };
  }

  // Try expanding the search within this section
  return expandedSectionSearch(section, guidance);
}

function expandedSectionSearch(section: LyricSection, guidance: SnippetGuidance): ExtractionResult {
  // Slide a window over lines to find best keyword match
  const windowSize = DEFAULT_WINDOW_SIZE;
  let bestMatch: { text: string; score: number } | null = null;

  for (let i = 0; i <= Math.max(0, section.lines.length - windowSize); i++) {
    const candidateLines = section.lines.slice(i, i + windowSize);
    const candidateText = candidateLines.join(' / ');
    const score = calculateKeywordScore(candidateText, guidance.keywords);

    if (!bestMatch || score > bestMatch.score) {
      bestMatch = { text: candidateText, score };
    }
  }

  // Also try smaller windows for short sections
  if (section.lines.length < windowSize) {
    const candidateText = section.lines.join(' / ');
    const score = calculateKeywordScore(candidateText, guidance.keywords);
    if (!bestMatch || score > bestMatch.score) {
      bestMatch = { text: candidateText, score };
    }
  }

  if (bestMatch && bestMatch.score >= 0.4) {
    return {
      success: true,
      snippet: {
        text: bestMatch.text,
        difficulty: guidance.difficulty,
      },
    };
  }

  return {
    success: false,
    error: `Could not find snippet matching keywords in section: ${guidance.keywords.join(', ')}`,
  };
}

function extractByKeywords(sections: LyricSection[], guidance: SnippetGuidance): ExtractionResult {
  // Search all sections for best keyword match
  let bestMatch: { text: string; score: number } | null = null;

  for (const section of sections) {
    // Slide a window over lines to find best match
    const windowSize = DEFAULT_WINDOW_SIZE;

    for (let i = 0; i <= Math.max(0, section.lines.length - windowSize); i++) {
      const candidateLines = section.lines.slice(i, i + windowSize);
      const candidateText = candidateLines.join(' / ');
      const score = calculateKeywordScore(candidateText, guidance.keywords);

      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { text: candidateText, score };
      }
    }

    // Also try smaller windows
    for (let size = 1; size < windowSize && size <= section.lines.length; size++) {
      for (let i = 0; i <= section.lines.length - size; i++) {
        const candidateLines = section.lines.slice(i, i + size);
        const candidateText = candidateLines.join(' / ');
        const score = calculateKeywordScore(candidateText, guidance.keywords);

        if (!bestMatch || score > bestMatch.score) {
          bestMatch = { text: candidateText, score };
        }
      }
    }
  }

  if (bestMatch && bestMatch.score >= FALLBACK_MATCH_THRESHOLD) {
    return {
      success: true,
      snippet: {
        text: bestMatch.text,
        difficulty: guidance.difficulty,
      },
    };
  }

  return {
    success: false,
    error: `Could not find snippet matching keywords: ${guidance.keywords.join(', ')}`,
  };
}

function calculateKeywordScore(text: string, keywords: string[]): number {
  const normalizedText = text.toLowerCase();
  const found = keywords.filter((kw) => normalizedText.includes(kw.toLowerCase()));
  return found.length / keywords.length;
}

// Validate all 3 snippets can be extracted
export function validateSnippetExtraction(
  sections: LyricSection[],
  guidances: SnippetGuidance[]
): { valid: boolean; missing: SnippetGuidance[] } {
  const missing: SnippetGuidance[] = [];

  for (const guidance of guidances) {
    const result = extractSnippet(sections, guidance);
    if (!result.success) {
      missing.push(guidance);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

// Extract all snippets for a song
export function extractAllSnippets(
  sections: LyricSection[],
  guidances: SnippetGuidance[]
): { success: boolean; snippets: LyricSnippet[]; errors: string[] } {
  const snippets: LyricSnippet[] = [];
  const errors: string[] = [];

  for (const guidance of guidances) {
    const result = extractSnippet(sections, guidance);
    if (result.success && result.snippet) {
      snippets.push(result.snippet);
    } else {
      errors.push(result.error || `Failed to extract ${guidance.difficulty} snippet`);
    }
  }

  // Sort snippets by difficulty order: hard, medium, easy
  const difficultyOrder = { hard: 0, medium: 1, easy: 2 };
  snippets.sort((a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]);

  return {
    success: snippets.length === 3,
    snippets,
    errors,
  };
}
