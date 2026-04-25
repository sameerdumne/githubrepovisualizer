import { NextRequest, NextResponse } from 'next/server';
import { fetchRepositoryData, analyzeRepository } from '@/lib/api/repository-analysis';

export const maxDuration = 300; // 5 minutes timeout (300 seconds)

export async function POST(request: NextRequest) {
  try {
    const { repoUrl } = await request.json();

    if (!repoUrl) {
      return NextResponse.json(
        { error: 'Repository URL is required' },
        { status: 400 }
      );
    }

    console.log(`[API] Starting analysis for ${repoUrl}`);

    // Fetch repository data (this now has access to GITHUB_TOKEN)
    const repoData = await fetchRepositoryData(repoUrl);
    console.log(`[API] Fetched ${repoData.files.length} files`);

    // Analyze repository with Gemini
    const analysisResult = await analyzeRepository(repoData);
    console.log(`[API] Analysis complete`);

    return NextResponse.json({
      repoData,
      analysisResult,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to analyze repository';
    console.error('API Error:', error);
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
