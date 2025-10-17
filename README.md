# Die Toss Tournament Manager

A tournament bracket management system for die tossing competitions with a bold retro digital aesthetic. The application enables users to register teams (two players per team), generate tournament brackets, and track match progression through a visually distinctive duotone interface inspired by arcade tournaments.

## Features

- **Team Registration**: Register teams with two players each
- **Tournament Brackets**: Generate single-elimination tournament brackets
- **Table Management**: Configure number of concurrent games (tables) for tournaments
- **Lineup Customization**: Drag-and-drop interface to set team match order
- **Real-time Updates**: Live bracket updates with 10-second polling
- **Retro Design**: Bold duotone colors, thick borders, and ASCII art animations
- **Responsive**: Works on desktop and mobile devices
- **Persistent Storage**: All data stored in Vercel Postgres

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4 with custom duotone theme
- **Database**: Vercel Postgres with Drizzle ORM
- **State Management**: TanStack Query for server state
- **Forms**: React Hook Form with Zod validation
- **Deployment**: Vercel (free tier compatible)

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- Vercel account for database

### Local Development

1. **Clone and install dependencies**:
   ```bash
   git clone <repository-url>
   cd toss-up
   pnpm install
   ```

2. **Set up Vercel Postgres database**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Create a new project or use existing
   - Go to Storage tab and create a Postgres database
   - Copy the connection string

3. **Configure environment variables**:
   Create `.env.local`:
   ```bash
   POSTGRES_URL="your-vercel-postgres-connection-string"
   ```

4. **Run database migrations**:
   ```bash
   pnpm drizzle-kit push
   ```

5. **Start development server**:
   ```bash
   pnpm dev
   ```

6. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Deployment to Vercel

### Automatic Deployment

1. **Push to GitHub** and connect to Vercel
2. **Add environment variable** in Vercel dashboard:
   - `POSTGRES_URL`: Your Vercel Postgres connection string
3. **Deploy**: Vercel will automatically build and deploy

### Manual Deployment

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel
   ```

3. **Add environment variable** in Vercel dashboard:
   - `POSTGRES_URL`: Your Vercel Postgres connection string

4. **Redeploy** to apply environment variables

## Database Schema

The application uses four main tables:

- **teams**: Team information (id, name, player1, player2, mascot_url, created_at)
- **tournaments**: Tournament data (id, name, status, table_count, lineup, bracket_data, created_at)  
- **matches**: Individual match results (id, tournament_id, team1_id, team2_id, winner_id, round, position)
- **free_agents**: Individual players waiting to be paired (id, name, phone, status, paired_with, team_id, created_at)

## API Endpoints

- `GET /api/teams` - Fetch all teams
- `POST /api/teams` - Create new team
- `PUT /api/teams/[id]` - Update team
- `DELETE /api/teams/[id]` - Delete team
- `GET /api/tournaments` - Fetch all tournaments
- `POST /api/tournaments` - Create new tournament
- `GET /api/tournaments/[id]` - Fetch single tournament
- `PUT /api/tournaments/[id]` - Update tournament
- `PATCH /api/matches/[id]` - Update match winner

## Design System

The application features a custom duotone design system:

- **Colors**: Primary blue (#2563EB), Accent coral (#FF6B6B), Cream background (#FEF7ED)
- **Typography**: Ultra-bold headings with Geist fonts
- **Components**: Thick borders (4px), pill-shaped buttons, rounded cards
- **Animations**: ASCII art background with floating characters
- **Theme**: Light/dark mode support

## Free Tier Limits

This application is designed to work within Vercel's free tier:

- **Vercel Postgres**: 256MB storage, 256MB compute
- **Vercel Functions**: 100GB-hours execution time
- **Bandwidth**: 100GB per month

For small to medium tournaments (under 100 teams), the free tier should be sufficient.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally
5. Submit a pull request

## License

MIT License - see LICENSE file for details
