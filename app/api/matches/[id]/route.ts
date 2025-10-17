import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { matches, tournaments, teams } from '@/lib/db/schema';
import { matchUpdateSchema } from '@/lib/validations';
import { eq, and, inArray } from 'drizzle-orm';
import { TournamentSolver } from '@/lib/tournament-solver';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { winnerId, tournamentId, round, position } = matchUpdateSchema.parse(body);
    
    console.log('API PATCH called with:', { id, winnerId, tournamentId, round, position });

    // Find the match by tournament ID, round, and position (bracket data approach)
    let match;
    if (tournamentId && round !== undefined && position !== undefined) {
      console.log('Looking for match by tournamentId, round, position');
      [match] = await db
        .select()
        .from(matches)
        .where(
          and(
            eq(matches.tournamentId, tournamentId),
            eq(matches.round, round),
            eq(matches.position, position)
          )
        );
      console.log('Found match by tournamentId, round, position:', match);
    } else {
      console.log('Looking for match by ID');
      // Fallback to finding by ID (for backward compatibility)
      [match] = await db
        .select()
        .from(matches)
        .where(eq(matches.id, id));
      console.log('Found match by ID:', match);
    }

    if (!match) {
      console.log('No match found');
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }

    // Get the tournament with its bracket data
    const [tournament] = await db
      .select()
      .from(tournaments)
      .where(eq(tournaments.id, match.tournamentId));

    if (!tournament || !tournament.bracketData) {
      return NextResponse.json(
        { error: 'Tournament or bracket data not found' },
        { status: 404 }
      );
    }

    // Update the tournament's bracket data to reflect the winner
    // Use the actual match ID from the request
    const bracketMatchId = id; // Use the match ID from the URL parameter
    console.log('Using bracketMatchId:', bracketMatchId);
    
    // Create a solver to process the match result
    // We need to fetch the actual team data from the tournament lineup
    const teamIds = tournament.lineup || [];
    const tournamentTeams = teamIds.length > 0 
      ? await db.select().from(teams).where(inArray(teams.id, teamIds))
      : [];
    
    const solver = new TournamentSolver(tournamentTeams, tournament.tableCount);
    // Set the current bracket state
    solver['bracketData'] = tournament.bracketData;
    
    // Process the match result
    const updatedBracketData = solver.processMatchResult(bracketMatchId, winnerId);
    
    // Update both the tournament bracket data and the individual match record
    await Promise.all([
      db
        .update(tournaments)
        .set({ bracketData: updatedBracketData })
        .where(eq(tournaments.id, match.tournamentId)),
      db
        .update(matches)
        .set({ winnerId })
        .where(eq(matches.id, match.id))
    ]);

    const [updatedMatch] = await db
      .select()
      .from(matches)
      .where(eq(matches.id, match.id));

    return NextResponse.json(updatedMatch);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid match data', details: error.message },
        { status: 400 }
      );
    }

    console.error('Error updating match:', error);
    return NextResponse.json(
      { error: 'Failed to update match' },
      { status: 500 }
    );
  }
}
