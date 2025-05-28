"use server"

import { db } from "@/db/drizzle"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { threadSubscription, thread } from "@/db/schema"
import { eq, and } from "drizzle-orm"

// Subscribe to thread
export async function subscribeToThreadAction(threadId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user?.id) {
      throw new Error("Not authenticated")
    }

    const userId = session.user.id

    // Check if thread exists
    const threadData = await db.query.thread.findFirst({
      where: eq(thread.id, threadId),
      columns: {
        slug: true
      }
    })

    if (!threadData) {
      throw new Error("Thread not found")
    }

    // Check if already subscribed
    const existingSubscription = await db.query.threadSubscription.findFirst({
      where: and(
        eq(threadSubscription.threadId, threadId),
        eq(threadSubscription.userId, userId)
      )
    })

    if (!existingSubscription) {
      // Create new subscription
      await db.insert(threadSubscription)
        .values({
          threadId,
          userId,
          createdAt: new Date()
        })
    }

    // revalidatePath(`/threads/${threadData.slug}`)

    return { success: true }
  } catch (error) {
    console.error("Error subscribing to thread:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to subscribe to thread"
    }
  }
}

// Unsubscribe from thread
export async function unsubscribeFromThreadAction(threadId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user?.id) {
      throw new Error("Not authenticated")
    }

    const userId = session.user.id

    // Check if thread exists
    const threadData = await db.query.thread.findFirst({
      where: eq(thread.id, threadId),
      columns: {
        slug: true
      }
    })

    if (!threadData) {
      throw new Error("Thread not found")
    }

    // Delete subscription
    await db.delete(threadSubscription)
      .where(
        and(
          eq(threadSubscription.threadId, threadId),
          eq(threadSubscription.userId, userId)
        )
      )

    // revalidatePath(`/threads/${threadData.slug}`)

    return { success: true }
  } catch (error) {
    console.error("Error unsubscribing from thread:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to unsubscribe from thread"
    }
  }
}

// Check if user is subscribed to thread
export async function checkThreadSubscription(threadId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user?.id) {
      return { success: true, isSubscribed: false }
    }

    const userId = session.user.id

    // Check if subscription exists
    const existingSubscription = await db.query.threadSubscription.findFirst({
      where: and(
        eq(threadSubscription.threadId, threadId),
        eq(threadSubscription.userId, userId)
      )
    })

    return {
      success: true,
      isSubscribed: Boolean(existingSubscription)
    }
  } catch (error) {
    console.error("Error checking thread subscription:", error)
    return {
      success: false,
      isSubscribed: false,
      error: error instanceof Error ? error.message : "Failed to check subscription"
    }
  }
}
