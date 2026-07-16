import { NextRequest, NextResponse } from "next/server";
import { decodeGitHubSession, GITHUB_SESSION_COOKIE } from "@/lib/auth/github-session";
import { getSavedAnalysisById, isHistoryStoreConfigured } from "@/lib/api/history-store";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const session = decodeGitHubSession(request.cookies.get(GITHUB_SESSION_COOKIE)?.value);

  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!isHistoryStoreConfigured()) {
    return NextResponse.json({ error: "Supabase history store is not configured" }, { status: 503 });
  }

  try {
    const { id } = await context.params;
    const record = await getSavedAnalysisById(session.user.id, id);

    if (!record) {
      return NextResponse.json({ error: "History item not found" }, { status: 404 });
    }

    return NextResponse.json({
      repoUrl: record.repo_url,
      repoData: record.repo_data,
      analysisResult: record.analysis_result,
      cached: true,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to load history item";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
