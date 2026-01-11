import type { GeniusSearchResult, LyricSection } from './types.js';

const GENIUS_API_BASE = 'https://api.genius.com';

export class GeniusClient {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async searchSong(artist: string, title: string): Promise<GeniusSearchResult | null> {
    const query = `${artist} ${title}`;
    const url = `${GENIUS_API_BASE}/search?q=${encodeURIComponent(query)}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Genius search failed: ${response.status}`);
    }

    const data = await response.json();
    const hits = data.response?.hits || [];

    if (hits.length === 0) {
      return null;
    }

    // Find best match by comparing artist and title
    const normalizedArtist = artist.toLowerCase().replace(/^the\s+/, '');
    const normalizedTitle = title.toLowerCase();

    for (const hit of hits) {
      const result = hit.result;
      if (!result) continue;

      const resultArtist = (result.artist_names || result.primary_artist?.name || '').toLowerCase().replace(/^the\s+/, '');
      const resultTitle = (result.title || '').toLowerCase();

      // Check if this is a reasonable match
      if (
        (resultArtist.includes(normalizedArtist) || normalizedArtist.includes(resultArtist)) &&
        (resultTitle.includes(normalizedTitle) || normalizedTitle.includes(resultTitle))
      ) {
        return {
          id: result.id,
          title: result.title,
          artist_names: result.artist_names || result.primary_artist?.name || '',
          url: result.url,
        };
      }
    }

    // Fallback to first result if no good match found
    const firstResult = hits[0]?.result;
    if (firstResult) {
      console.warn(
        `Genius search: No exact match for "${artist} - ${title}", falling back to first result: "${firstResult.artist_names || firstResult.primary_artist?.name} - ${firstResult.title}"`
      );
      return {
        id: firstResult.id,
        title: firstResult.title,
        artist_names: firstResult.artist_names || firstResult.primary_artist?.name || '',
        url: firstResult.url,
      };
    }

    return null;
  }

  async scrapeLyrics(geniusUrl: string): Promise<string> {
    // Fetch the Genius page HTML
    const response = await fetch(geniusUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Genius page: ${response.status}`);
    }

    const html = await response.text();

    // Extract lyrics from the HTML
    const lyrics = this.extractLyricsFromHtml(html);

    if (!lyrics) {
      throw new Error('Could not extract lyrics from Genius page');
    }

    return lyrics;
  }

  private extractLyricsFromHtml(html: string): string | null {
    // Strategy 1: Look for data-lyrics-container="true" divs
    const containerRegex = /data-lyrics-container="true"[^>]*>([\s\S]*?)<\/div>/gi;
    const matches = [...html.matchAll(containerRegex)];

    if (matches.length > 0) {
      const rawLyrics = matches.map((m) => m[1]).join('\n');
      return this.cleanLyrics(rawLyrics);
    }

    // Strategy 2: Look for Lyrics__Container class
    const classRegex = /class="Lyrics__Container[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
    const classMatches = [...html.matchAll(classRegex)];

    if (classMatches.length > 0) {
      const rawLyrics = classMatches.map((m) => m[1]).join('\n');
      return this.cleanLyrics(rawLyrics);
    }

    // Strategy 3: Look for lyrics in JSON-LD structured data
    const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    if (jsonLdMatch) {
      try {
        const jsonLd = JSON.parse(jsonLdMatch[1]);
        if (jsonLd.lyrics?.text) {
          return jsonLd.lyrics.text;
        }
      } catch {
        // Ignore JSON parse errors
      }
    }

    // All strategies failed - log for debugging
    console.warn(
      'Genius lyrics extraction: All strategies failed. Page structure may have changed. ' +
        `HTML length: ${html.length}, contains "lyrics-container": ${html.includes('lyrics-container')}, ` +
        `contains "Lyrics__Container": ${html.includes('Lyrics__Container')}`
    );

    return null;
  }

  private cleanLyrics(rawHtml: string): string {
    return (
      rawHtml
        // Replace <br> tags with newlines
        .replace(/<br\s*\/?>/gi, '\n')
        // Handle annotation links - extract just the text
        .replace(/<a[^>]*>([\s\S]*?)<\/a>/gi, '$1')
        // Remove all other HTML tags
        .replace(/<[^>]+>/g, '')
        // Decode HTML entities
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/&nbsp;/g, ' ')
        // Clean up whitespace
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
    );
  }
}

// Parse lyrics into sections
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
