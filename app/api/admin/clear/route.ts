import { NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { matches, tournaments } from '@/lib/db/schema'

// DELETE /api/admin/clear
// Dev-only helper: clears all tournaments and matches
export async function DELETE() {
  try {
    // Delete children first to satisfy FKs
    await db.delete(matches)
    await db.delete(tournaments)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Error clearing data:', err)
    return NextResponse.json({ ok: false, error: 'Failed to clear data' }, { status: 500 })
  }
}


