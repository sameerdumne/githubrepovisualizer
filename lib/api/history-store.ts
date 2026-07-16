import type { AnalysisResult, RepositoryData } from "@/lib/api/repository-analysis";
import { parseGitHubRepoUrl } from "@/lib/api/github-url";
import type { GitHubSessionUser } from "@/lib/auth/github-session";

export interface RepositoryAnalysisRecord {
  id: string;
  github_user_id: number;
  github_login: string;
  repo_url: string;
  repo_full_name: string;
  repo_data: RepositoryData;
  analysis_result: AnalysisResult;
  total_files: number;
  total_folders: number;
  max_depth: number;
  languages: Record<string, number>;
  created_at: string;
  updated_at: string;
}

export interface HistoryListItem {
  id: string;
  repoName: string;
  url: string;
  analyzedAt: string;
  totalFiles: number;
  totalFolders: number;
  maxDepth: number;
  languages: Record<string, number>;
}

function getSupabaseConfig() {
  const rawUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!rawUrl || !serviceRoleKey) {
    return null;
  }

  const parsedUrl = new URL(rawUrl);

  return {
    url: parsedUrl.origin,
    serviceRoleKey,
  };
}

export function isHistoryStoreConfigured() {
  return Boolean(getSupabaseConfig());
}

async function supabaseRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const config = getSupabaseConfig();

  if (!config) {
    throw new Error("Supabase history store is not configured.");
  }

  const response = await fetch(`${config.url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Supabase request failed (${response.status}): ${details}`);
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
}

function toHistoryListItem(record: RepositoryAnalysisRecord): HistoryListItem {
  return {
    id: record.id,
    repoName: record.repo_full_name,
    url: record.repo_url,
    analyzedAt: record.updated_at || record.created_at,
    totalFiles: record.total_files,
    totalFolders: record.total_folders,
    maxDepth: record.max_depth,
    languages: record.languages || {},
  };
}

export async function findSavedAnalysis(userId: number, repoUrl: string) {
  const repo = parseGitHubRepoUrl(repoUrl);
  const query = new URLSearchParams({
    select: "*",
    github_user_id: `eq.${userId}`,
    repo_full_name: `eq.${repo.fullName}`,
    limit: "1",
  });
  const records = await supabaseRequest<RepositoryAnalysisRecord[]>(`repository_analyses?${query}`);

  return records[0] || null;
}

export async function getSavedAnalysisById(userId: number, id: string) {
  const query = new URLSearchParams({
    select: "*",
    github_user_id: `eq.${userId}`,
    id: `eq.${id}`,
    limit: "1",
  });
  const records = await supabaseRequest<RepositoryAnalysisRecord[]>(`repository_analyses?${query}`);

  return records[0] || null;
}

export async function listSavedAnalyses(userId: number) {
  const query = new URLSearchParams({
    select: "id,repo_url,repo_full_name,total_files,total_folders,max_depth,languages,created_at,updated_at",
    github_user_id: `eq.${userId}`,
    order: "updated_at.desc",
    limit: "50",
  });
  const records = await supabaseRequest<RepositoryAnalysisRecord[]>(`repository_analyses?${query}`);

  return records.map(toHistoryListItem);
}

export async function saveAnalysis(params: {
  user: GitHubSessionUser;
  repoUrl: string;
  repoData: RepositoryData;
  analysisResult: AnalysisResult;
}) {
  const repo = parseGitHubRepoUrl(params.repoUrl);
  const existing = await findSavedAnalysis(params.user.id, repo.url);
  const payload = {
    github_user_id: params.user.id,
    github_login: params.user.login,
    repo_url: repo.url,
    repo_full_name: repo.fullName,
    repo_data: params.repoData,
    analysis_result: params.analysisResult,
    total_files: params.repoData.stats.totalFiles,
    total_folders: params.repoData.stats.totalFolders,
    max_depth: params.repoData.stats.maxDepth,
    languages: params.repoData.stats.languages,
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    const query = new URLSearchParams({ id: `eq.${existing.id}` });
    const records = await supabaseRequest<RepositoryAnalysisRecord[]>(
      `repository_analyses?${query}`,
      {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(payload),
      }
    );

    return records[0] || existing;
  }

  const records = await supabaseRequest<RepositoryAnalysisRecord[]>("repository_analyses", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(payload),
  });

  return records[0] || null;
}
