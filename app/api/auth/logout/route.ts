import { NextResponse } from "next/server";
import { GITHUB_SESSION_COOKIE } from "@/lib/auth/github-session";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(GITHUB_SESSION_COOKIE);
  return response;
}
