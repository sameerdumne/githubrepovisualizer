import { NextRequest, NextResponse } from "next/server";
import {
  encodeGitHubSession,
  GITHUB_OAUTH_RETURN_COOKIE,
  GITHUB_OAUTH_STATE_COOKIE,
  GITHUB_SESSION_COOKIE,
  getAppOrigin,
  getSessionCookieOptions,
  type GitHubSessionUser,
} from "@/lib/auth/github-session";

interface GitHubTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface GitHubUserResponse {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
  html_url: string;
}

interface GitHubEmailResponse {
  email: string;
  primary: boolean;
  verified: boolean;
}

async function fetchPrimaryEmail(accessToken: string) {
  const response = await fetch("https://api.github.com/user/emails", {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": "RepoViz",
    },
  });

  if (!response.ok) {
    return null;
  }

  const emails = (await response.json()) as GitHubEmailResponse[];
  return emails.find((email) => email.primary && email.verified)?.email || null;
}

export async function GET(request: NextRequest) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const requestUrl = new URL(request.url);
  const origin = getAppOrigin(requestUrl.origin);
  const fallbackUrl = new URL("/login?error=github_config", origin);

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(fallbackUrl);
  }

  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const expectedState = request.cookies.get(GITHUB_OAUTH_STATE_COOKIE)?.value;
  const returnTo = request.cookies.get(GITHUB_OAUTH_RETURN_COOKIE)?.value || "/login";

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(new URL("/login?error=oauth_state", origin));
  }

  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": "RepoViz",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: `${origin}/api/auth/github/callback`,
      state,
    }),
  });

  const tokenData = (await tokenResponse.json()) as GitHubTokenResponse;
  if (!tokenResponse.ok || !tokenData.access_token) {
    const errorUrl = new URL("/login?error=oauth_exchange", origin);
    return NextResponse.redirect(errorUrl);
  }

  const userResponse = await fetch("https://api.github.com/user", {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${tokenData.access_token}`,
      "User-Agent": "RepoViz",
    },
  });

  if (!userResponse.ok) {
    return NextResponse.redirect(new URL("/login?error=github_user", origin));
  }

  const githubUser = (await userResponse.json()) as GitHubUserResponse;
  const email = githubUser.email || (await fetchPrimaryEmail(tokenData.access_token));
  const user: GitHubSessionUser = {
    id: githubUser.id,
    login: githubUser.login,
    name: githubUser.name || githubUser.login,
    email,
    avatarUrl: githubUser.avatar_url,
    htmlUrl: githubUser.html_url,
  };

  const response = NextResponse.redirect(new URL(returnTo, origin));
  response.cookies.set(
    GITHUB_SESSION_COOKIE,
    encodeGitHubSession({ accessToken: tokenData.access_token, user }),
    getSessionCookieOptions()
  );
  response.cookies.delete(GITHUB_OAUTH_STATE_COOKIE);
  response.cookies.delete(GITHUB_OAUTH_RETURN_COOKIE);

  return response;
}
