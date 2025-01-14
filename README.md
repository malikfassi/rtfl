# RTFL - Song Guessing Game

A daily song guessing game where players uncover lyrics, artist names, and song titles through word guesses.

## Features

- Daily song challenges
- Word-by-word guessing
- Progress tracking
- Dark mode support
- Spotify integration
- Mobile-friendly design

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript with strict mode
- **Database**: SQLite with Prisma ORM
- **Styling**: Tailwind CSS
- **Testing**: Jest
- **State Management**: React Context + Hooks
- **APIs**: Spotify, Genius

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Spotify Developer Account
- Genius API Key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/rtfl.git
   cd rtfl
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env.local
   ```

4. Fill in your environment variables in `.env.local`

5. Start the development server:
   ```bash
   pnpm dev
   ```

## Development

### Directory Structure

```
src/
  app/              # Next.js App Router
    api/            # API Routes
    admin/          # Admin Panel
    game/           # Game Pages
  components/       # React Components
    game/          # Game Components
    admin/         # Admin Components
    ui/           # Shared UI Components
  lib/             # Shared Utilities
  prisma/          # Database Schema
  types/           # TypeScript Types
  styles/          # Global Styles
```

### Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm test` - Run tests (when added)

### Environment Variables

Required environment variables:

- `DATABASE_URL` - SQLite database URL
- `SPOTIFY_CLIENT_ID` - Spotify API client ID
- `SPOTIFY_CLIENT_SECRET` - Spotify API client secret
- `SPOTIFY_REFRESH_TOKEN` - Spotify refresh token
- `GENIUS_ACCESS_TOKEN` - Genius API access token
- `ADMIN_PASSWORD` - Admin panel password

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## License

MIT
