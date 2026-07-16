import { NextRequest, NextResponse } from 'next/server';
import { fetchRepositoryData, analyzeRepository } from '@/lib/api/repository-analysis';
import { parseGitHubRepoUrl } from '@/lib/api/github-url';
import { findSavedAnalysis, isHistoryStoreConfigured, saveAnalysis } from '@/lib/api/history-store';
import { decodeGitHubSession, GITHUB_SESSION_COOKIE } from '@/lib/auth/github-session';

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

    const session = decodeGitHubSession(request.cookies.get(GITHUB_SESSION_COOKIE)?.value);
    const repo = parseGitHubRepoUrl(repoUrl);
    console.log(`[API] Starting analysis for ${repo.url}`);

    if (session && isHistoryStoreConfigured()) {
      try {
        const savedAnalysis = await findSavedAnalysis(session.user.id, repo.url);

        if (savedAnalysis) {
          console.log(`[API] Returning cached analysis for ${repo.fullName}`);
          return NextResponse.json({
            repoData: savedAnalysis.repo_data,
            analysisResult: savedAnalysis.analysis_result,
            cached: true,
          });
        }
      } catch (error) {
        console.warn("[API] Could not read analysis history; continuing with fresh analysis", error);
      }
    }

    // Fetch repository data (this now has access to GITHUB_TOKEN)
    const repoData = await fetchRepositoryData(repo.url);
    console.log(`[API] Fetched ${repoData.files.length} files`);

    // Analyze repository with Gemini
    const analysisResult = await analyzeRepository(repoData);
    console.log(`[API] Analysis complete`);

    if (session && isHistoryStoreConfigured()) {
      try {
        await saveAnalysis({
          user: session.user,
          repoUrl: repo.url,
          repoData,
          analysisResult,
        });
        console.log(`[API] Saved analysis history for ${repo.fullName}`);
      } catch (error) {
        console.warn("[API] Could not save analysis history", error);
      }
    }

    return NextResponse.json({
      repoData,
      analysisResult,
      cached: false,
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
