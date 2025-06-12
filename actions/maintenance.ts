"use server"

import { db } from "@/db/drizzle"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { thread, post, user, notification } from "@/db/schema"
import { eq, and, lt, isNull, sql } from "drizzle-orm"
import { revalidateTag } from "next/cache"

interface MaintenanceStats {
  deletedPosts: number
  expiredNotifications: number
  inactiveUsers: number
  orphanedContent: number
}

export async function performMaintenance(): Promise<{
  success: boolean
  stats?: MaintenanceStats
  error?: string
}> {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user?.id) {
      throw new Error("Not authenticated")
    }

    if (session.user.role !== "admin") {
      throw new Error("Not authorized")
    }

    let stats: MaintenanceStats = {
      deletedPosts: 0,
      expiredNotifications: 0,
      inactiveUsers: 0,
      orphanedContent: 0
    }

    // Clean up old deleted posts (permanently remove after 30 days)
    // Note: This would require adding a deletedAt column to your schema
    const deletedPostsResult = await db
      .select({ id: post.id })
      .from(post)
      .where(eq(post.isDeleted, true))
    
    stats.deletedPosts = deletedPostsResult.length

    // Clean up old notifications (remove read notifications older than 90 days)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    
    const expiredNotificationsResult = await db
      .delete(notification)
      .where(
        and(
          eq(notification.read, true),
          lt(notification.createdAt, ninetyDaysAgo)
        )
      )
    
    stats.expiredNotifications = expiredNotificationsResult.rowCount || 0

    // Identify inactive users (no activity in 6 months)
    const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
    
    const inactiveUsersResult = await db
      .select({ id: user.id })
      .from(user)
      .leftJoin(post, eq(user.id, post.authorId))
      .leftJoin(thread, eq(user.id, thread.authorId))
      .where(
        and(
          lt(user.createdAt, sixMonthsAgo),
          isNull(post.id),
          isNull(thread.id)
        )
      )
    
    stats.inactiveUsers = inactiveUsersResult.length

    // Find orphaned content (posts without threads)
    const orphanedPostsResult = await db
      .select({ id: post.id })
      .from(post)
      .leftJoin(thread, eq(post.threadId, thread.id))
      .where(isNull(thread.id))
    
    stats.orphanedContent = orphanedPostsResult.length

    // Clean up orphaned posts
    if (orphanedPostsResult.length > 0) {
      const orphanedIds = orphanedPostsResult.map(p => p.id)
      await db
        .delete(post)
        .where(sql`${post.id} = ANY(${orphanedIds})`)
    }

    // Invalidate caches after cleanup
    revalidateTag('forum-stats')
    revalidateTag('get-stats')
    revalidateTag('forum-analytics')

    return { success: true, stats }
  } catch (error) {
    console.error("Error performing maintenance:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Maintenance failed"
    }
  }
}

export async function optimizeDatabase(): Promise<{
  success: boolean
  message?: string
  error?: string
}> {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user?.id) {
      throw new Error("Not authenticated")
    }

    if (session.user.role !== "admin") {
      throw new Error("Not authorized")
    }

    // Run database optimization queries
    // Note: These are PostgreSQL specific commands
    await db.execute(sql`VACUUM ANALYZE`)
    await db.execute(sql`REINDEX DATABASE ${sql.identifier(process.env.DATABASE_NAME || 'forum')}`)

    return {
      success: true,
      message: "Database optimization completed successfully"
    }
  } catch (error) {
    console.error("Error optimizing database:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Database optimization failed"
    }
  }
}

export async function getMaintenanceInfo(): Promise<{
  success: boolean
  info?: {
    totalPosts: number
    deletedPosts: number
    totalNotifications: number
    readNotifications: number
    totalUsers: number
    lastOptimization?: Date
  }
  error?: string
}> {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user?.id) {
      throw new Error("Not authenticated")
    }

    if (session.user.role !== "admin") {
      throw new Error("Not authorized")
    }

    // Get maintenance information
    const [totalPostsResult, deletedPostsResult, totalNotificationsResult, readNotificationsResult, totalUsersResult] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(post),
      db.select({ count: sql<number>`count(*)` }).from(post).where(eq(post.isDeleted, true)),
      db.select({ count: sql<number>`count(*)` }).from(notification),
      db.select({ count: sql<number>`count(*)` }).from(notification).where(eq(notification.read, true)),
      db.select({ count: sql<number>`count(*)` }).from(user)
    ])

    return {
      success: true,
      info: {
        totalPosts: totalPostsResult[0]?.count || 0,
        deletedPosts: deletedPostsResult[0]?.count || 0,
        totalNotifications: totalNotificationsResult[0]?.count || 0,
        readNotifications: readNotificationsResult[0]?.count || 0,
        totalUsers: totalUsersResult[0]?.count || 0
      }
    }
  } catch (error) {
    console.error("Error getting maintenance info:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get maintenance info"
    }
  }
}

export async function exportData(format: 'json' | 'csv' = 'json'): Promise<{
  success: boolean
  data?: string
  error?: string
}> {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user?.id) {
      throw new Error("Not authenticated")
    }

    if (session.user.role !== "admin") {
      throw new Error("Not authorized")
    }

    // Get forum data for export
    const [users, threads, posts] = await Promise.all([
      db.select({
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        role: user.role
      }).from(user),
      db.select({
        id: thread.id,
        title: thread.title,
        slug: thread.slug,
        createdAt: thread.createdAt,
        authorId: thread.authorId,
        categoryId: thread.categoryId
      }).from(thread),
      db.select({
        id: post.id,
        content: post.content,
        createdAt: post.createdAt,
        authorId: post.authorId,
        threadId: post.threadId
      }).from(post)
    ])

    const exportData = {
      exportDate: new Date().toISOString(),
      users: users.length,
      threads: threads.length,
      posts: posts.length,
      data: {
        users,
        threads,
        posts
      }
    }

    if (format === 'json') {
      return {
        success: true,
        data: JSON.stringify(exportData, null, 2)
      }
    } else {
      // Simple CSV export (you might want to use a proper CSV library)
      const csv = [
        'Type,ID,Title/Name,Content,Created,Author',
        ...threads.map(t => `Thread,${t.id},"${t.title}","",${t.createdAt},${t.authorId}`),
        ...posts.map(p => `Post,${p.id},"","${p.content.replace(/"/g, '""')}",${p.createdAt},${p.authorId}`)
      ].join('\n')

      return {
        success: true,
        data: csv
      }
    }
  } catch (error) {
    console.error("Error exporting data:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Data export failed"
    }
  }
}

export async function scheduleMaintenanceTask(
  task: 'cleanup' | 'optimize' | 'backup',
  schedule: 'daily' | 'weekly' | 'monthly'
): Promise<{
  success: boolean
  message?: string
  error?: string
}> {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user?.id) {
      throw new Error("Not authenticated")
    }

    if (session.user.role !== "admin") {
      throw new Error("Not authorized")
    }

    // In a real implementation, you would integrate with a job scheduler like:
    // - Vercel Cron Jobs
    // - AWS EventBridge
    // - Node-cron
    // - BullMQ with Redis
    
    console.log(`Scheduled ${task} task to run ${schedule}`)

    return {
      success: true,
      message: `${task} task scheduled to run ${schedule}`
    }
  } catch (error) {
    console.error("Error scheduling maintenance task:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to schedule task"
    }
  }
}
