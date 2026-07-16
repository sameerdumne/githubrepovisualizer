import { createHmac, timingSafeEqual } from "crypto";

export interface GitHubSessionUser {
  id: number;
  login: string;
  name: string;
  email: string | null;
  avatarUrl: string;
  htmlUrl: string;
}

export interface GitHubSession {
  accessToken: string;
  user: GitHubSessionUser;
}

export const GITHUB_SESSION_COOKIE = "repoviz_github_session";
export const GITHUB_OAUTH_STATE_COOKIE = "repoviz_github_oauth_state";
export const GITHUB_OAUTH_RETURN_COOKIE = "repoviz_github_oauth_return";

function getSessionSecret() {
  const secret = process.env.AUTH_SECRET || process.env.GITHUB_CLIENT_SECRET;

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET is required in production.");
  }

  return "repoviz-local-development-secret";
}

function base64UrlEncode(value: string) {
  return Buffer.from(value).toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

export function encodeGitHubSession(session: GitHubSession) {
  const payload = base64UrlEncode(JSON.stringify(session));
  return `${payload}.${sign(payload)}`;
}

export function decodeGitHubSession(cookieValue?: string): GitHubSession | null {
  if (!cookieValue) {
    return null;
  }

  const [payload, signature] = cookieValue.split(".");
  if (!payload || !signature) {
    return null;
  }

  const expectedSignature = sign(payload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    return JSON.parse(base64UrlDecode(payload)) as GitHubSession;
  } catch {
    return null;
  }
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  };
}

export function getTransientCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  };
}
