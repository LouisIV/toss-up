import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import Google from "next-auth/providers/google"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/lib/db/client"
import { users, accounts, sessions, verificationTokens } from "@/lib/db/schema"

// List of admin emails - these should be set via environment variables
const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(',').map(email => email.trim().toLowerCase()) || []

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        // Add user ID and role to session
        session.user.id = user.id
        
        // Check if user email is in admin list
        const userEmail = user.email?.toLowerCase()
        const isAdmin = userEmail && ADMIN_EMAILS.includes(userEmail)
        
        // Update user role in database if needed
        if (isAdmin && (user as any).role !== 'admin') {
          await db.update(users)
            .set({ role: 'admin' })
            .where((t) => t.id === user.id)
          session.user.role = 'admin'
        } else {
          session.user.role = (user as any).role || 'user'
        }
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'database',
  },
})

// Helper function to check if user is admin
export async function isAdmin(): Promise<boolean> {
  const session = await auth()
  return session?.user?.role === 'admin'
}

// Helper function to get current user
export async function getCurrentUser() {
  const session = await auth()
  return session?.user
}
