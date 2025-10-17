'use client'

import { useState } from 'react'
import { Tournament } from '@/lib/db/schema'
import { useUpdateTournamentSettings } from '@/hooks/useTournament'
import { hasMatchResults } from '@/lib/tournament-utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'

interface TournamentSettingsProps {
  tournament: Tournament
}

export function TournamentSettings({ tournament }: TournamentSettingsProps) {
  const [name, setName] = useState(tournament.name)
  const [status, setStatus] = useState(tournament.status)
  const [tableCount, setTableCount] = useState(tournament.tableCount)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingChanges, setPendingChanges] = useState<{
    name?: string
    status?: string
    tableCount?: number
  }>({})

  const updateSettings = useUpdateTournamentSettings()
  const hasResults = hasMatchResults(tournament)
  const originalTableCount = tournament.tableCount
  const tableCountChanged = tableCount !== originalTableCount

  const hasChanges = 
    name !== tournament.name || 
    status !== tournament.status || 
    tableCount !== tournament.tableCount

  const handleSave = () => {
    if (tableCountChanged && hasResults) {
      // Show confirmation dialog for destructive changes
      setPendingChanges({ name, status, tableCount })
      setShowConfirmDialog(true)
    } else {
      // Safe changes, save directly
      updateSettings.mutate({
        id: tournament.id,
        name,
        status,
        tableCount,
      })
    }
  }

  const handleConfirmSave = () => {
    updateSettings.mutate({
      id: tournament.id,
      ...pendingChanges,
    })
    setPendingChanges({})
  }

  const handleReset = () => {
    setName(tournament.name)
    setStatus(tournament.status)
    setTableCount(tournament.tableCount)
  }

  return (
    <>
      <Card className="bg-black/80 backdrop-blur-xl border border-white/20 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-xl text-white">Tournament Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tournament Name */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white/80">
              Tournament Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter tournament name"
              className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
            />
          </div>

          {/* Tournament Status */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white/80">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-white/20"
            >
              <option value="pending" className="bg-black text-white">Pending</option>
              <option value="active" className="bg-black text-white">Active</option>
              <option value="completed" className="bg-black text-white">Completed</option>
            </select>
          </div>

          {/* Table Count */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white/80">
              Number of Tables
            </label>
            <Input
              type="number"
              min="1"
              max="10"
              value={tableCount}
              onChange={(e) => setTableCount(parseInt(e.target.value) || 1)}
              className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
            />
            {tableCountChanged && hasResults && (
              <p className="text-sm text-yellow-400">
                ⚠️ Changing table count will regenerate the entire bracket and lose all match results.
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSave}
              disabled={!hasChanges || updateSettings.isPending}
              className="bg-white text-black hover:bg-white/90"
            >
              {updateSettings.isPending ? 'Saving...' : 'Save Settings'}
            </Button>
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={!hasChanges || updateSettings.isPending}
              className="text-white border-white/30 hover:bg-white/10"
            >
              Reset
            </Button>
          </div>

          {/* Warning for ongoing matches */}
          {hasResults && (
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-sm text-yellow-400">
                ⚠️ This tournament has ongoing matches. Some changes may require regenerating the bracket.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        title="Regenerate Tournament Bracket?"
        description="Changing the table count will regenerate the entire tournament bracket and permanently delete all current match results. This action cannot be undone."
        confirmText="Yes, Regenerate Bracket"
        variant="destructive"
        onConfirm={handleConfirmSave}
        isLoading={updateSettings.isPending}
      />
    </>
  )
}
