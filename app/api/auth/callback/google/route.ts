import { google, createSession, generateSessionToken, setSessionTokenCookie, isAdminEmail } from "@/lib/auth";
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
  const storedState = cookieStore.get("google_oauth_state")?.value ?? null;
  const codeVerifier = cookieStore.get("google_code_verifier")?.value ?? null;

  if (!code || !state || !storedState || state !== storedState || !codeVerifier) {
    return new Response(null, {
      status: 400,
    });
  }

  try {
    const tokens = await google.validateAuthorizationCode(code, codeVerifier);
    const googleUserResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: {
        Authorization: `Bearer ${tokens.accessToken()}`,
      },
    });
    const googleUser: GoogleUser = await googleUserResponse.json();

    if (!googleUser.email) {
      return new Response("No email found", { status: 400 });
    }

    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(or(eq(users.googleId, googleUser.sub), eq(users.email, googleUser.email)))
      .limit(1);

    let userId: string;
    const role = isAdminEmail(googleUser.email) ? 'admin' : 'user';

    if (existingUser.length > 0) {
      // Update existing user
      userId = existingUser[0].id;
      await db
        .update(users)
        .set({
          googleId: googleUser.sub,
          name: googleUser.name,
          avatarUrl: googleUser.picture,
          role,
        })
        .where(eq(users.id, userId));
    } else {
      // Create new user
      const [newUser] = await db
        .insert(users)
        .values({
          googleId: googleUser.sub,
          email: googleUser.email,
          name: googleUser.name,
          avatarUrl: googleUser.picture,
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
    console.error("Google OAuth error:", e);
    return new Response(null, {
      status: 500,
    });
  }
}

interface GoogleUser {
  sub: string;
  name: string;
  email: string;
  picture: string;
  email_verified: boolean;
}
