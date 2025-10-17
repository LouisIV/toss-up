import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { freeAgents, teams } from '@/lib/db/schema';
import { freeAgentSchema } from '@/lib/validations';
import { eq, and, ne, inArray } from 'drizzle-orm';

export async function GET() {
  try {
    const allFreeAgents = await db.select().from(freeAgents);
    return NextResponse.json(allFreeAgents);
  } catch (error) {
    console.error('Error fetching free agents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch free agents' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = freeAgentSchema.parse(body);

    // Create the free agent (unique index on phone prevents duplicates)
    let newFreeAgent;
    try {
      [newFreeAgent] = await db
        .insert(freeAgents)
        .values(validatedData)
        .returning();
    } catch (e: any) {
      // Handle unique constraint violation gracefully
      const message = String(e?.message || '')
      if (message.includes('free_agents_phone_unique_idx') || message.toLowerCase().includes('unique')) {
        return NextResponse.json(
          { error: 'Phone number already registered as a free agent' },
          { status: 400 }
        );
      }
      throw e
    }

    // Try to pair with another waiting free agent
    const waitingAgents = await db
      .select()
      .from(freeAgents)
      .where(
        and(
          eq(freeAgents.status, 'waiting'),
          ne(freeAgents.id, newFreeAgent.id) // Exclude the current agent
        )
      )
      .limit(1);

    if (waitingAgents.length > 0) {
      const partner = waitingAgents[0];
      
      // Create a team for the pair
      const [newTeam] = await db
        .insert(teams)
        .values({
          name: `${newFreeAgent.name} & ${partner.name}`,
          player1: newFreeAgent.name,
          player2: partner.name,
        })
        .returning();

      // Update both free agents to paired status
      await db
        .update(freeAgents)
        .set({ 
          status: 'paired', 
          pairedWith: partner.id,
          teamId: newTeam.id 
        })
        .where(eq(freeAgents.id, newFreeAgent.id));

      await db
        .update(freeAgents)
        .set({ 
          status: 'paired', 
          pairedWith: newFreeAgent.id,
          teamId: newTeam.id 
        })
        .where(eq(freeAgents.id, partner.id));

      return NextResponse.json({
        ...newFreeAgent,
        status: 'paired',
        pairedWith: partner.id,
        teamId: newTeam.id,
        team: newTeam,
        partner: partner
      }, { status: 201 });
    }

    return NextResponse.json(newFreeAgent, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid free agent data', details: error.message },
        { status: 400 }
      );
    }

    console.error('Error creating free agent:', error);
    return NextResponse.json(
      { error: 'Failed to create free agent' },
      { status: 500 }
    );
  }
}

// Manual pairing endpoint
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, agentIds } = body;

    if (action === 'pair' && agentIds && Array.isArray(agentIds) && agentIds.length === 2) {
      const [agent1Id, agent2Id] = agentIds;

      // Verify both agents exist and are waiting
      const agents = await db
        .select()
        .from(freeAgents)
        .where(
          and(
            eq(freeAgents.status, 'waiting'),
            inArray(freeAgents.id, [agent1Id, agent2Id])
          )
        );

      const agent1 = agents.find((a: any) => a.id === agent1Id);
      const agent2 = agents.find((a: any) => a.id === agent2Id);

      if (!agent1 || !agent2) {
        return NextResponse.json(
          { error: 'One or both agents not found or not available for pairing' },
          { status: 400 }
        );
      }

      // Create a team for the pair
      const [newTeam] = await db
        .insert(teams)
        .values({
          name: `${agent1.name} & ${agent2.name}`,
          player1: agent1.name,
          player2: agent2.name,
        })
        .returning();

      // Update both free agents to paired status
      await db
        .update(freeAgents)
        .set({ 
          status: 'paired', 
          pairedWith: agent2.id,
          teamId: newTeam.id 
        })
        .where(eq(freeAgents.id, agent1.id));

      await db
        .update(freeAgents)
        .set({ 
          status: 'paired', 
          pairedWith: agent1.id,
          teamId: newTeam.id 
        })
        .where(eq(freeAgents.id, agent2.id));

      return NextResponse.json({
        success: true,
        team: newTeam,
        pairedAgents: [agent1, agent2]
      });
    }

    if (action === 'auto-pair') {
      // Get all waiting agents
      const waitingAgents = await db
        .select()
        .from(freeAgents)
        .where(eq(freeAgents.status, 'waiting'));

      if (waitingAgents.length < 2) {
        return NextResponse.json(
          { error: 'Need at least 2 waiting agents to pair' },
          { status: 400 }
        );
      }

      const pairs = [];
      const pairedAgentIds = new Set();

      // Pair agents in order
      for (let i = 0; i < waitingAgents.length - 1; i += 2) {
        const agent1 = waitingAgents[i];
        const agent2 = waitingAgents[i + 1];

        if (pairedAgentIds.has(agent1.id) || pairedAgentIds.has(agent2.id)) {
          continue;
        }

        // Create a team for the pair
        const [newTeam] = await db
          .insert(teams)
          .values({
            name: `${agent1.name} & ${agent2.name}`,
            player1: agent1.name,
            player2: agent2.name,
          })
          .returning();

        // Update both free agents to paired status
        await db
          .update(freeAgents)
          .set({ 
            status: 'paired', 
            pairedWith: agent2.id,
            teamId: newTeam.id 
          })
          .where(eq(freeAgents.id, agent1.id));

        await db
          .update(freeAgents)
          .set({ 
            status: 'paired', 
            pairedWith: agent1.id,
            teamId: newTeam.id 
          })
          .where(eq(freeAgents.id, agent2.id));

        pairs.push({
          team: newTeam,
          agents: [agent1, agent2]
        });

        pairedAgentIds.add(agent1.id);
        pairedAgentIds.add(agent2.id);
      }

      return NextResponse.json({
        success: true,
        pairs,
        totalPaired: pairs.length * 2
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in manual pairing:', error);
    return NextResponse.json(
      { error: 'Failed to pair agents' },
      { status: 500 }
    );
  }
}
