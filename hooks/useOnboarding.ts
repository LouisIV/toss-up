'use client'

import { useState, useEffect } from 'react'

const ONBOARDING_COOKIE = 'toss_up_onboarding_completed'

export function useOnboarding() {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if onboarding has been completed
    const checkOnboarding = () => {
      if (typeof document !== 'undefined') {
        const cookies = document.cookie.split(';')
        const onboardingCookie = cookies.find(c => c.trim().startsWith(ONBOARDING_COOKIE))
        setHasCompletedOnboarding(!!onboardingCookie)
        setIsLoading(false)
      }
    }

    checkOnboarding()
  }, [])

  const completeOnboarding = () => {
    if (typeof document !== 'undefined') {
      // Set cookie to expire in 1 year
      const expiryDate = new Date()
      expiryDate.setFullYear(expiryDate.getFullYear() + 1)
      document.cookie = `${ONBOARDING_COOKIE}=true; expires=${expiryDate.toUTCString()}; path=/`
      setHasCompletedOnboarding(true)
    }
  }

  const resetOnboarding = () => {
    if (typeof document !== 'undefined') {
      document.cookie = `${ONBOARDING_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`
      setHasCompletedOnboarding(false)
    }
  }

  return {
    hasCompletedOnboarding,
    isLoading,
    completeOnboarding,
    resetOnboarding
  }
}
