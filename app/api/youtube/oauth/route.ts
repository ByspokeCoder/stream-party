import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { encrypt, createUserKey } from "@/lib/encryption";

// Helper function to get base URL without port
function getBaseUrl(request: NextRequest): string {
  const requestUrl = new URL(request.url);
  const hostname = requestUrl.hostname;
  const protocol = requestUrl.protocol || "https:";
  
  // If hostname is localhost, try to get from host header or referer
  // This handles cases where the request is proxied
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    // Check for Codespaces URL in referer or origin headers
    const referer = request.headers.get("referer");
    const origin = request.headers.get("origin");
    
    if (referer) {
      try {
        const refererUrl = new URL(referer);
        if (refererUrl.hostname.includes(".app.github.dev")) {
          return `https://${refererUrl.hostname}`;
        }
      } catch (e) {
        // Ignore URL parse errors
      }
    }
    
    if (origin && origin !== "null") {
      try {
        const originUrl = new URL(origin);
        if (originUrl.hostname.includes(".app.github.dev")) {
          return origin;
        }
      } catch (e) {
        // Ignore URL parse errors
      }
    }
    
    // Check host header for Codespaces domain
    const host = request.headers.get("host");
    if (host && host.includes(".app.github.dev")) {
      const hostWithoutPort = host.split(":")[0];
      return `https://${hostWithoutPort}`;
    }
  }
  
  // Use hostname from request URL (should be correct for OAuth callbacks from Google)
  // Remove port if present
  const hostnameWithoutPort = hostname.split(":")[0];
  return `${protocol}//${hostnameWithoutPort}`;
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

    // Extract base URL from the actual request URL (most reliable)
    const requestUrlObj = new URL(request.url);
    // Use hostname instead of host to avoid including port number
    const baseUrl = `${requestUrlObj.protocol}//${requestUrlObj.hostname}`;

    // Helper to create redirect URL
    const createRedirectUrl = (path: string, params?: Record<string, string>) => {
      const url = new URL(path, baseUrl);
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          url.searchParams.set(key, value);
        });
      }
      return url.toString();
    };

    if (error) {
      return NextResponse.redirect(createRedirectUrl("/dashboard", { error }));
    }

    if (!code) {
      return NextResponse.json({ error: "No authorization code provided" }, { status: 400 });
    }

    // Extract the redirect URI from the actual request URL
    // Google redirects back to the exact redirect_uri we sent, so use the request URL
    // Construct redirect_uri by removing the query parameters (code, scope, etc.)
    // Use hostname instead of host to avoid including port number
    const redirectUri = `${requestUrlObj.protocol}//${requestUrlObj.hostname}${requestUrlObj.pathname}`;
    
    // Log for debugging
    console.log("OAuth callback received:", {
      requestUrl: request.url,
      redirectUri,
      hostHeader: request.headers.get("host"),
      originHeader: request.headers.get("origin"),
      hasCode: !!code,
    });

    // Use NEXT_PUBLIC_GOOGLE_CLIENT_ID for consistency (same value, accessible on server)
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error("Missing Google OAuth credentials:", {
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret,
      });
      return NextResponse.redirect(createRedirectUrl("/dashboard", { error: "oauth_not_configured" }));
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
      return NextResponse.redirect(createRedirectUrl("/dashboard", { error: "token_exchange_failed" }));
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

    return NextResponse.redirect(createRedirectUrl("/dashboard", { youtube_connected: "true" }));
  } catch (error) {
    console.error("YouTube OAuth error:", error);
    const requestUrlObj = new URL(request.url);
    // Use hostname instead of host to avoid including port number
    const baseUrl = `${requestUrlObj.protocol}//${requestUrlObj.hostname}`;
    const createRedirectUrl = (path: string, params?: Record<string, string>) => {
      const url = new URL(path, baseUrl);
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          url.searchParams.set(key, value);
        });
      }
      return url.toString();
    };
    return NextResponse.redirect(createRedirectUrl("/dashboard", { error: "oauth_failed" }));
  }
}

