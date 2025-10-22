'use client'

import { useOnboarding } from '@/hooks/useOnboarding'
import { AsciiBackground } from '@/components/ui/ascii-background'
import { TeamList } from '@/components/teams/team-list'
import { FreeAgentsStatus } from '@/components/teams/free-agents-status'
import { OnboardingScreen } from '@/components/ui/onboarding-screen'

export default function Home() {
  const { hasCompletedOnboarding, isLoading, completeOnboarding, resetOnboarding } = useOnboarding()

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
            TEAM MANAGER
          </h2>
          <p className="text-xs md:text-base lg:text-lg text-white/95 max-w-2xl mx-auto mb-3 md:mb-6 drop-shadow-lg px-2 md:px-4">
            Register teams and manage your die tossing competition 
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


      </div>

      {/* Footer */}
      <footer className="relative z-10 py-8 text-center">
        <button
          onClick={resetOnboarding}
          className="text-xs text-white/40 hover:text-white/70 transition-colors duration-200 underline-offset-4 hover:underline"
        >
          View landing page
        </button>
      </footer>
    </div>
  )
}

