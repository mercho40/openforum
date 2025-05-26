import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { db } from "@/db/drizzle"
import { thread, threadSubscription } from "@/db/schema"
import { eq, and } from "drizzle-orm"

export async function POST(request: NextRequest, { params }: { params: { categorySlug: string; threadSlug: string } }) {
  try {
    // Get the current user session
    const par = await params;
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const userId = session.user.id

    // Find thread by slug
    const threadData = await db.query.thread.findFirst({
      where: eq(thread.slug, par.threadSlug),
      columns: {
        id: true,
      },
    })

    if (!threadData) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 })
    }

    // Delete subscription
    await db
      .delete(threadSubscription)
      .where(and(eq(threadSubscription.threadId, threadData.id), eq(threadSubscription.userId, userId)))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error unsubscribing from thread:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
