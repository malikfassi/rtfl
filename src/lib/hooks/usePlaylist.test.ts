import { renderHook, act } from '@testing-library/react';
import { usePlaylist } from './usePlaylist';

const mockPlaylists = [
  { id: '1', name: 'Playlist 1' },
  { id: '2', name: 'Playlist 2' }
];

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('usePlaylist', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('searchPlaylists', () => {
    it('should return formatted playlists from API response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ items: mockPlaylists })
      });

      const { result } = renderHook(() => usePlaylist());
      
      await act(async () => {
        await result.current.searchPlaylists('test query');
      });

      const playlists = result.current.playlists;
      expect(playlists).toEqual(mockPlaylists);
      expect(result.current.error).toBeNull();
      expect(mockFetch).toHaveBeenCalledWith('/api/spotify/playlists/search?query=test%20query');
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Failed to search playlists'));

      const { result } = renderHook(() => usePlaylist());
      
      await act(async () => {
        await result.current.searchPlaylists('test query');
      });

      const playlists = result.current.playlists;
      expect(playlists).toEqual([]);
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Failed to search playlists');
    });

    it('should handle empty query', async () => {
      const { result } = renderHook(() => usePlaylist());
      
      await act(async () => {
        await result.current.searchPlaylists('');
      });

      const playlists = result.current.playlists;
      expect(playlists).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle malformed API response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ items: null })
      });

      const { result } = renderHook(() => usePlaylist());
      
      await act(async () => {
        await result.current.searchPlaylists('test query');
      });

      const playlists = result.current.playlists;
      expect(playlists).toEqual([]);
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Failed to parse playlists');
    });
  });
}); 