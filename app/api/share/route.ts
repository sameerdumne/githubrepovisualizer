import { NextRequest, NextResponse } from "next/server";
import { createShare, isShareStoreConfigured } from "@/lib/api/share-store";
import { parseGitHubRepoUrl } from "@/lib/api/github-url";
import type { AnalysisResult, RepositoryData } from "@/lib/api/repository-analysis";

export async function POST(request: NextRequest) {
  if (!isShareStoreConfigured()) {
    return NextResponse.json({ error: "Share store is not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { repoUrl, repoData, analysisResult } = body as {
      repoUrl: string;
      repoData: RepositoryData;
      analysisResult: AnalysisResult;
    };

    if (!repoUrl || !repoData || !analysisResult) {
      return NextResponse.json({ error: "repoUrl, repoData, and analysisResult are required" }, { status: 400 });
    }

    const repo = parseGitHubRepoUrl(repoUrl);

    const record = await createShare({
      repoUrl: repo.url,
      repoFullName: repo.fullName,
      analysisResult,
      repoData,
    });

    if (!record) {
      return NextResponse.json({ error: "Failed to create share" }, { status: 500 });
    }

    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    return NextResponse.json({
      shareId: record.id,
      shareUrl: `${origin}/shared/${record.id}`,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to create share";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
