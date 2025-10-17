import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { teams } from '@/lib/db/schema';
import { teamSchema } from '@/lib/validations';
import { ilike } from 'drizzle-orm';

export async function GET() {
  try {
    const allTeams = await db.select().from(teams);
    return NextResponse.json(allTeams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = teamSchema.parse(body);

    // Check if a team with this name already exists (case-insensitive)
    const existingTeam = await db
      .select()
      .from(teams)
      .where(ilike(teams.name, validatedData.name))
      .limit(1);

    if (existingTeam.length > 0) {
      return NextResponse.json(
        { error: 'A team with this name already exists' },
        { status: 409 }
      );
    }

    const [newTeam] = await db
      .insert(teams)
      .values(validatedData)
      .returning();

    return NextResponse.json(newTeam, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid team data', details: error.message },
        { status: 400 }
      );
    }

    console.error('Error creating team:', error);
    return NextResponse.json(
      { error: 'Failed to create team' },
      { status: 500 }
    );
  }
}
