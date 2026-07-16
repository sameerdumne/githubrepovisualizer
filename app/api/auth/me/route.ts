import { NextRequest, NextResponse } from "next/server";
import { decodeGitHubSession, GITHUB_SESSION_COOKIE } from "@/lib/auth/github-session";

export async function GET(request: NextRequest) {
  const session = decodeGitHubSession(request.cookies.get(GITHUB_SESSION_COOKIE)?.value);

  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({ user: session.user });
}
