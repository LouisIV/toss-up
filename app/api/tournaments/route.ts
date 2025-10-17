import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { tournaments, matches } from '@/lib/db/schema';
import { tournamentSchema } from '@/lib/validations';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const allTournaments = await db.select().from(tournaments);
    return NextResponse.json(allTournaments);
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tournaments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = tournamentSchema.parse(body);

    // If creating an active tournament, deactivate all other active tournaments
    if (validatedData.status === 'active') {
      await db
        .update(tournaments)
        .set({ status: 'completed' })
        .where(eq(tournaments.status, 'active'));
    }

    const [newTournament] = await db
      .insert(tournaments)
      .values(validatedData)
      .returning();

    // If the tournament has bracket data, create individual match records
    if (newTournament.bracketData && newTournament.bracketData.rounds) {
      const matchRecords = [];
      
      for (const round of newTournament.bracketData.rounds) {
        for (const match of round.matches) {
          matchRecords.push({
            tournamentId: newTournament.id,
            team1Id: match.team1Id || null,
            team2Id: match.team2Id || null,
            winnerId: match.winnerId || null,
            round: round.round,
            position: match.position,
          });
        }
      }
      
      if (matchRecords.length > 0) {
        await db.insert(matches).values(matchRecords);
      }
    }

    return NextResponse.json(newTournament, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid tournament data', details: error.message },
        { status: 400 }
      );
    }

    console.error('Error creating tournament:', error);
    return NextResponse.json(
      { error: 'Failed to create tournament' },
      { status: 500 }
    );
  }
}
