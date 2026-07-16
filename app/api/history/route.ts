import { NextRequest, NextResponse } from "next/server";
import { decodeGitHubSession, GITHUB_SESSION_COOKIE } from "@/lib/auth/github-session";
import { isHistoryStoreConfigured, listSavedAnalyses } from "@/lib/api/history-store";

export async function GET(request: NextRequest) {
  const session = decodeGitHubSession(request.cookies.get(GITHUB_SESSION_COOKIE)?.value);

  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!isHistoryStoreConfigured()) {
    return NextResponse.json({ error: "Supabase history store is not configured" }, { status: 503 });
  }

  try {
    const items = await listSavedAnalyses(session.user.id);
    return NextResponse.json({ items });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to load history";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
