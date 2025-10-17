'use client'

import { useEffect, useState } from 'react'
import { Button } from './button'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  name: string | null
  avatarUrl: string | null
  role: 'user' | 'admin'
}

export function AuthButton() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        setUser(data.user)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [])

  const handleSignOut = async () => {
    await fetch('/api/auth/signout', { method: 'POST' })
    window.location.href = '/'
  }

  if (loading) {
    return (
      <div className="h-10 w-24 bg-white/10 animate-pulse rounded-xl" />
    )
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2">
          {user.avatarUrl && (
            <img 
              src={user.avatarUrl} 
              alt={user.name || 'User'} 
              className="w-8 h-8 rounded-full border-2 border-white/20"
            />
          )}
          <div className="text-left">
            <p className="text-sm font-bold text-white">
              {user.name}
            </p>
            {user.role === 'admin' && (
              <p className="text-xs text-accent">Admin</p>
            )}
          </div>
        </div>
        <Button
          onClick={handleSignOut}
          variant="outline"
          className="bg-black/40 hover:bg-black/60 text-white border-white/20"
        >
          Sign Out
        </Button>
      </div>
    )
  }

  return (
    <Button
      onClick={() => router.push('/auth/signin')}
      className="bg-white text-black hover:bg-white/90 font-bold"
    >
      Sign In
    </Button>
  )
}
