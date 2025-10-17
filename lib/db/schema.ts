import { pgTable, text, timestamp, uuid, jsonb, integer, type AnyPgColumn, uniqueIndex } from 'drizzle-orm/pg-core';

export const teams = pgTable('teams', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  player1: text('player1').notNull(),
  player2: text('player2').notNull(),
  mascotUrl: text('mascot_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const tournaments = pgTable('tournaments', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  status: text('status').notNull().default('pending'), // pending, active, completed
  tableCount: integer('table_count').notNull().default(1),
  lineup: jsonb('lineup').$type<string[]>(),
  bracketData: jsonb('bracket_data').$type<{
    rounds: Array<{
      round: number;
      matches: Array<{
        id: string;
        team1Id?: string;
        team2Id?: string;
        winnerId?: string;
        position: number;
        tableId?: number;
      }>;
    }>;
  }>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const freeAgents = pgTable('free_agents', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  status: text('status').notNull().default('waiting'), // waiting, paired, withdrawn
  pairedWith: uuid('paired_with').references((): AnyPgColumn => freeAgents.id),
  teamId: uuid('team_id').references((): AnyPgColumn => teams.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    uniquePhoneIdx: uniqueIndex('free_agents_phone_unique_idx').on(table.phone)
  }
});

export const matches = pgTable('matches', {
  id: uuid('id').primaryKey().defaultRandom(),
  tournamentId: uuid('tournament_id').references(() => tournaments.id).notNull(),
  team1Id: uuid('team1_id').references(() => teams.id),
  team2Id: uuid('team2_id').references(() => teams.id),
  winnerId: uuid('winner_id').references(() => teams.id),
  round: integer('round').notNull(),
  position: integer('position').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type Tournament = typeof tournaments.$inferSelect;
export type NewTournament = typeof tournaments.$inferInsert;
export type FreeAgent = typeof freeAgents.$inferSelect;
export type NewFreeAgent = typeof freeAgents.$inferInsert;
export type Match = typeof matches.$inferSelect;
export type NewMatch = typeof matches.$inferInsert;
