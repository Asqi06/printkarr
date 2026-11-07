import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const next = searchParams.get("next") || "/account";

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(new URL("/account?error=missing_client_id", request.url));
  }

  const host = request.headers.get("host") || "localhost:3005";
  const protocol =
    request.headers.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  const redirectUri = `${protocol}://${host}/api/auth/google/callback`;

  const state = Buffer.from(
    JSON.stringify({ next, nonce: Math.random().toString(36).substring(2) })
  ).toString("base64");

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("prompt", "select_account");

  return NextResponse.redirect(authUrl.toString());
}
