import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { db } from "@/db/drizzle"
import { thread, threadSubscription } from "@/db/schema"
import { eq, and } from "drizzle-orm"

export async function POST(request: NextRequest, { params }: { params: { categorySlug: string; threadSlug: string } }) {
  try {
    // Get the current user session
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const userId = session.user.id

    // Find thread by slug
    const threadData = await db.query.thread.findFirst({
      where: eq(thread.slug, params.threadSlug),
      columns: {
        id: true,
      },
    })

    if (!threadData) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 })
    }

    // Check if already subscribed
    const existingSubscription = await db.query.threadSubscription.findFirst({
      where: and(eq(threadSubscription.threadId, threadData.id), eq(threadSubscription.userId, userId)),
    })

    if (existingSubscription) {
      return NextResponse.json({ error: "Already subscribed" }, { status: 400 })
    }

    // Create subscription
    await db.insert(threadSubscription).values({
      threadId: threadData.id,
      userId,
      createdAt: new Date(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error subscribing to thread:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
