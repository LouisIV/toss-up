import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { teams, freeAgents, matches } from '@/lib/db/schema';
import { teamSchema } from '@/lib/validations';
import { eq, or } from 'drizzle-orm';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = teamSchema.parse(body);

    const [updatedTeam] = await db
      .update(teams)
      .set(validatedData)
      .where(eq(teams.id, id))
      .returning();

    if (!updatedTeam) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedTeam);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid team data', details: error.message },
        { status: 400 }
      );
    }

    console.error('Error updating team:', error);
    return NextResponse.json(
      { error: 'Failed to update team' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // First, check if the team exists
    const existingTeam = await db
      .select()
      .from(teams)
      .where(eq(teams.id, id))
      .limit(1);

    if (!existingTeam.length) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Delete related records first to avoid foreign key constraint violations
    // 1. Update free agents that are paired with this team
    await db
      .update(freeAgents)
      .set({ teamId: null, status: 'waiting' })
      .where(eq(freeAgents.teamId, id));

    // 2. Delete matches that involve this team
    await db
      .delete(matches)
      .where(
        or(
          eq(matches.team1Id, id),
          eq(matches.team2Id, id),
          eq(matches.winnerId, id)
        )
      );

    // 3. Finally, delete the team
    const [deletedTeam] = await db
      .delete(teams)
      .where(eq(teams.id, id))
      .returning();

    return NextResponse.json({ 
      message: 'Team deleted successfully',
      team: deletedTeam
    });
  } catch (error) {
    console.error('Error deleting team:', error);
    return NextResponse.json(
      { error: 'Failed to delete team' },
      { status: 500 }
    );
  }
}
