export interface LrclibSearchResult {
  id: number;
  trackName: string;
  artistName: string;
  albumName: string | null;
  duration: number | null;
  plainLyrics: string | null;
  syncedLyrics: string | null;
}

const LRCLIB_BASE_URL = 'https://lrclib.net/api';

// User-Agent per LRCLIB guidelines
const USER_AGENT = 'LyricsPuzzle/1.0 (https://github.com/lyrics-puzzle)';

export class LrclibClient {
  /**
   * Search for a song, trying exact match first, then fuzzy search.
   * Returns the best match or null if not found.
   */
  async searchSong(artist: string, title: string): Promise<LrclibSearchResult | null> {
    // Try exact match first
    const exactResult = await this.tryExactMatch(artist, title);
    if (exactResult) {
      return exactResult;
    }

    // Fall back to fuzzy search
    return this.tryFuzzySearch(artist, title);
  }

  /**
   * Get lyrics for a song. Returns plainLyrics or null if not found.
   */
  async getLyrics(artist: string, title: string): Promise<string | null> {
    const result = await this.searchSong(artist, title);
    return result?.plainLyrics ?? null;
  }

  private async tryExactMatch(artist: string, title: string): Promise<LrclibSearchResult | null> {
    const url = `${LRCLIB_BASE_URL}/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`;

    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT },
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        console.log(`LRCLIB exact match failed with status ${response.status}`);
        return null;
      }

      const data = await response.json() as LrclibSearchResult;

      // Verify we got actual lyrics
      if (!data.plainLyrics) {
        return null;
      }

      return data;
    } catch (error) {
      console.log(`LRCLIB exact match error for "${artist} - ${title}":`, error);
      return null;
    }
  }

  private async tryFuzzySearch(artist: string, title: string): Promise<LrclibSearchResult | null> {
    const query = `${artist} ${title}`;
    const url = `${LRCLIB_BASE_URL}/search?q=${encodeURIComponent(query)}`;

    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT },
      });

      if (!response.ok) {
        console.log(`LRCLIB search failed with status ${response.status}`);
        return null;
      }

      const results = await response.json() as LrclibSearchResult[];

      if (!Array.isArray(results) || results.length === 0) {
        return null;
      }

      // Find best match by comparing normalized artist/title
      const normalizedArtist = this.normalize(artist);
      const normalizedTitle = this.normalize(title);

      for (const result of results) {
        if (!result.plainLyrics) continue;

        const resultArtist = this.normalize(result.artistName);
        const resultTitle = this.normalize(result.trackName);

        // Check if this is a reasonable match
        if (
          (resultArtist.includes(normalizedArtist) || normalizedArtist.includes(resultArtist)) &&
          (resultTitle.includes(normalizedTitle) || normalizedTitle.includes(resultTitle))
        ) {
          return result;
        }
      }

      // Fall back to first result with lyrics
      const firstWithLyrics = results.find(r => r.plainLyrics);
      if (firstWithLyrics) {
        console.warn(
          `LRCLIB: No exact match for "${artist} - ${title}", falling back to first result: "${firstWithLyrics.artistName} - ${firstWithLyrics.trackName}"`
        );
        return firstWithLyrics;
      }

      return null;
    } catch (error) {
      console.log(`LRCLIB search error for "${artist} - ${title}":`, error);
      return null;
    }
  }

  private normalize(str: string): string {
    return str
      .toLowerCase()
      .replace(/^the\s+/, '')
      .replace(/[^\w\s]/g, '')
      .trim();
  }
}
