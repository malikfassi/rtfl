export const spotifyClient = {
  getPlaylistTracks: jest.fn().mockImplementation(async (spotifyId: string) => ({
    tracks: [{
      id: spotifyId,
      name: 'Test Song',
      artists: [{ name: 'Test Artist' }],
      preview_url: 'https://test.com/preview.mp3',
    }],
  })),
  getUserPlaylists: jest.fn().mockImplementation(async () => [
    {
      id: 'playlist-1',
      name: 'Test Playlist 1',
      description: 'Test Description 1',
      images: [{ url: 'https://test.com/image1.jpg' }]
    },
    {
      id: 'playlist-2',
      name: 'Test Playlist 2',
      description: 'Test Description 2',
      images: [{ url: 'https://test.com/image2.jpg' }]
    }
  ])
};

export default spotifyClient; 