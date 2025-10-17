import { github, createSession, generateSessionToken, setSessionTokenCookie, isAdminEmail } from "@/lib/auth";
import { cookies } from "next/headers";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { eq, or } from "drizzle-orm";
import { OAuth2RequestError } from "arctic";

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  
  const cookieStore = await cookies();
  const storedState = cookieStore.get("github_oauth_state")?.value ?? null;

  if (!code || !state || !storedState || state !== storedState) {
    return new Response(null, {
      status: 400,
    });
  }

  try {
    const tokens = await github.validateAuthorizationCode(code);
    const githubUserResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokens.accessToken()}`,
      },
    });
    const githubUser: GitHubUser = await githubUserResponse.json();

    // Get user's email
    let email = githubUser.email;
    if (!email) {
      const emailsResponse = await fetch("https://api.github.com/user/emails", {
        headers: {
          Authorization: `Bearer ${tokens.accessToken()}`,
        },
      });
      const emails: GitHubEmail[] = await emailsResponse.json();
      email = emails.find((e) => e.primary)?.email || emails[0]?.email;
    }

    if (!email) {
      return new Response("No email found", { status: 400 });
    }

    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(or(eq(users.githubId, String(githubUser.id)), eq(users.email, email)))
      .limit(1);

    let userId: string;
    const role = isAdminEmail(email) ? 'admin' : 'user';

    if (existingUser.length > 0) {
      // Update existing user
      userId = existingUser[0].id;
      await db
        .update(users)
        .set({
          githubId: String(githubUser.id),
          name: githubUser.name || githubUser.login,
          avatarUrl: githubUser.avatar_url,
          role,
        })
        .where(eq(users.id, userId));
    } else {
      // Create new user
      const [newUser] = await db
        .insert(users)
        .values({
          githubId: String(githubUser.id),
          email,
          name: githubUser.name || githubUser.login,
          avatarUrl: githubUser.avatar_url,
          role,
        })
        .returning();
      userId = newUser.id;
    }

    const sessionToken = generateSessionToken();
    const session = await createSession(sessionToken, userId);
    await setSessionTokenCookie(sessionToken, session.expiresAt);

    return new Response(null, {
      status: 302,
      headers: {
        Location: "/",
      },
    });
  } catch (e) {
    if (e instanceof OAuth2RequestError) {
      return new Response(null, {
        status: 400,
      });
    }
    console.error("GitHub OAuth error:", e);
    return new Response(null, {
      status: 500,
    });
  }
}

interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
}

interface GitHubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility: string | null;
}
