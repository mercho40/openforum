"use server"

import { db } from "@/db/drizzle"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { notification } from "@/db/schema"
import { eq, and, desc } from "drizzle-orm"
import { count } from 'drizzle-orm'

// Get notifications for current user
export async function getNotifications(page = 1, perPage = 20) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user?.id) {
      throw new Error("Not authenticated")
    }

    const userId = session.user.id
    const offset = (page - 1) * perPage

    // Get notifications with pagination
    const notifications = await db.query.notification.findMany({
      where: eq(notification.userId, userId),
      orderBy: [desc(notification.createdAt)],
      offset,
      limit: perPage
    })

    // Get total notification count for pagination
    const totalCount = await db.select({
      count: count(),
    })
      .from(notification)
      .where(eq(notification.userId, userId))

    // Get unread count
    const unreadCount = await db.select({
      unreadCount: count(),
    })
      .from(notification)
      .where(
        and(
          eq(notification.userId, userId),
          eq(notification.read, false)
        )
      )

    return {
      success: true,
      notifications,
      unreadCount: Number(unreadCount),
      pagination: {
        total: Number(totalCount),
        page,
        perPage,
        totalPages: Math.ceil(Number(totalCount) / perPage)
      }
    }
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch notifications"
    }
  }
}

// Mark notification as read
export async function markNotificationAsRead(notificationId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user?.id) {
      throw new Error("Not authenticated")
    }

    const userId = session.user.id

    // Update notification
    await db.update(notification)
      .set({ read: true })
      .where(
        and(
          eq(notification.id, notificationId),
          eq(notification.userId, userId)
        )
      )

    revalidatePath('/notifications')

    return { success: true }
  } catch (error) {
    console.error("Error marking notification as read:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to mark notification as read"
    }
  }
}

// Mark all notifications as read
export async function markAllNotificationsAsRead() {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user?.id) {
      throw new Error("Not authenticated")
    }

    const userId = session.user.id

    // Update all notifications
    await db.update(notification)
      .set({ read: true })
      .where(
        and(
          eq(notification.userId, userId),
          eq(notification.read, false)
        )
      )

    revalidatePath('/notifications')

    return { success: true }
  } catch (error) {
    console.error("Error marking all notifications as read:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to mark all notifications as read"
    }
  }
}
