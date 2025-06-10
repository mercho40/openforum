"use server"

import { db } from "@/db/drizzle"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { notification } from "@/db/schema"
import { eq, and, desc } from "drizzle-orm"
import { count } from 'drizzle-orm'
import { revalidateTag } from 'next/cache'
import { unstable_cacheTag as cacheTag } from 'next/cache'
import { unstable_cacheLife as cacheLife } from 'next/cache'

// Helper function for notification-related cache invalidation
function invalidateNotificationCaches(options: {
  userId?: string
  notificationId?: string
  operation: 'read' | 'mark_all_read' | 'delete'
}) {
  const { userId, notificationId, operation } = options
  
  // Invalidate user-specific notification caches
  if (userId) {
    revalidateTag(`user-notifications-${userId}`)
    revalidateTag(`user-unread-count-${userId}`)
  }
  
  // Invalidate specific notification cache
  if (notificationId) {
    revalidateTag(`notification-${notificationId}`)
  }
  
  // General notification caches
  revalidateTag('user-notifications')
}

// Get notifications for current user
export async function getNotifications(page = 1, perPage = 20) {
  "use cache"
  
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user?.id) {
      throw new Error("Not authenticated")
    }

    const userId = session.user.id
    
    // Create user-specific cache tags
    cacheTag(`user-notifications-${userId}`)
    cacheTag(`user-notifications-page-${page}`)
    cacheLife("minutes")
    
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

    // Invalidate caches
    invalidateNotificationCaches({
      userId,
      notificationId,
      operation: 'read'
    })

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

    // Invalidate caches
    invalidateNotificationCaches({
      userId,
      operation: 'mark_all_read'
    })

    return { success: true }
  } catch (error) {
    console.error("Error marking all notifications as read:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to mark all notifications as read"
    }
  }
}
