import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// POST - Toggle subscription selection
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { subscriptionId, selected } = body;

    if (!subscriptionId || typeof selected !== "boolean") {
      return NextResponse.json(
        { error: "subscriptionId and selected (boolean) are required" },
        { status: 400 }
      );
    }

    // Upsert the selection
    const selection = await prisma.selectedSubscription.upsert({
      where: {
        userId_platform_subscriptionId: {
          userId,
          platform: "youtube",
          subscriptionId,
        },
      },
      update: {
        selected,
        updatedAt: new Date(),
      },
      create: {
        userId,
        platform: "youtube",
        subscriptionId,
        selected,
      },
    });

    return NextResponse.json({ success: true, selection });
  } catch (error) {
    console.error("Error updating subscription selection:", error);
    return NextResponse.json(
      { error: "Failed to update selection" },
      { status: 500 }
    );
  }
}

// GET - Get all selected subscriptions for user
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const selections = await prisma.selectedSubscription.findMany({
      where: {
        userId,
        platform: "youtube",
      },
    });

    // Return as a map for easy lookup
    const selectionMap: Record<string, boolean> = {};
    selections.forEach((sel) => {
      selectionMap[sel.subscriptionId] = sel.selected;
    });

    return NextResponse.json({ selections: selectionMap });
  } catch (error) {
    console.error("Error fetching subscription selections:", error);
    return NextResponse.json(
      { error: "Failed to fetch selections" },
      { status: 500 }
    );
  }
}

