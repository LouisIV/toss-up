'use client'

import { useRouter } from 'next/navigation'
import { useTeams } from '@/hooks/useTeams'
import { useTournaments } from '@/hooks/useTournament'
import { useOnboarding } from '@/hooks/useOnboarding'
import { AsciiBackground } from '@/components/ui/ascii-background'
import { TeamList } from '@/components/teams/team-list'
import { FreeAgentsStatus } from '@/components/teams/free-agents-status'
import { TournamentControls } from '@/components/tournament/tournament-controls'
import { OnboardingScreen } from '@/components/ui/onboarding-screen'

export default function Home() {
  const router = useRouter()
  const { data: teams = [] } = useTeams()
  const { data: tournaments = [] } = useTournaments()
  const { hasCompletedOnboarding, isLoading, completeOnboarding, resetOnboarding } = useOnboarding()

  const handleTournamentCreated = (tournament: { id: string }) => {
    // Navigate to the new tournament page
    router.push(`/tournament/${tournament.id}`)
  }

  const handleTournamentClick = (tournament: { id: string }) => {
    router.push(`/tournament/${tournament.id}`)
  }

  // Ensure only one active tournament exists
  const activeTournament = tournaments.find(t => t.status === 'active')

  // Show loading state while checking onboarding status
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  // Show onboarding screen if not completed
  if (!hasCompletedOnboarding) {
    return <OnboardingScreen onComplete={completeOnboarding} />
  }

  return (
    <div className="min-h-screen bg-black relative">
      {/* Background gradient overlay */}
      <div className="fixed inset-0 bg-gradient-radial from-slate-900/20 via-transparent to-black/90 pointer-events-none z-0" />
      <div className="fixed inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10 pointer-events-none z-0" />
      
      {/* Hero Section with ASCII Shader Background */}
      <AsciiBackground className="relative z-10 mx-1 mt-1 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 border border-white/10 shadow-2xl py-6 md:py-16 px-3 md:px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-2xl md:text-5xl lg:text-7xl font-black mb-1 md:mb-4 text-white drop-shadow-2xl">
            DIE TOSS
          </h1>
          <h2 className="text-sm md:text-2xl lg:text-3xl font-bold mb-3 md:mb-6 text-white drop-shadow-xl">
            TOURNAMENT MANAGER
          </h2>
          <p className="text-xs md:text-base lg:text-lg text-white/95 max-w-2xl mx-auto mb-3 md:mb-6 drop-shadow-lg px-2 md:px-4">
            Register teams, generate brackets, and track your die tossing tournament 
            with our bold retro digital interface.
          </p>
        </div>
      </AsciiBackground>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-2 md:px-4 py-2 md:py-8 space-y-4 md:space-y-12 relative z-10 text-white">
        {/* Team Registration Section */}
        <section>
          <TeamList />
        </section>

        {/* Free Agents Status */}
        <section>
          <FreeAgentsStatus />
        </section>

        {/* Tournament Controls */}
        {teams.length >= 2 && (
          <section>
            <TournamentControls 
              teams={teams} 
              onTournamentCreated={handleTournamentCreated}
              hasActiveTournament={!!activeTournament}
            />
          </section>
        )}

        {/* Tournament Selection */}
        {tournaments.length > 0 && (
          <section>
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-3 md:mb-4 gap-2">
              <h2 className="text-lg md:text-2xl font-bold">Your Tournaments</h2>
              {activeTournament && (
                <p className="text-xs md:text-sm text-white/70">
                  Active: <span className="text-accent font-medium">{activeTournament.name}</span>
                </p>
              )}
            </div>
            <p className="text-xs md:text-sm text-white/70 mb-3 md:mb-4">
              Click on any tournament below to manage it, view brackets, and track matches.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
              {tournaments.map((tournament) => (
                <div
                  key={tournament.id}
                  className="bg-black/80 backdrop-blur-xl border border-white/30 rounded-2xl p-3 md:p-4 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:bg-black/90 hover:border-white/50"
                  onClick={() => handleTournamentClick(tournament)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-sm md:text-lg text-white">{tournament.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      tournament.status === 'active' 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : tournament.status === 'completed'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                    }`}>
                      {tournament.status}
                    </span>
                  </div>
                  <p className="text-xs md:text-sm text-white/70">
                    Created: {new Date(tournament.createdAt).toLocaleDateString()}
                  </p>
                  {tournament.bracketData && (
                    <p className="text-xs text-white/60 mt-1">
                      {tournament.bracketData.rounds?.length || 0} rounds
                    </p>
                  )}
                  <div className="mt-2 md:mt-3 flex justify-between items-center">
                    <span className="text-xs text-white/50">Click to manage</span>
                    <span className="text-xs text-accent">→</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>

      {/* Return to Landing Page Button */}
      <button
        onClick={resetOnboarding}
        className="fixed bottom-4 right-4 z-50 bg-black/80 backdrop-blur-xl border border-white/30 rounded-full px-4 py-2 text-xs text-white/70 hover:text-white hover:border-white/50 transition-all duration-300 hover:shadow-xl"
        title="View landing page again"
      >
        View Landing Page
      </button>
    </div>
  )
}

