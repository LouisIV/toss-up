import { NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { teams, freeAgents } from '@/lib/db/schema'

// DELETE /api/admin/clear
// Dev-only helper: clears all teams and free agents
export async function DELETE() {
  try {
    await db.delete(freeAgents)
    await db.delete(teams)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Error clearing data:', err)
    return NextResponse.json({ ok: false, error: 'Failed to clear data' }, { status: 500 })
  }
}


