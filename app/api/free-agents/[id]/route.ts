import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { freeAgents } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const freeAgent = await db
      .select()
      .from(freeAgents)
      .where(eq(freeAgents.id, id))
      .limit(1);

    if (freeAgent.length === 0) {
      return NextResponse.json(
        { error: 'Free agent not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(freeAgent[0]);
  } catch (error) {
    console.error('Error fetching free agent:', error);
    return NextResponse.json(
      { error: 'Failed to fetch free agent' },
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
    console.log('Attempting to delete free agent with ID:', id);
    
    // First, check if the free agent exists
    const existingAgent = await db
      .select()
      .from(freeAgents)
      .where(eq(freeAgents.id, id))
      .limit(1);

    if (!existingAgent.length) {
      console.log('No free agent found with ID:', id);
      return NextResponse.json(
        { error: 'Free agent not found' },
        { status: 404 }
      );
    }

    // Handle foreign key constraints by updating related records first
    // 1. Update any free agents that are paired with this agent
    await db
      .update(freeAgents)
      .set({ pairedWith: null, status: 'waiting' })
      .where(eq(freeAgents.pairedWith, id));

    // 2. Now delete the free agent
    const result = await db
      .delete(freeAgents)
      .where(eq(freeAgents.id, id))
      .returning();

    console.log('Successfully deleted free agent:', result[0]);
    return NextResponse.json({ message: 'Free agent deleted successfully' });
  } catch (error) {
    console.error('Error deleting free agent:', error);
    return NextResponse.json(
      { error: 'Failed to delete free agent' },
      { status: 500 }
    );
  }
}
