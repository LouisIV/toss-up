import { pgTable, text, timestamp, uuid, type AnyPgColumn, uniqueIndex } from 'drizzle-orm/pg-core';

export const teams = pgTable('teams', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  player1: text('player1').notNull(),
  player2: text('player2').notNull(),
  mascotUrl: text('mascot_url'),
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


export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type FreeAgent = typeof freeAgents.$inferSelect;
export type NewFreeAgent = typeof freeAgents.$inferInsert;
