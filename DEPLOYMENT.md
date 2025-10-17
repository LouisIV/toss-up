# Vercel Deployment Guide

This guide will help you deploy your Toss-Up tournament application to Vercel.

## Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. Your project pushed to a Git repository (GitHub, GitLab, or Bitbucket)

## Step 1: Prepare Your Repository

Make sure your project is committed and pushed to your Git repository:

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel CLI (Recommended)

1. Install Vercel CLI globally:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy your project:
```bash
vercel
```

4. Follow the prompts:
   - Set up and deploy? **Yes**
   - Which scope? Choose your account
   - Link to existing project? **No** (for first deployment)
   - What's your project's name? `toss-up` (or your preferred name)
   - In which directory is your code located? `./` (current directory)

### Option B: Deploy via Vercel Dashboard

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your Git repository
4. Configure the project:
   - Framework Preset: **Next.js**
   - Root Directory: `./`
   - Build Command: `pnpm build`
   - Output Directory: `.next` (auto-detected)
   - Install Command: `pnpm install`

## Step 3: Set Up Database

### Add Vercel Postgres

1. In your Vercel dashboard, go to your project
2. Navigate to the "Storage" tab
3. Click "Create Database" → "Postgres"
4. Choose a name for your database (e.g., `toss-up-db`)
5. Select a region close to your users
6. Click "Create"

### Configure Environment Variables

1. In your Vercel project dashboard, go to "Settings" → "Environment Variables"
2. Add the following variables (they should be automatically added when you create the Postgres database):
   - `POSTGRES_URL` (automatically provided by Vercel)
   - `DATABASE_URL` (automatically provided by Vercel)

## Step 4: Deploy Database Schema

After your first deployment, you need to run the database migrations:

1. Go to your Vercel project dashboard
2. Navigate to "Functions" tab
3. Create a new API route at `app/api/migrate/route.ts` (temporary):

```typescript
import { db } from '@/lib/db/client';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    // Run your schema creation here
    // This is a one-time setup
    return Response.json({ message: 'Database schema created successfully' });
  } catch (error) {
    return Response.json({ error: 'Failed to create schema' }, { status: 500 });
  }
}
```

3. Visit `https://your-app.vercel.app/api/migrate` to run the migration
4. Delete the migration route after successful setup

## Step 5: Verify Deployment

1. Visit your deployed application URL
2. Test the core functionality:
   - Create a tournament
   - Add teams
   - Create matches
   - Verify data persistence

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `POSTGRES_URL` | Vercel Postgres connection string | Yes (auto-provided) |
| `DATABASE_URL` | Alternative database URL | Yes (auto-provided) |

## Build Configuration

The project is configured with:
- **Build Command**: `pnpm build`
- **Install Command**: `pnpm install`
- **Framework**: Next.js
- **Node.js Version**: 18.x (default)

## Troubleshooting

### Build Failures
- Check that all dependencies are in `package.json`
- Ensure TypeScript compilation passes locally
- Verify environment variables are set correctly

### Database Connection Issues
- Confirm `POSTGRES_URL` is set in Vercel environment variables
- Check that the database exists and is accessible
- Verify the connection string format

### Runtime Errors
- Check Vercel function logs in the dashboard
- Ensure all API routes are properly exported
- Verify database schema matches your code

## Custom Domain (Optional)

1. In Vercel dashboard, go to "Settings" → "Domains"
2. Add your custom domain
3. Configure DNS records as instructed
4. Enable SSL (automatic with Vercel)

## Monitoring

- Use Vercel Analytics for performance monitoring
- Check function logs for debugging
- Monitor database usage in the Storage tab

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Drizzle ORM with Vercel](https://orm.drizzle.team/learn/tutorials/drizzle-with-vercel)
