export const geniusClient = {
  searchSong: jest.fn().mockResolvedValue(
    'Test lyrics\nSecond line\nThird line'
  ),
};

export default geniusClient; 