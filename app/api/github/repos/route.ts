import { NextRequest, NextResponse } from "next/server";
import { decodeGitHubSession, GITHUB_SESSION_COOKIE } from "@/lib/auth/github-session";

export interface GitHubRepositorySummary {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  htmlUrl: string;
  cloneUrl: string;
  language: string | null;
  stargazersCount: number;
  forksCount: number;
  updatedAt: string;
  private: boolean;
}

interface GitHubRepositoryResponse {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  clone_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  private: boolean;
}

export async function GET(request: NextRequest) {
  const session = decodeGitHubSession(request.cookies.get(GITHUB_SESSION_COOKIE)?.value);

  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const response = await fetch(
    "https://api.github.com/user/repos?visibility=public&affiliation=owner&sort=updated&per_page=100",
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${session.accessToken}`,
        "User-Agent": "RepoViz",
      },
    }
  );

  if (!response.ok) {
    const details = await response.text();
    return NextResponse.json(
      { error: "Failed to fetch GitHub repositories", details },
      { status: response.status }
    );
  }

  const repos = (await response.json()) as GitHubRepositoryResponse[];
  const publicRepos: GitHubRepositorySummary[] = repos
    .filter((repo) => !repo.private)
    .map((repo) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      htmlUrl: repo.html_url,
      cloneUrl: repo.clone_url,
      language: repo.language,
      stargazersCount: repo.stargazers_count,
      forksCount: repo.forks_count,
      updatedAt: repo.updated_at,
      private: repo.private,
    }));

  return NextResponse.json({ repos: publicRepos });
}
