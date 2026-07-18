import { NextRequest, NextResponse } from "next/server";
import { getSharedAnalysis, isShareStoreConfigured } from "@/lib/api/share-store";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  if (!isShareStoreConfigured()) {
    return NextResponse.json({ error: "Share store is not configured" }, { status: 503 });
  }

  try {
    const { id } = await context.params;
    const record = await getSharedAnalysis(id);

    if (!record) {
      return NextResponse.json({ error: "Shared analysis not found" }, { status: 404 });
    }

    return NextResponse.json({
      repoUrl: record.repo_url,
      repoFullName: record.repo_full_name,
      analysisResult: record.analysis_result,
      repoData: record.repo_data,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to load shared analysis";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
