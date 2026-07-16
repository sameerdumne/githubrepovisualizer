import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  GITHUB_OAUTH_RETURN_COOKIE,
  GITHUB_OAUTH_STATE_COOKIE,
  getAppOrigin,
  getTransientCookieOptions,
} from "@/lib/auth/github-session";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const origin = getAppOrigin(requestUrl.origin);

  if (requestUrl.origin !== origin) {
    return NextResponse.redirect(new URL(`${requestUrl.pathname}${requestUrl.search}`, origin));
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(new URL("/login?error=github_config", origin));
  }

  const requestedReturnTo = requestUrl.searchParams.get("returnTo") || "/login";
  const returnTo = requestedReturnTo.startsWith("/") && !requestedReturnTo.startsWith("//")
    ? requestedReturnTo
    : "/login";
  const state = randomBytes(24).toString("base64url");
  const redirectUri = `${origin}/api/auth/github/callback`;

  const githubUrl = new URL("https://github.com/login/oauth/authorize");
  githubUrl.searchParams.set("client_id", clientId);
  githubUrl.searchParams.set("redirect_uri", redirectUri);
  githubUrl.searchParams.set("scope", "read:user user:email");
  githubUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(githubUrl);
  response.cookies.set(GITHUB_OAUTH_STATE_COOKIE, state, getTransientCookieOptions());
  response.cookies.set(GITHUB_OAUTH_RETURN_COOKIE, returnTo, getTransientCookieOptions());

  return response;
}
