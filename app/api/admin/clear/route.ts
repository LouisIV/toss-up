import { NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { matches, tournaments } from '@/lib/db/schema'
import { requireAdmin } from '@/lib/auth'

// DELETE /api/admin/clear
// Admin-only: clears all tournaments and matches
export async function DELETE() {
  try {
    // Require admin authentication
    await requireAdmin()
    
    // Delete children first to satisfy FKs
    await db.delete(matches)
    await db.delete(tournaments)
    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof Error && err.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error clearing data:', err)
    return NextResponse.json({ ok: false, error: 'Failed to clear data' }, { status: 500 })
  }
}


