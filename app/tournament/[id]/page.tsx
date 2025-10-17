'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTeams } from '@/hooks/useTeams'
import { useTournament } from '@/hooks/useTournament'
import { AsciiBackground } from '@/components/ui/ascii-background'
import { BracketView } from '@/components/tournament/bracket-view'
import { TableView } from '@/components/tournament/table-view'
import { LineupManager } from '@/components/tournament/lineup-manager'
import { TournamentSettings } from '@/components/tournament/tournament-settings'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TeamList } from '@/components/teams/team-list'

export default function TournamentPage() {
  const params = useParams()
  const router = useRouter()
  const tournamentId = params.id as string
  
  const { data: teams = [] } = useTeams()
  const { data: tournament, isLoading, error } = useTournament(tournamentId)
  const [showTeamManagement, setShowTeamManagement] = useState(false)
  const [showLineupManager, setShowLineupManager] = useState(false)
  const [showTournamentSettings, setShowTournamentSettings] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'bracket'>('table')

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading tournament...</div>
      </div>
    )
  }

  if (error || !tournament) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Tournament Not Found</h1>
          <p className="text-white/70 mb-6">The tournament you&apos;re looking for doesn&apos;t exist.</p>
          <Button onClick={() => router.push('/')}>
            Back to Home
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black relative">
      {/* Background gradient overlay */}
      <div className="fixed inset-0 bg-gradient-radial from-slate-900/20 via-transparent to-black/90 pointer-events-none z-0" />
      <div className="fixed inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10 pointer-events-none z-0" />
      
      {/* Header */}
      <AsciiBackground className="relative z-10 mx-2 mt-2 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 border border-white/10 shadow-2xl py-6 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl md:text-4xl font-black text-white drop-shadow-2xl">
                {tournament.name}
              </h1>
              <div className="flex items-center gap-4 mt-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  tournament.status === 'active' 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : tournament.status === 'completed'
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                }`}>
                  {tournament.status}
                </span>
                <p className="text-white/70 text-sm">
                  Created: {new Date(tournament.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push('/')}
            >
              Back to Home
            </Button>
          </div>
        </div>
      </AsciiBackground>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8 relative z-10 text-white">
        
        {/* Tournament Management Controls */}
        <section>
          <Card className="bg-black/80 backdrop-blur-xl border border-white/20 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-xl text-white">Tournament Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <Button
                  variant={showTeamManagement ? "default" : "outline"}
                  onClick={() => setShowTeamManagement(!showTeamManagement)}
                >
                  {showTeamManagement ? 'Hide' : 'Manage'} Teams
                </Button>
                <Button
                  variant={showLineupManager ? "default" : "outline"}
                  onClick={() => setShowLineupManager(!showLineupManager)}
                >
                  {showLineupManager ? 'Hide' : 'Set'} Lineups
                </Button>
                <Button
                  variant={showTournamentSettings ? "default" : "outline"}
                  onClick={() => setShowTournamentSettings(!showTournamentSettings)}
                >
                  {showTournamentSettings ? 'Hide' : 'Tournament'} Settings
                </Button>
              </div>
              {showTeamManagement && (
                <div className="mt-4 p-4 border border-white/20 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Team Management</h3>
                  <TeamList />
                </div>
              )}
              {showLineupManager && (
                <div className="mt-4">
                  <LineupManager tournament={tournament} allTeams={teams} />
                </div>
              )}
              {showTournamentSettings && (
                <div className="mt-4">
                  <TournamentSettings tournament={tournament} />
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Tournament View Toggle */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold">Tournament View</h2>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                onClick={() => setViewMode('table')}
                size="sm"
              >
                Table View
              </Button>
              <Button
                variant={viewMode === 'bracket' ? 'default' : 'outline'}
                onClick={() => setViewMode('bracket')}
                size="sm"
              >
                Bracket View
              </Button>
            </div>
          </div>
        </section>

        {/* Tournament Display */}
        {tournament.bracketData && tournament.bracketData.rounds && tournament.bracketData.rounds.length > 0 ? (
          <section>
            <div className="bg-black/80 backdrop-blur-xl border border-white/30 rounded-2xl p-6 shadow-2xl">
              {viewMode === 'table' ? (
                <TableView
                  bracketData={tournament.bracketData}
                  teams={teams}
                  tournamentId={tournament.id}
                  tableCount={tournament.tableCount}
                />
              ) : (
                <BracketView
                  bracketData={tournament.bracketData}
                  teams={teams}
                  tournamentId={tournament.id}
                />
              )}
            </div>
          </section>
        ) : (
          <section>
            <Card className="bg-black/80 backdrop-blur-xl border border-white/20 rounded-2xl">
              <CardContent className="p-8 text-center">
                <h3 className="text-xl font-bold mb-4">No Bracket Data</h3>
                <p className="text-white/70 mb-6">
                  This tournament doesn&apos;t have bracket data yet. You may need to regenerate the bracket.
                </p>
                <Button variant="outline">
                  Regenerate Bracket (Coming Soon)
                </Button>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Tournament Stats */}
        <section>
          <Card className="bg-black/80 backdrop-blur-xl border border-white/20 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-xl text-white">Tournament Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-accent mb-2">
                    {teams.length}
                  </div>
                  <div className="text-sm text-white/70">Total Teams</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-accent mb-2">
                    {tournament.tableCount}
                  </div>
                  <div className="text-sm text-white/70">Tables</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-accent mb-2">
                    {tournament.bracketData?.rounds?.length || 0}
                  </div>
                  <div className="text-sm text-white/70">Rounds</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-accent mb-2">
                    {tournament.bracketData?.rounds?.reduce((total, round) => total + round.matches.length, 0) || 0}
                  </div>
                  <div className="text-sm text-white/70">Total Matches</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}
