import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { encrypt, createUserKey } from "@/lib/encryption";

// Handle OAuth callback and store token
export async function GET(request: NextRequest) {
  try {
    const { userId, sessionId } = await auth();
    
    if (!userId || !sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(new URL(`/dashboard?error=${encodeURIComponent(error)}`, request.url));
    }

    if (!code) {
      return NextResponse.json({ error: "No authorization code provided" }, { status: 400 });
    }

    // Get the base URL from the request
    const baseUrl = request.headers.get("origin") || 
                   request.headers.get("referer")?.split("/").slice(0, 3).join("/") ||
                   `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    const redirectUri = `${baseUrl}/api/youtube/oauth`;

    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("Token exchange error:", errorData);
      return NextResponse.redirect(new URL("/dashboard?error=token_exchange_failed", request.url));
    }

    const tokens = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokens;

    // Create user-specific key from session
    const userKey = createUserKey(userId, sessionId);

    // Encrypt the tokens (store both access and refresh tokens)
    const tokenData = JSON.stringify({
      access_token,
      refresh_token,
      expires_at: Date.now() + (expires_in * 1000),
    });

    const encryptedToken = encrypt(tokenData, userKey);

    // Save to database
    await prisma.userIntegration.upsert({
      where: {
        userId_platform: {
          userId,
          platform: "youtube",
        },
      },
      update: {
        encryptedToken,
        updatedAt: new Date(),
      },
      create: {
        userId,
        platform: "youtube",
        encryptedToken,
      },
    });

    return NextResponse.redirect(new URL("/dashboard?youtube_connected=true", request.url));
  } catch (error) {
    console.error("YouTube OAuth error:", error);
    return NextResponse.redirect(new URL("/dashboard?error=oauth_failed", request.url));
  }
}

