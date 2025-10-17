import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

// Allow build to proceed without DATABASE_URL (for static pages)
// At runtime, API routes will fail if DATABASE_URL is not set
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://placeholder:placeholder@localhost:5432/placeholder';

const sql = neon(DATABASE_URL);
export const db = drizzle(sql, { schema });
