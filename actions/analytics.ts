"use server"

import { db } from "@/db/drizzle"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { thread, post, user, category } from "@/db/schema"
import { eq, and, gte, lte, desc, asc, sql, count } from "drizzle-orm"
import { unstable_cacheTag as cacheTag } from 'next/cache'
import { unstable_cacheLife as cacheLife } from 'next/cache'

interface DateRange {
  startDate: Date
  endDate: Date
}

interface AnalyticsData {
  totalUsers: number
  totalThreads: number
  totalPosts: number
  activeUsers: number
  topCategories: Array<{
    id: string
    name: string
    threadCount: number
    postCount: number
  }>
  userGrowth: Array<{
    date: string
    count: number
  }>
  threadActivity: Array<{
    date: string
    count: number
  }>
  topContributors: Array<{
    id: string
    name: string
    threadCount: number
    postCount: number
    reputation: number
  }>
}

export async function getAnalytics(range?: DateRange) {
  "use cache"
  cacheTag('forum-analytics')
  cacheLife("hours")
  
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

    const startDate = range?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
    const endDate = range?.endDate || new Date()

    // Get basic counts
    const [totalUsersResult, totalThreadsResult, totalPostsResult] = await Promise.all([
      db.select({ count: count() }).from(user),
      db.select({ count: count() }).from(thread),
      db.select({ count: count() }).from(post)
    ])

    // Get active users (users who posted in the last 30 days)
    const activeUsersResult = await db
      .select({ count: count() })
      .from(user)
      .innerJoin(post, eq(user.id, post.authorId))
      .where(gte(post.createdAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)))

    // Get top categories by activity
    const topCategoriesResult = await db
      .select({
        id: category.id,
        name: category.name,
        threadCount: count(thread.id),
      })
      .from(category)
      .leftJoin(thread, eq(category.id, thread.categoryId))
      .groupBy(category.id, category.name)
      .orderBy(desc(count(thread.id)))
      .limit(10)

    // Get user growth data (daily signups in the range)
    const userGrowthResult = await db
      .select({
        date: sql<string>`DATE(${user.createdAt})`,
        count: count()
      })
      .from(user)
      .where(and(
        gte(user.createdAt, startDate),
        lte(user.createdAt, endDate)
      ))
      .groupBy(sql`DATE(${user.createdAt})`)
      .orderBy(asc(sql`DATE(${user.createdAt})`))

    // Get thread activity (daily thread creation in the range)
    const threadActivityResult = await db
      .select({
        date: sql<string>`DATE(${thread.createdAt})`,
        count: count()
      })
      .from(thread)
      .where(and(
        gte(thread.createdAt, startDate),
        lte(thread.createdAt, endDate)
      ))
      .groupBy(sql`DATE(${thread.createdAt})`)
      .orderBy(asc(sql`DATE(${thread.createdAt})`))

    // Get top contributors
    const topContributorsResult = await db
      .select({
        id: user.id,
        name: user.name,
        reputation: user.reputation,
        threadCount: count(thread.id),
      })
      .from(user)
      .leftJoin(thread, eq(user.id, thread.authorId))
      .groupBy(user.id, user.name, user.reputation)
      .orderBy(desc(count(thread.id)))
      .limit(10)

    // Get post counts for top contributors
    const contributorPostCounts = await Promise.all(
      topContributorsResult.map(async (contributor) => {
        const postCountResult = await db
          .select({ count: count() })
          .from(post)
          .where(eq(post.authorId, contributor.id))
        
        return {
          ...contributor,
          postCount: postCountResult[0]?.count || 0
        }
      })
    )

    // Get post counts for top categories
    const categoryPostCounts = await Promise.all(
      topCategoriesResult.map(async (cat) => {
        const postCountResult = await db
          .select({ count: count() })
          .from(post)
          .innerJoin(thread, eq(post.threadId, thread.id))
          .where(eq(thread.categoryId, cat.id))
        
        return {
          ...cat,
          postCount: postCountResult[0]?.count || 0
        }
      })
    )

    const analytics: AnalyticsData = {
      totalUsers: totalUsersResult[0]?.count || 0,
      totalThreads: totalThreadsResult[0]?.count || 0,
      totalPosts: totalPostsResult[0]?.count || 0,
      activeUsers: activeUsersResult[0]?.count || 0,
      topCategories: categoryPostCounts,
      userGrowth: userGrowthResult,
      threadActivity: threadActivityResult,
      topContributors: contributorPostCounts
    }

    return { success: true, analytics }
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch analytics",
      analytics: null
    }
  }
}

export async function getEngagementMetrics() {
  "use cache"
  cacheTag('engagement-metrics')
  cacheLife("hours")
  
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

    // Average posts per thread
    const avgPostsPerThreadResult = await db
      .select({
        avg: sql<number>`AVG(${thread.replyCount})`
      })
      .from(thread)

    // Threads with no replies
    const threadsWithNoRepliesResult = await db
      .select({ count: count() })
      .from(thread)
      .where(eq(thread.replyCount, 0))

    // Most active hours (based on post creation time)
    const activeHoursResult = await db
      .select({
        hour: sql<number>`EXTRACT(HOUR FROM ${post.createdAt})`,
        count: count()
      })
      .from(post)
      .groupBy(sql`EXTRACT(HOUR FROM ${post.createdAt})`)
      .orderBy(desc(count()))

    // User retention (users who posted in the last week)
    const weeklyActiveResult = await db
      .select({ count: count() })
      .from(user)
      .innerJoin(post, eq(user.id, post.authorId))
      .where(gte(post.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)))

    const monthlyActiveResult = await db
      .select({ count: count() })
      .from(user)
      .innerJoin(post, eq(user.id, post.authorId))
      .where(gte(post.createdAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)))

    return {
      success: true,
      metrics: {
        avgPostsPerThread: avgPostsPerThreadResult[0]?.avg || 0,
        threadsWithNoReplies: threadsWithNoRepliesResult[0]?.count || 0,
        activeHours: activeHoursResult,
        weeklyActiveUsers: weeklyActiveResult[0]?.count || 0,
        monthlyActiveUsers: monthlyActiveResult[0]?.count || 0
      }
    }
  } catch (error) {
    console.error("Error fetching engagement metrics:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch engagement metrics",
      metrics: null
    }
  }
}

export async function trackUserAction(action: string, metadata?: Record<string, any>) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user?.id) {
      return // Don't throw error for tracking
    }

    // In a real implementation, you'd store this in an analytics table
    // For now, just log it
    console.log("User action tracked:", {
      userId: session.user.id,
      action,
      metadata,
      timestamp: new Date().toISOString()
    })

    return { success: true }
  } catch (error) {
    console.error("Error tracking user action:", error)
    return { success: false }
  }
}

export async function getContentMetrics() {
  "use cache"
  cacheTag('content-metrics')
  cacheLife("hours")
  
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

    // Average post length (character count)
    const avgPostLengthResult = await db
      .select({
        avg: sql<number>`AVG(LENGTH(${post.content}))`
      })
      .from(post)

    // Most used tags
    // This would require a proper tag relationship table
    // For now, return empty array
    const mostUsedTags: Array<{ name: string; count: number }> = []

    // Content creation by day of week
    const contentByDayResult = await db
      .select({
        dayOfWeek: sql<number>`EXTRACT(DOW FROM ${thread.createdAt})`,
        count: count()
      })
      .from(thread)
      .groupBy(sql`EXTRACT(DOW FROM ${thread.createdAt})`)
      .orderBy(asc(sql`EXTRACT(DOW FROM ${thread.createdAt})`))

    return {
      success: true,
      metrics: {
        avgPostLength: avgPostLengthResult[0]?.avg || 0,
        mostUsedTags,
        contentByDay: contentByDayResult
      }
    }
  } catch (error) {
    console.error("Error fetching content metrics:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch content metrics",
      metrics: null
    }
  }
}
