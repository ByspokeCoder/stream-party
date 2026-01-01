import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { encrypt, createUserKey } from "@/lib/encryption";

// Helper function to get base URL without port
function getBaseUrl(request: NextRequest): string {
  // Use the host header first (most reliable for Codespaces)
  const host = request.headers.get("host");
  if (host) {
    // For Codespaces, the host might be like "miniature-waddle-vw4jvvqv776cxp7g-443.app.github.dev"
    // We need to keep the full hostname but ensure we use https
    // The port number (like -443) is part of the hostname in Codespaces, not a separate port
    return `https://${host}`;
  }
  
  // Fallback: extract from request URL
  const requestUrl = new URL(request.url);
  const protocol = requestUrl.protocol || "https:";
  const hostname = requestUrl.hostname;
  
  return `${protocol}//${hostname}`;
}

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

    // Get the base URL once (without port for Codespaces)
    const baseUrl = getBaseUrl(request);

    if (error) {
      return NextResponse.redirect(`${baseUrl}/dashboard?error=${encodeURIComponent(error)}`);
    }

    if (!code) {
      return NextResponse.json({ error: "No authorization code provided" }, { status: 400 });
    }

    const redirectUri = `${baseUrl}/api/youtube/oauth`;
    
    // Log for debugging
    console.log("OAuth callback received:", {
      baseUrl,
      redirectUri,
      hasCode: !!code,
      requestUrl: request.url,
      hostHeader: request.headers.get("host"),
      originHeader: request.headers.get("origin"),
    });

    // Use NEXT_PUBLIC_GOOGLE_CLIENT_ID for consistency (same value, accessible on server)
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error("Missing Google OAuth credentials:", {
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret,
      });
      return NextResponse.redirect(`${baseUrl}/dashboard?error=oauth_not_configured`);
    }

    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("Token exchange error:", {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorData,
        redirectUri,
        clientId: clientId ? `${clientId.substring(0, 10)}...` : 'missing',
      });
      return NextResponse.redirect(`${baseUrl}/dashboard?error=token_exchange_failed`);
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

    return NextResponse.redirect(`${baseUrl}/dashboard?youtube_connected=true`);
  } catch (error) {
    console.error("YouTube OAuth error:", error);
    const baseUrl = getBaseUrl(request);
    return NextResponse.redirect(`${baseUrl}/dashboard?error=oauth_failed`);
  }
}

