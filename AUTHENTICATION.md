# Authentication Setup Guide

This application uses [Arctic](https://arcticjs.dev/) for OAuth authentication with GitHub and Google providers. Admin access is controlled via a whitelist of email addresses.

## Quick Start

### 1. Set Up OAuth Providers

#### GitHub OAuth

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the details:
   - **Application name**: Your app name (e.g., "Toss Up Tournament")
   - **Homepage URL**: `http://localhost:3000` (for local dev) or your production URL
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Click "Register application"
5. Copy your **Client ID** and generate a **Client Secret**

#### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the "Google+ API"
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Configure the OAuth consent screen if prompted
6. Select "Web application" as the application type
7. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (for local dev)
   - Your production callback URL
8. Copy your **Client ID** and **Client Secret**

### 2. Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
# Database
DATABASE_URL=your_database_url_here

# Base URL (update for production)
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Admin emails (comma-separated, case-insensitive)
ADMIN_EMAILS=your-email@example.com,another-admin@example.com
```

### 3. Run Database Migrations

```bash
pnpm db:push
```

### 4. Start the Development Server

```bash
pnpm dev
```

Visit `http://localhost:3000` and you should see a "Sign In" button in the top right.

## Admin Access

Users whose email addresses are listed in the `ADMIN_EMAILS` environment variable will automatically receive admin privileges upon signing in.

Admin users can:
- Delete teams
- Clear all tournament data via `/api/admin/clear`
- Future admin features as they're added

## Production Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Import the project in Vercel
3. Add the following environment variables in your Vercel project settings:
   - `DATABASE_URL`
   - `NEXT_PUBLIC_BASE_URL` (your production URL, e.g., `https://your-app.vercel.app`)
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `ADMIN_EMAILS`

4. Update your OAuth callback URLs in GitHub and Google:
   - GitHub: `https://your-app.vercel.app/api/auth/callback/github`
   - Google: `https://your-app.vercel.app/api/auth/callback/google`

5. Deploy!

## Security Notes

- Session tokens are stored in HTTP-only cookies
- Sessions expire after 30 days of inactivity
- Sessions are automatically extended when used within 15 days of expiration
- Admin access is controlled via environment variables (not in code)
- OAuth state validation prevents CSRF attacks
- All authentication endpoints use secure practices from Arctic

## API Endpoints

### Authentication Routes

- `GET /api/auth/signin/github` - Initiates GitHub OAuth flow
- `GET /api/auth/signin/google` - Initiates Google OAuth flow
- `GET /api/auth/callback/github` - GitHub OAuth callback
- `GET /api/auth/callback/google` - Google OAuth callback
- `POST /api/auth/signout` - Signs out the current user
- `GET /api/auth/me` - Returns current user info

### Protected Admin Routes

- `DELETE /api/admin/clear` - Clears all tournaments and matches (admin only)
- `DELETE /api/teams/[id]` - Deletes a team (admin only)

## Troubleshooting

### "Unauthorized" errors

Make sure your email is listed in `ADMIN_EMAILS` and matches exactly (case-insensitive) with the email from your OAuth provider.

### OAuth redirect errors

Double-check that your callback URLs are correct in both the OAuth provider settings and your `NEXT_PUBLIC_BASE_URL` environment variable.

### Session not persisting

Ensure cookies are enabled in your browser and that you're not blocking third-party cookies (though this app only uses first-party cookies).
