export interface ParsedGitHubRepo {
  owner: string;
  repo: string;
  fullName: string;
  url: string;
}

export function parseGitHubRepoUrl(repoUrl: string): ParsedGitHubRepo {
  const trimmedUrl = repoUrl.trim();
  const match = trimmedUrl.match(/github\.com\/([^/\s]+)\/([^/\s?#]+)/i);

  if (!match) {
    throw new Error("Invalid GitHub URL format. Use: https://github.com/owner/repo");
  }

  const owner = match[1];
  const repo = match[2].replace(/\.git$/i, "");

  if (!owner || !repo) {
    throw new Error("Invalid GitHub URL format. Use: https://github.com/owner/repo");
  }

  return {
    owner,
    repo,
    fullName: `${owner}/${repo}`,
    url: `https://github.com/${owner}/${repo}`,
  };
}
