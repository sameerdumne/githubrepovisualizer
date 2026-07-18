import type { AnalysisResult, RepositoryData } from "@/lib/api/repository-analysis";

export interface SharedAnalysisRecord {
  id: string;
  repo_url: string;
  repo_full_name: string;
  analysis_result: AnalysisResult;
  repo_data: RepositoryData;
  created_at: string;
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

export function isShareStoreConfigured() {
  return Boolean(getSupabaseConfig());
}

async function supabaseRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const config = getSupabaseConfig();

  if (!config) {
    throw new Error("Supabase share store is not configured.");
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

export async function createShare(params: {
  repoUrl: string;
  repoFullName: string;
  analysisResult: AnalysisResult;
  repoData: RepositoryData;
}): Promise<SharedAnalysisRecord | null> {
  const payload = {
    repo_url: params.repoUrl,
    repo_full_name: params.repoFullName,
    analysis_result: params.analysisResult,
    repo_data: params.repoData,
  };

  const records = await supabaseRequest<SharedAnalysisRecord[]>("shared_analyses", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(payload),
  });

  return records[0] || null;
}

export async function getSharedAnalysis(id: string): Promise<SharedAnalysisRecord | null> {
  const query = new URLSearchParams({
    select: "*",
    id: `eq.${id}`,
    limit: "1",
  });

  const records = await supabaseRequest<SharedAnalysisRecord[]>(`shared_analyses?${query}`);

  return records[0] || null;
}
