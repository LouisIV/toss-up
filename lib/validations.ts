import { z } from 'zod';

export const teamSchema = z.object({
  name: z.string().min(1, 'Team name is required').max(100, 'Team name too long'),
  player1: z.string().min(1, 'Player 1 name is required').max(100, 'Player 1 name too long'),
  player2: z.string().min(1, 'Player 2 name is required').max(100, 'Player 2 name too long'),
  mascotUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
});

export const tournamentSchema = z.object({
  name: z.string().min(1, 'Tournament name is required').max(100, 'Tournament name too long'),
  status: z.enum(['pending', 'active', 'completed']).default('pending'),
  tableCount: z.number().int().min(1).default(1),
  lineup: z.array(z.string().uuid()).optional(),
  bracketData: z.object({
    rounds: z.array(z.object({
      round: z.number().int(),
      matches: z.array(z.object({
        id: z.string(),
        team1Id: z.string().uuid().optional(),
        team2Id: z.string().uuid().optional(),
        winnerId: z.string().uuid().optional(),
        position: z.number().int(),
        tableId: z.number().int().optional(),
      })),
    })),
  }).optional(),
});

export const freeAgentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  phone: z.string().min(1, 'Phone number is required').max(20, 'Phone number too long'),
});

export const matchUpdateSchema = z.object({
  winnerId: z.string().uuid('Invalid winner ID'),
  tournamentId: z.string().uuid('Invalid tournament ID').optional(),
  round: z.number().int().optional(),
  position: z.number().int().optional(),
});

export type TeamInput = z.infer<typeof teamSchema>;
export type TournamentInput = z.infer<typeof tournamentSchema>;
export type FreeAgentInput = z.infer<typeof freeAgentSchema>;
export type MatchUpdateInput = z.infer<typeof matchUpdateSchema>;
