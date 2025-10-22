import { z } from 'zod';

export const teamSchema = z.object({
  name: z.string().min(1, 'Team name is required').max(100, 'Team name too long'),
  player1: z.string().min(1, 'Player 1 name is required').max(100, 'Player 1 name too long'),
  player2: z.string().min(1, 'Player 2 name is required').max(100, 'Player 2 name too long'),
  mascotUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
});


export const freeAgentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  phone: z.string().min(1, 'Phone number is required').max(20, 'Phone number too long'),
});

export type TeamInput = z.infer<typeof teamSchema>;
export type FreeAgentInput = z.infer<typeof freeAgentSchema>;
