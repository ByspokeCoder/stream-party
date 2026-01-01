import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { encrypt, decrypt, createUserKey } from "@/lib/encryption";

// GET - Retrieve user's integrations (decrypted)
export async function GET(request: NextRequest) {
  try {
    const { userId, sessionId } = await auth();
    
    if (!userId || !sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create user-specific key from session ID
    // This ensures tokens can only be decrypted during active sessions
    const userKey = createUserKey(userId, sessionId);

    // Fetch integrations from database
    const integrations = await prisma.userIntegration.findMany({
      where: { userId },
      select: {
        id: true,
        platform: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Decrypt tokens for each integration
    const decryptedIntegrations = await Promise.all(
      integrations.map(async (integration) => {
        const fullIntegration = await prisma.userIntegration.findUnique({
          where: { id: integration.id },
        });

        if (!fullIntegration) return null;

        try {
          const decryptedToken = decrypt(fullIntegration.encryptedToken, userKey);
          return {
            ...integration,
            token: decryptedToken, // Only available during user session
          };
        } catch (error) {
          console.error("Decryption error:", error);
          return {
            ...integration,
            token: null,
            error: "Failed to decrypt token",
          };
        }
      })
    );

    return NextResponse.json({ integrations: decryptedIntegrations.filter(Boolean) });
  } catch (error) {
    console.error("Error fetching integrations:", error);
    return NextResponse.json(
      { error: "Failed to fetch integrations" },
      { status: 500 }
    );
  }
}

// POST - Save a new integration (encrypted)
export async function POST(request: NextRequest) {
  try {
    const { userId, sessionId } = await auth();
    
    if (!userId || !sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { platform, token } = body;

    if (!platform || !token) {
      return NextResponse.json(
        { error: "Platform and token are required" },
        { status: 400 }
      );
    }

    // Create user-specific key from session ID
    // This ensures tokens can only be decrypted during active sessions
    const userKey = createUserKey(userId, sessionId);

    // Encrypt the token
    const encryptedToken = encrypt(token, userKey);

    // Save to database
    const integration = await prisma.userIntegration.upsert({
      where: {
        userId_platform: {
          userId,
          platform,
        },
      },
      update: {
        encryptedToken,
        updatedAt: new Date(),
      },
      create: {
        userId,
        platform,
        encryptedToken,
      },
    });

    return NextResponse.json({
      success: true,
      integration: {
        id: integration.id,
        platform: integration.platform,
        createdAt: integration.createdAt,
      },
    });
  } catch (error) {
    console.error("Error saving integration:", error);
    return NextResponse.json(
      { error: "Failed to save integration" },
      { status: 500 }
    );
  }
}

// DELETE - Remove an integration
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const body = await request.json().catch(() => ({}));
    const platform = body.platform;

    // Support deletion by ID or platform
    if (id) {
      // Verify the integration belongs to the user
      const integration = await prisma.userIntegration.findUnique({
        where: { id },
      });

      if (!integration || integration.userId !== userId) {
        return NextResponse.json({ error: "Integration not found" }, { status: 404 });
      }

      await prisma.userIntegration.delete({
        where: { id },
      });
    } else if (platform) {
      // Delete by platform
      await prisma.userIntegration.deleteMany({
        where: {
          userId,
          platform,
        },
      });
    } else {
      return NextResponse.json({ error: "Integration ID or platform is required" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting integration:", error);
    return NextResponse.json(
      { error: "Failed to delete integration" },
      { status: 500 }
    );
  }
}

