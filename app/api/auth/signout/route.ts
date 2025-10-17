import { getCurrentSession, invalidateSession, deleteSessionTokenCookie } from "@/lib/auth";

export async function POST(): Promise<Response> {
  const { session } = await getCurrentSession();
  if (!session) {
    return new Response(null, {
      status: 401,
    });
  }

  await invalidateSession(session.id);
  await deleteSessionTokenCookie();

  return new Response(null, {
    status: 302,
    headers: {
      Location: "/",
    },
  });
}
