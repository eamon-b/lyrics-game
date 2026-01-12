import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LrclibClient } from './lrclib.js';

// Mock responses
const exactMatchResponse = {
  id: 123,
  trackName: 'Yesterday',
  artistName: 'The Beatles',
  albumName: 'Help!',
  duration: 125,
  plainLyrics: '[Verse 1]\nYesterday\nAll my troubles seemed so far away',
  syncedLyrics: '[00:00.00] Yesterday',
};

const searchResults = [
  {
    id: 123,
    trackName: 'Yesterday',
    artistName: 'The Beatles',
    albumName: 'Help!',
    duration: 125,
    plainLyrics: '[Verse 1]\nYesterday\nAll my troubles seemed so far away',
    syncedLyrics: '[00:00.00] Yesterday',
  },
  {
    id: 456,
    trackName: 'Yesterday (Live)',
    artistName: 'The Beatles',
    albumName: 'Live Album',
    duration: 130,
    plainLyrics: 'Live version lyrics',
    syncedLyrics: null,
  },
];

describe('LrclibClient', () => {
  let client: LrclibClient;

  beforeEach(() => {
    client = new LrclibClient();
    vi.restoreAllMocks();
  });

  describe('searchSong', () => {
    it('returns exact match when found', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(exactMatchResponse),
      });

      const result = await client.searchSong('The Beatles', 'Yesterday');

      expect(result).not.toBeNull();
      expect(result?.trackName).toBe('Yesterday');
      expect(result?.artistName).toBe('The Beatles');
      expect(result?.plainLyrics).toContain('Yesterday');
    });

    it('falls back to fuzzy search on 404', async () => {
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(searchResults),
        });

      const result = await client.searchSong('The Beatles', 'Yesterday');

      expect(result).not.toBeNull();
      expect(result?.trackName).toBe('Yesterday');
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('returns null when no results found', async () => {
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([]),
        });

      const result = await client.searchSong('Unknown Artist', 'Unknown Song');

      expect(result).toBeNull();
    });

    it('matches artist without "The" prefix', async () => {
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(searchResults),
        });

      const result = await client.searchSong('Beatles', 'Yesterday');

      expect(result).not.toBeNull();
      expect(result?.artistName).toBe('The Beatles');
    });

    it('falls back to first result with lyrics when no exact match', async () => {
      const noMatchResults = [
        {
          id: 789,
          trackName: 'Different Song',
          artistName: 'Different Artist',
          albumName: 'Album',
          duration: 200,
          plainLyrics: 'Some lyrics',
          syncedLyrics: null,
        },
      ];

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(noMatchResults),
        });

      const result = await client.searchSong('Some Other Artist', 'Some Other Song');

      expect(result).not.toBeNull();
      expect(result?.id).toBe(789);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No exact match'));
    });

    it('skips results without lyrics', async () => {
      const resultsWithoutLyrics = [
        {
          id: 111,
          trackName: 'Yesterday',
          artistName: 'The Beatles',
          albumName: 'Help!',
          duration: 125,
          plainLyrics: null, // No lyrics
          syncedLyrics: null,
        },
        {
          id: 222,
          trackName: 'Yesterday',
          artistName: 'The Beatles',
          albumName: 'Help! Remastered',
          duration: 125,
          plainLyrics: 'Actual lyrics here',
          syncedLyrics: null,
        },
      ];

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(resultsWithoutLyrics),
        });

      const result = await client.searchSong('The Beatles', 'Yesterday');

      expect(result).not.toBeNull();
      expect(result?.id).toBe(222);
      expect(result?.plainLyrics).toBe('Actual lyrics here');
    });

    it('sends User-Agent header', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(exactMatchResponse),
      });

      await client.searchSong('Test', 'Test');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': expect.stringContaining('LyricsPuzzle'),
          }),
        })
      );
    });

    it('URL encodes artist and title', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(exactMatchResponse),
      });

      await client.searchSong('The Beatles', "Can't Buy Me Love");

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("Can't%20Buy%20Me%20Love"),
        expect.any(Object)
      );
    });
  });

  describe('getLyrics', () => {
    it('returns plainLyrics when song is found', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(exactMatchResponse),
      });

      const lyrics = await client.getLyrics('The Beatles', 'Yesterday');

      expect(lyrics).toContain('Yesterday');
      expect(lyrics).toContain('All my troubles seemed so far away');
    });

    it('returns null when song is not found', async () => {
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([]),
        });

      const lyrics = await client.getLyrics('Unknown', 'Unknown');

      expect(lyrics).toBeNull();
    });

    it('returns null when song has no lyrics', async () => {
      const noLyricsResponse = {
        ...exactMatchResponse,
        plainLyrics: null,
      };

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([noLyricsResponse]),
        });

      const lyrics = await client.getLyrics('The Beatles', 'Yesterday');

      expect(lyrics).toBeNull();
    });
  });
});
