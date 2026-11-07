import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const stateRaw = searchParams.get("state");

  let next = "/account";
  try {
    if (stateRaw) {
      const parsed = JSON.parse(Buffer.from(stateRaw, "base64").toString("utf-8"));
      if (parsed.next) next = parsed.next;
    }
  } catch {
    // ignore
  }

  if (!code) {
    return NextResponse.redirect(new URL(`${next}?error=no_code`, request.url));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  const host = request.headers.get("host") || "localhost:3005";
  const protocol =
    request.headers.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  const redirectUri = `${protocol}://${host}/api/auth/google/callback`;

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId || "",
        client_secret: clientSecret || "",
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return NextResponse.redirect(new URL(`${next}?error=token_failed`, request.url));
    }

    const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userInfo = await userRes.json();

    const email = userInfo.email || "";
    const name = userInfo.name || "";
    const picture = userInfo.picture || "";

    const dest = new URL(next, request.url);
    dest.searchParams.set("auth_success", "1");
    dest.searchParams.set("email", email);
    dest.searchParams.set("name", name);
    if (picture) dest.searchParams.set("picture", picture);

    return NextResponse.redirect(dest.toString());
  } catch (err) {
    console.error("OAuth callback error:", err);
    return NextResponse.redirect(new URL(`${next}?error=oauth_exception`, request.url));
  }
}
