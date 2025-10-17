import { getCurrentSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const { user, session } = await getCurrentSession();
  
  if (!user || !session) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      role: user.role,
    },
  });
}
