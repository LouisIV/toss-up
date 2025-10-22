'use client'

import { useState } from 'react'
import { Team } from '@/lib/db/schema'
import { useDeleteTeam } from '@/hooks/useTeams'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TeamForm } from './team-form'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface TeamCardProps {
  team: Team
}

export function TeamCard({ team }: TeamCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const deleteTeam = useDeleteTeam()

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete team "${team.name}"? This will also remove any associated matches and free agent pairings.`)) {
      try {
        await deleteTeam.mutateAsync(team.id)
        // Success feedback is handled by the mutation's onSuccess callback
      } catch (error) {
        console.error('Error deleting team:', error)
        alert(`Failed to delete team: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }

  return (
    <>
      <Card className="bg-black/80 backdrop-blur-xl border border-white/20 rounded-2xl hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold text-center text-white">
            {team.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {team.mascotUrl && (
            <div className="flex justify-center mb-3">
              <img 
                src={team.mascotUrl} 
                alt={`${team.name} mascot`}
                className="w-16 h-16 object-cover rounded-full border-2 border-white/30"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
          <div className="text-center space-y-1">
            <p className="font-medium text-white">{team.player1}</p>
            <p className="text-white/70 text-sm">&</p>
            <p className="font-medium text-white">{team.player2}</p>
          </div>
          
          <div className="flex gap-2 pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="flex-1"
            >
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleteTeam.isPending}
              className="flex-1"
            >
              {deleteTeam.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
          </DialogHeader>
          <TeamForm
            initialValues={team}
            onSuccess={() => setIsEditing(false)}
            onCancel={() => setIsEditing(false)}
            isInDialog={true}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
