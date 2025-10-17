import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

// In-memory storage for local development
class InMemoryStorage {
  private static instance: InMemoryStorage;
  private teams: any[] = [];
  private tournaments: any[] = [];
  private matches: any[] = [];

  private constructor() {}

  static getInstance(): InMemoryStorage {
    if (!InMemoryStorage.instance) {
      InMemoryStorage.instance = new InMemoryStorage();
    }
    return InMemoryStorage.instance;
  }

  select() {
    return {
      from: (table: any) => {
        if (table === schema.teams) return Promise.resolve(this.teams);
        if (table === schema.tournaments) return Promise.resolve(this.tournaments);
        if (table === schema.matches) return Promise.resolve(this.matches);
        return Promise.resolve([]);
      }
    };
  }

  insert(table: any) {
    return {
      values: (data: any) => ({
        returning: () => {
          const id = Math.random().toString(36).substr(2, 9);
          const record = { id, ...data, createdAt: new Date() };
          
          if (table === schema.teams) {
            this.teams.push(record);
          } else if (table === schema.tournaments) {
            this.tournaments.push(record);
          } else if (table === schema.matches) {
            this.matches.push(record);
          }
          
          return Promise.resolve([record]);
        }
      })
    };
  }

  update(table: any) {
    return {
      set: (data: any) => ({
        where: (condition: any) => ({
          returning: () => {
            let targetArray: any[] = [];
            if (table === schema.teams) targetArray = this.teams;
            else if (table === schema.tournaments) targetArray = this.tournaments;
            else if (table === schema.matches) targetArray = this.matches;

            const index = targetArray.findIndex(item => item.id === condition.id);
            if (index !== -1) {
              targetArray[index] = { ...targetArray[index], ...data };
              return Promise.resolve([targetArray[index]]);
            }
            return Promise.resolve([]);
          }
        })
      })
    };
  }

  delete(table: any) {
    return {
      where: (condition: any) => ({
        returning: () => {
          let targetArray: any[] = [];
          if (table === schema.teams) targetArray = this.teams;
          else if (table === schema.tournaments) targetArray = this.tournaments;
          else if (table === schema.matches) targetArray = this.matches;

          const index = targetArray.findIndex(item => item.id === condition.id);
          if (index !== -1) {
            const deleted = targetArray.splice(index, 1)[0];
            return Promise.resolve([deleted]);
          }
          return Promise.resolve([]);
        }
      })
    };
  }
}

// Database connection
let db: any;

try {
  if (process.env.DATABASE_URL) {
    const sql = neon(process.env.DATABASE_URL);
    db = drizzle(sql, { schema });
    console.log('✅ Connected to Neon Database');
  } else {
    console.log('🔧 Using in-memory storage for local development');
    db = InMemoryStorage.getInstance();
  }
} catch (error) {
  console.log('🔧 Database connection failed, using in-memory storage');
  db = InMemoryStorage.getInstance();
}

export { db };
