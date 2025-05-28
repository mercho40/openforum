"use server"

import { db } from "@/db/drizzle"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { thread, post, threadTag, tag, category, user } from "@/db/schema"
import { eq, and, desc, sql, asc, inArray } from "drizzle-orm"
import { nanoid } from "nanoid"
import { slugify } from "@/lib/utils" // You'll need to create this utility
import { unstable_cacheTag as cacheTag } from 'next/cache'
import { unstable_cacheLife as cacheLife } from 'next/cache'
import { revalidateTag } from 'next/cache'

interface ThreadCreateData {
  title: string
  content: string
  categoryId: string
  tags?: string[]
}

interface ThreadUpdateData {
  title?: string
  categoryId?: string
  isPinned?: boolean
  isLocked?: boolean
  isHidden?: boolean
}

// Create a new thread with initial post
export async function createThread(data: ThreadCreateData) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user?.id) {
      throw new Error("Not authenticated")
    }

    const authorId = session.user.id
    const slug = slugify(data.title)

    return await db.transaction(async (tx) => {
      // Create thread
      const [threadResult] = await tx.insert(thread)
        .values({
          title: data.title,
          slug,
          categoryId: data.categoryId,
          authorId,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastPostAt: new Date(),
        })
        .returning({ id: thread.id })

      const threadId = threadResult.id

      // Create initial post
      const [postResult] = await tx.insert(post)
        .values({
          content: data.content,
          threadId,
          authorId,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning({ id: post.id })

      // Update thread with last post ID
      await tx.update(thread)
        .set({
          lastPostId: postResult.id,
          replyCount: 0
        })
        .where(eq(thread.id, threadId))

      // Add tags if provided
      if (data.tags && data.tags.length > 0) {
        // Only add tags that exist in the tag table
        const existingTags = await tx
          .select({ id: tag.id })
          .from(tag)
          .where(inArray(tag.id, data.tags))

        const existingTagIds = existingTags.map(t => t.id)

        if (existingTagIds.length > 0) {
          const tagValues = existingTagIds.map(tagId => ({
            threadId,
            tagId
          }))

          await tx.insert(threadTag).values(tagValues)
        }
      }

      revalidateTag('get-threads')
      return {
        success: true,
        threadId,
        slug
      }
    })
  } catch (error) {
    console.error("Error creating thread:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create thread"
    }
  }
}

// Update thread
export async function updateThread(threadId: string, data: ThreadUpdateData) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user?.id) {
      throw new Error("Not authenticated")
    }

    // Check if user is thread author or admin
    const threadData = await db.query.thread.findFirst({
      where: eq(thread.id, threadId),
      columns: {
        authorId: true
      }
    })

    if (!threadData) {
      throw new Error("Thread not found")
    }

    // Only allow author or admin to update
    const isAdmin = session.user.role === "admin"
    if (threadData.authorId !== session.user.id && !isAdmin) {
      throw new Error("Not authorized to update this thread")
    }

    // Filter out undefined values
    const updatableData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined)
    )

    // Update title creates new slug
    let updateValues: any = {
      ...updatableData,
      updatedAt: new Date()
    }

    if (data.title) {
      updateValues.slug = slugify(data.title) // Changed from createSlug to slugify
    }

    await db.update(thread)
      .set(updateValues)
      .where(eq(thread.id, threadId))

    // revalidatePath('/threads/[slug]')
    // revalidatePath('/categories/[slug]')
    revalidateTag('get-threads')

    return {
      success: true,
      slug: updateValues.slug
    }
  } catch (error) {
    console.error("Error updating thread:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update thread"
    }
  }
}
// Delete thread
export async function deleteThread(threadId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user?.id) {
      throw new Error("Not authenticated")
    }

    // Check if user is thread author or admin
    const threadData = await db.query.thread.findFirst({
      where: eq(thread.id, threadId),
      columns: {
        authorId: true,
        categoryId: true
      }
    })

    if (!threadData) {
      throw new Error("Thread not found")
    }

    // Only allow author or admin to delete
    const isAdmin = session.user.role === "admin"
    if (threadData.authorId !== session.user.id && !isAdmin) {
      throw new Error("Not authorized to delete this thread")
    }

    // Delete thread (will cascade to posts and threadTags)
    await db.delete(thread).where(eq(thread.id, threadId))

    // revalidatePath('/categories/[slug]')

    revalidateTag('get-threads')
    return { success: true }
  } catch (error) {
    console.error("Error deleting thread:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete thread"
    }
  }
}

// Get thread details with posts
export async function getThreadWithPosts(slug: string, page = 1, perPage = 20) {
  "use cache"
  cacheTag('get-threads')
  cacheLife("hours")
  try {
    // Get thread by slug
    const threadData = await db.query.thread.findFirst({
      where: eq(thread.slug, slug),
      with: {
        author: {
          columns: {
            id: true,
            name: true,
            username: true,
            displayUsername: true,
            image: true,
            bio: true,
            signature: true,
            reputation: true
          }
        },
        category: true,
        tags: {
          with: {
            tag: true
          }
        }
      }
    })

    if (!threadData) {
      throw new Error("Thread not found")
    }

    // Get posts for thread with pagination
    const offset = (page - 1) * perPage

    const posts = await db.query.post.findMany({
      where: eq(post.threadId, threadData.id),
      with: {
        author: {
          columns: {
            id: true,
            name: true,
            username: true,
            displayUsername: true,
            image: true,
            bio: true,
            signature: true,
            reputation: true
          }
        },
        votes: true
      },
      orderBy: [asc(post.createdAt)],
      offset,
      limit: perPage
    })

    // Increment view count
    await db.update(thread)
      .set({
        viewCount: sql`${thread.viewCount} + 1`
      })
      .where(eq(thread.id, threadData.id))

    // Get total post count for pagination
    const [{ count }] = await db.select({
      count: sql<number>`count(*)`,
    })
      .from(post)
      .where(eq(post.threadId, threadData.id))

    return {
      success: true,
      thread: threadData,
      posts,
      pagination: {
        total: count,
        page,
        perPage,
        totalPages: Math.ceil(count / perPage)
      }
    }
  } catch (error) {
    console.error("Error fetching thread:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch thread"
    }
  }
}

// Get recent and trending threads for the home page
export async function getHomePageThreads() {
  "use cache"
  cacheTag('get-threads')
  cacheLife("hours")
  try {
    // Fetch recent threads
    const recentThreads = await db
      .select({
        id: thread.id,
        title: thread.title,
        slug: thread.slug,
        createdAt: thread.createdAt,
        viewCount: thread.viewCount,
        replyCount: thread.replyCount,
        isPinned: thread.isPinned,
        isLocked: thread.isLocked,
        categoryId: thread.categoryId,
        categoryName: category.name,
        categorySlug: category.slug,
        author: {
          id: user.id,
          name: user.name,
          image: user.image,
        },
      })
      .from(thread)
      .innerJoin(category, eq(thread.categoryId, category.id))
      .innerJoin(user, eq(thread.authorId, user.id))
      .where(eq(thread.isHidden, false))
      .orderBy(desc(thread.lastPostAt))
      .limit(10)

    // Fetch trending threads (most viewed in last week)
    const trendingThreads = await db
      .select({
        id: thread.id,
        title: thread.title,
        slug: thread.slug,
        viewCount: thread.viewCount,
        replyCount: thread.replyCount,
        categoryId: thread.categoryId,
        categoryName: category.name,
        categorySlug: category.slug,
        author: {
          id: user.id,
          name: user.name,
          image: user.image,
        },
      })
      .from(thread)
      .innerJoin(category, eq(thread.categoryId, category.id))
      .innerJoin(user, eq(thread.authorId, user.id))
      .where(and(
        sql`${thread.createdAt} > NOW() - INTERVAL '7 days'`,
        eq(thread.isHidden, false)
      ))
      .orderBy(desc(thread.viewCount))
      .limit(5)

    return {
      success: true,
      recentThreads,
      trendingThreads
    }
  } catch (error) {
    console.error("Error fetching homepage threads:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch homepage threads",
      recentThreads: [],
      trendingThreads: []
    }
  }
}
export async function getThreadData(threadSlug: string) {
  "use cache"
  cacheTag('get-threads')
  cacheLife("hours")
  try {

    const threadData = await db.query.thread.findFirst({
      where: eq(thread.slug, threadSlug),
      with: {
        author: true,
        category: true,
        tags: {
          with: {
            tag: true,
          },
        },
      },
    })
    return {
      success: true,
      threadData: threadData || null
    }
  } catch (error) {
    console.error("Error fetching thread:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch thread"
    }
  }

}

export async function getAllThreads(options?: {
  page?: number
  perPage?: number
  categoryId?: string
  sortBy?: 'recent' | 'popular' | 'views' | 'replies'
  searchQuery?: string
  filter?: 'pinned' | 'locked' // Add filter support
}) {
  "use cache"
  cacheTag('get-threads')
  cacheLife("hours")
  try {
    const {
      page = 1,
      perPage = 20,
      categoryId,
      sortBy = 'recent',
      searchQuery,
      filter
    } = options || {}

    const offset = (page - 1) * perPage

    // Build where conditions
    const whereConditions = [eq(thread.isHidden, false)]

    if (categoryId) {
      whereConditions.push(eq(thread.categoryId, categoryId))
    }

    if (searchQuery) {
      whereConditions.push(sql`${thread.title} ILIKE ${'%' + searchQuery + '%'}`)
    }

    // Add filter conditions
    if (filter === 'pinned') {
      whereConditions.push(eq(thread.isPinned, true))
    } else if (filter === 'locked') {
      whereConditions.push(eq(thread.isLocked, true))
    }

    // Determine sort order
    let orderBy
    switch (sortBy) {
      case 'popular':
        orderBy = [desc(thread.viewCount), desc(thread.replyCount)]
        break
      case 'views':
        orderBy = [desc(thread.viewCount)]
        break
      case 'replies':
        orderBy = [desc(thread.replyCount)]
        break
      case 'recent':
      default:
        orderBy = [desc(thread.isPinned), desc(thread.lastPostAt)]
        break
    }

    // Fetch threads with pagination
    const threads = await db
      .select({
        id: thread.id,
        title: thread.title,
        slug: thread.slug,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt,
        lastPostAt: thread.lastPostAt,
        viewCount: thread.viewCount,
        replyCount: thread.replyCount,
        isPinned: thread.isPinned,
        isLocked: thread.isLocked,
        categoryId: thread.categoryId,
        categoryName: category.name,
        categorySlug: category.slug,
        author: {
          id: user.id,
          name: user.name,
          username: user.username,
          displayUsername: user.displayUsername,
          image: user.image,
        },
        category: {
          id: category.id,
          name: category.name,
          slug: category.slug,
          color: category.color,
          iconClass: category.iconClass,
        }
      })
      .from(thread)
      .innerJoin(category, eq(thread.categoryId, category.id))
      .innerJoin(user, eq(thread.authorId, user.id))
      .where(and(...whereConditions))
      .orderBy(...orderBy)
      .offset(offset)
      .limit(perPage)

    // Get total count for pagination
    const [{ count }] = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(thread)
      .innerJoin(category, eq(thread.categoryId, category.id))
      .where(and(...whereConditions))

    // Fetch all categories for the sidebar
    const categories = await db.query.category.findMany({
      columns: {
        id: true,
        name: true,
        slug: true,
        color: true,
        iconClass: true,
      },
      orderBy: [asc(category.name)]
    })

    return {
      success: true,
      threads,
      categories,
      pagination: {
        total: count,
        page,
        perPage,
        totalPages: Math.ceil(count / perPage),
        hasNext: page * perPage < count,
        hasPrev: page > 1
      }
    }
  } catch (error) {
    console.error("Error fetching all threads:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch threads",
      threads: [],
      categories: [],
      pagination: {
        total: 0,
        page: 1,
        perPage: 20,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
      }
    }
  }
}
