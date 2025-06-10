"use server"

import { db } from "@/db/drizzle"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { thread, post, user, vote } from "@/db/schema"
import { eq, and, sql, desc, count } from "drizzle-orm"
import { unstable_cacheTag as cacheTag } from 'next/cache'
import { unstable_cacheLife as cacheLife } from 'next/cache'
import { revalidateTag } from 'next/cache'

// Helper function for stats-related cache invalidation
function invalidateStatsCaches(options: {
  userId?: string
  operation: 'user_activity' | 'forum_activity'
}) {
  const { userId, operation } = options
  
  if (operation === 'user_activity' && userId) {
    // Invalidate user-specific stats
    revalidateTag(`user-stats-${userId}`)
    revalidateTag('user-stats')
  }
  
  if (operation === 'forum_activity') {
    // Invalidate forum-wide stats
    revalidateTag('forum-stats')
    revalidateTag('get-stats')
  }
}

export async function getUserStats(userId?: string) {
  "use cache"
  
  // Create specific cache tags based on userId
  if (userId) {
    cacheTag(`user-stats-${userId}`)
  } else {
    cacheTag('user-stats')
  }
  
  cacheLife("minutes")
  
  try {
    // If no userId provided, get from session
    if (!userId) {
      const session = await auth.api.getSession({
        headers: await headers()
      })
      
      if (!session?.user?.id) {
        return null
      }
      
      userId = session.user.id
    }

    // Get thread count
    const threadCountResult = await db
      .select({ count: count() })
      .from(thread)
      .where(and(
        eq(thread.authorId, userId),
        eq(thread.isHidden, false)
      ))

    // Get post count (excluding the original posts that are part of thread creation)
    const postCountResult = await db
      .select({ count: count() })
      .from(post)
      .where(and(
        eq(post.authorId, userId),
        eq(post.isDeleted, false),
        eq(post.isHidden, false)
      ))

    // Get user reputation
    const userResult = await db
      .select({ reputation: user.reputation })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1)

    // Get reactions received (upvotes on user's posts)
    const reactionsResult = await db
      .select({ count: count() })
      .from(vote)
      .innerJoin(post, eq(vote.postId, post.id))
      .where(and(
        eq(post.authorId, userId),
        eq(vote.value, 1) // Only count upvotes
      ))

    return {
      threadCount: threadCountResult[0]?.count || 0,
      postCount: postCountResult[0]?.count || 0,
      reputation: userResult[0]?.reputation || 0,
      reactionsReceived: reactionsResult[0]?.count || 0,
    }
  } catch (error) {
    console.error("Error fetching user stats:", error)
    return null
  }
}

export async function getForumStats() {
  "use cache"
  cacheTag('forum-stats')
  cacheLife("hours")
  
  try {
    // Get total threads
    const threadCountResult = await db
      .select({ count: count() })
      .from(thread)
      .where(eq(thread.isHidden, false))

    // Get total posts
    const postCountResult = await db
      .select({ count: count() })
      .from(post)
      .where(and(
        eq(post.isDeleted, false),
        eq(post.isHidden, false)
      ))

    // Get total members
    const memberCountResult = await db
      .select({ count: count() })
      .from(user)

    // Get newest member
    const newestMemberResult = await db
      .select({
        id: user.id,
        name: user.name,
        username: user.username,
        displayUsername: user.displayUsername,
      })
      .from(user)
      .orderBy(desc(user.createdAt))
      .limit(1)

    return {
      totalThreads: threadCountResult[0]?.count || 0,
      totalPosts: postCountResult[0]?.count || 0,
      totalMembers: memberCountResult[0]?.count || 0,
      newestMember: newestMemberResult[0] || null,
    }
  } catch (error) {
    console.error("Error fetching forum stats:", error)
    return {
      totalThreads: 0,
      totalPosts: 0,
      totalMembers: 0,
      newestMember: null,
    }
  }
}