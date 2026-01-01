import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { decrypt, encrypt, createUserKey } from "@/lib/encryption";
import { google } from "googleapis";

// GET - Fetch YouTube subscriptions
export async function GET(request: NextRequest) {
  try {
    const { userId, sessionId } = await auth();
    
    if (!userId || !sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get YouTube integration
    const integration = await prisma.userIntegration.findUnique({
      where: {
        userId_platform: {
          userId,
          platform: "youtube",
        },
      },
    });

    if (!integration) {
      return NextResponse.json({ error: "YouTube not connected" }, { status: 404 });
    }

    // Create user-specific key from session
    const userKey = createUserKey(userId, sessionId);

    // Decrypt token
    let tokenData;
    try {
      const decryptedToken = decrypt(integration.encryptedToken, userKey);
      tokenData = JSON.parse(decryptedToken);
    } catch (error) {
      console.error("Decryption error:", error);
      return NextResponse.json({ error: "Failed to decrypt token. Please reconnect." }, { status: 401 });
    }

    // Check if token is expired and refresh if needed
    let accessToken = tokenData.access_token;
    if (Date.now() >= tokenData.expires_at) {
      // Token expired, refresh it
      if (!tokenData.refresh_token) {
        return NextResponse.json({ error: "Token expired. Please reconnect." }, { status: 401 });
      }

      try {
        const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            refresh_token: tokenData.refresh_token,
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID!,
            client_secret: process.env.GOOGLE_CLIENT_SECRET!,
            grant_type: "refresh_token",
          }),
        });

        if (!refreshResponse.ok) {
          return NextResponse.json({ error: "Token refresh failed. Please reconnect." }, { status: 401 });
        }

        const refreshedTokens = await refreshResponse.json();
        accessToken = refreshedTokens.access_token;
        
        // Update stored token
        const updatedTokenData = JSON.stringify({
          access_token: refreshedTokens.access_token,
          refresh_token: tokenData.refresh_token, // Keep original refresh token
          expires_at: Date.now() + (refreshedTokens.expires_in * 1000),
        });

        const encryptedToken = encrypt(updatedTokenData, userKey);
        await prisma.userIntegration.update({
          where: { id: integration.id },
          data: { encryptedToken },
        });
      } catch (error) {
        console.error("Token refresh error:", error);
        return NextResponse.json({ error: "Token refresh failed. Please reconnect." }, { status: 401 });
      }
    }

    // Fetch subscriptions using YouTube Data API v3
    const youtube = google.youtube({
      version: "v3",
      auth: accessToken,
    });

    const subscriptionsResponse = await youtube.subscriptions.list({
      part: ["snippet", "contentDetails"],
      mine: true,
      maxResults: 50,
    });

    const subscriptions = subscriptionsResponse.data.items || [];

    // Format subscription data (only metadata, no video content)
    const formattedSubscriptions = subscriptions.map((sub) => ({
      id: sub.id,
      channelId: sub.snippet?.resourceId?.channelId,
      title: sub.snippet?.title,
      description: sub.snippet?.description,
      thumbnail: sub.snippet?.thumbnails?.default?.url,
      publishedAt: sub.snippet?.publishedAt,
    }));

    return NextResponse.json({ subscriptions: formattedSubscriptions });
  } catch (error: any) {
    console.error("Error fetching YouTube subscriptions:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      stack: error.stack,
    });
    
    // Handle specific YouTube API errors
    if (error.response?.status === 401) {
      return NextResponse.json({ error: "Token expired or invalid. Please reconnect." }, { status: 401 });
    }
    
    if (error.response?.status === 403) {
      return NextResponse.json({ error: "YouTube API access denied. Please check API permissions." }, { status: 403 });
    }
    
    return NextResponse.json(
      { error: error.message || "Failed to fetch subscriptions" },
      { status: 500 }
    );
  }
}

