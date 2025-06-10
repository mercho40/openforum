"use server"

import { db } from "@/db/drizzle"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { revalidateTag } from "next/cache"
import { headers } from "next/headers"
import { Session } from "@/lib/auth"
import { post, thread, user } from "@/db/schema" // Import the user table from your schema
import { asc, count, desc, eq, ilike, or } from "drizzle-orm"
import { unstable_cacheTag as cacheTag } from 'next/cache'
import { unstable_cacheLife as cacheLife } from 'next/cache'

// Helper function for user-related cache invalidation
function invalidateUserCaches(options: {
  userId?: string
  operation: 'profile_update' | 'activity_update'
}) {
  const { userId, operation } = options
  
  if (userId) {
    // Invalidate user-specific caches
    revalidateTag(`user-${userId}`)
    revalidateTag(`user-profile-${userId}`)
    revalidateTag(`user-stats-${userId}`)
    revalidateTag(`user-activity-${userId}`)
    revalidateTag(`author-threads-${userId}`)
  }
  
  // Invalidate general user lists
  revalidateTag('user-stats')
  revalidateTag('forum-stats')
  revalidateTag('forum-members')
  revalidateTag('all-members')
  
  if (operation === 'profile_update') {
    // Profile updates might affect thread/post author displays
    revalidateTag('get-threads')
    revalidateTag('get-homepage-threads')
  }
}

interface ProfileUpdateData {
  bio?: string
  signature?: string
  website?: string
  location?: string
  displayUsername?: string
  image?: string
}

export async function updateUserProfile(data: ProfileUpdateData) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })
    
    if (!session?.user?.id) {
      throw new Error("Not authenticated")
    }

    // Filter out undefined values
    const updatableData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined)
    )

    try {
      await auth.api.updateUser({
        body: {
          bio: updatableData.bio,
          signature: updatableData.signature,
          website: updatableData.website,
          location: updatableData.location,
          displayUsername: updatableData.displayUsername,
          image: updatableData.image,
        },
        headers: await headers(),
      })
    } catch (error) {
      console.error("Error updating user profile:", error)
      throw new Error("Failed to update user profile")
    }

    revalidatePath('/profile')
    revalidatePath('/')

    // Invalidate user caches
    invalidateUserCaches({
      userId: session.user.id,
      operation: 'profile_update'
    })

    return { success: true }
  } catch (error) {
    console.error("Error updating user profile:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update profile"
    }
  }
}

// Track if the user has seen the profile completion form
export async function markProfileSetupSeen() {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user?.id) {
      throw new Error("Not authenticated")
    }

    await auth.api.updateUser({
      body: {
        metadata: JSON.stringify({ profileSetupSeen: true }),
      },
      headers: await headers(),
    })
    
    // Invalidate user caches
    invalidateUserCaches({
      userId: session.user.id,
      operation: 'profile_update'
    })
    
    return { success: true }
  } catch (error) {
    console.error("Error updating user profile:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update user profile"
    }
  }
}

export async function UpdatePassword(newPassword: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user?.id) {
      throw new Error("Not authenticated")
    } else {
      const ctx = await auth.$context;
      const hash = await ctx.password.hash(newPassword);
      await ctx.internalAdapter.updatePassword(session?.user?.id, hash)
      
      // Invalidate user caches
      invalidateUserCaches({
        userId: session.user.id,
        operation: 'profile_update'
      })
      
      return { success: true }
    }
  }
  catch (error) {
    console.error("Error updating password:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update password"
    }
  }
}

export async function getUserProfile(userId: string) {
  "use cache"
  cacheTag(`user-profile-${userId}`)
  cacheTag(`user-activity-${userId}`)
  cacheLife("hours")
  
  try {
    // Fetch the user data
    const users = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        username: user.username,
        displayUsername: user.displayUsername,
        bio: user.bio,
        signature: user.signature,
        website: user.website,
        location: user.location,
        reputation: user.reputation,
        createdAt: user.createdAt,
        role: user.role,
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!users.length) {
      return {
        success: false,
        error: "User not found",
      };
    }

    // Get thread count
    const threadCount = await db
      .select({ count: count() })
      .from(thread)
      .where(eq(thread.authorId, userId));

    // Get post count
    const postCount = await db
      .select({ count: count() })
      .from(post)
      .where(eq(post.authorId, userId));

    // Get recent threads (limit to 5 for profile view)
    const threads = await db.query.thread.findMany({
      where: eq(thread.authorId, userId),
      with: {
        category: {
          columns: {
            id: true,
            name: true,
            slug: true,
          }
        }
      },
      columns: {
        id: true,
        title: true,
        slug: true,
        createdAt: true,
        updatedAt: true,
        isPinned: true,
        isLocked: true,
        viewCount: true,
        replyCount: true,
      },
      orderBy: [desc(thread.createdAt)],
      limit: 5,
    });

    // Get recent posts (limit to 5 for profile view)
    const posts = await db.query.post.findMany({
      where: eq(post.authorId, userId),
      with: {
        thread: {
          columns: {
            id: true,
            title: true,
            slug: true,
          },
          with: {
            category: {
              columns: {
                id: true,
                name: true,
                slug: true,
              }
            }
          }
        }
      },
      columns: {
        id: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [desc(post.createdAt)],
      limit: 5,
    });

    // Get like counts for threads and posts
    const threadsWithCounts = await Promise.all(
      threads.map(async (threadItem) => {
        // Get post count for this thread (replies)
        const postCountResult = await db
          .select({ count: count() })
          .from(post)
          .where(eq(post.threadId, threadItem.id));

        // Get like count for the initial post of this thread
        const initialPost = await db.query.post.findFirst({
          where: eq(post.threadId, threadItem.id),
          orderBy: [asc(post.createdAt)],
          with: {
            votes: true
          }
        });

        const likeCount = initialPost?.votes.filter(vote => vote.value === 1).length || 0;

        return {
          ...threadItem,
          _count: {
            posts: postCountResult[0]?.count || 0,
            likes: likeCount
          }
        };
      })
    );

    const postsWithCounts = await Promise.all(
      posts.map(async (postItem) => {
        // Get like count for this post
        const postWithVotes = await db.query.post.findFirst({
          where: eq(post.id, postItem.id),
          with: {
            votes: true
          }
        });

        const likeCount = postWithVotes?.votes.filter(vote => vote.value === 1).length || 0;

        return {
          ...postItem,
          _count: {
            likes: likeCount
          }
        };
      })
    );

    // Combine user data with activity counts
    const userData = {
      ...users[0],
      threadCount: threadCount[0]?.count || 0,
      postCount: postCount[0]?.count || 0,
      threads: threadsWithCounts,
      posts: postsWithCounts,
    };

    return {
      success: true,
      userData,
    };
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch user profile",
    };
  }
}

// Get user activity (threads and posts) with pagination
export async function getUserActivity(userId: string, {
  page = 1,
  perPage = 20,
  type = "all" // "all", "threads", "posts"
}: {
  page?: number
  perPage?: number
  type?: "all" | "threads" | "posts"
} = {}) {
  "use cache"
  cacheTag(`user-activity-${userId}`)
  cacheTag(`user-activity-${userId}-${type}-page-${page}`)
  cacheLife("hours")
  
  try {
    const offset = (page - 1) * perPage

    let userThreads: any[] = []
    let userPosts: any[] = []
    let totalItems = 0

    if (type === "all" || type === "threads") {
      // Get user's threads
      const threads = await db.query.thread.findMany({
        where: eq(thread.authorId, userId),
        with: {
          category: {
            columns: {
              id: true,
              name: true,
              slug: true,
              color: true,
            }
          }
        },
        columns: {
          id: true,
          title: true,
          slug: true,
          createdAt: true,
          updatedAt: true,
          isPinned: true,
          isLocked: true,
          viewCount: true,
          replyCount: true,
        },
        orderBy: [desc(thread.createdAt)],
        ...(type === "threads" ? { offset, limit: perPage } : {})
      })

      userThreads = threads.map(t => ({ ...t, type: 'thread' as const }))
    }

    if (type === "all" || type === "posts") {
      // Get user's posts
      const posts = await db.query.post.findMany({
        where: eq(post.authorId, userId),
        with: {
          thread: {
            columns: {
              id: true,
              title: true,
              slug: true,
            },
            with: {
              category: {
                columns: {
                  id: true,
                  name: true,
                  slug: true,
                  color: true,
                }
              }
            }
          }
        },
        columns: {
          id: true,
          content: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: [desc(post.createdAt)],
        ...(type === "posts" ? { offset, limit: perPage } : {})
      })

      userPosts = posts.map(p => ({ ...p, type: 'post' as const }))
    }

    // Combine and sort by date if showing all
    let activity: any[] = []
    if (type === "all") {
      activity = [...userThreads, ...userPosts]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(offset, offset + perPage)
      
      totalItems = userThreads.length + userPosts.length
    } else if (type === "threads") {
      activity = userThreads
      const threadCount = await db
        .select({ count: count() })
        .from(thread)
        .where(eq(thread.authorId, userId))
      totalItems = threadCount[0]?.count || 0
    } else {
      activity = userPosts
      const postCount = await db
        .select({ count: count() })
        .from(post)
        .where(eq(post.authorId, userId))
      totalItems = postCount[0]?.count || 0
    }

    return {
      success: true,
      activity,
      pagination: {
        total: totalItems,
        page,
        perPage,
        totalPages: Math.ceil(totalItems / perPage),
        hasNext: page * perPage < totalItems,
        hasPrev: page > 1
      }
    }
  } catch (error) {
    console.error("Error fetching user activity:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch user activity",
      activity: [],
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

// Fetch forum members with pagination and filtering options
export async function getForumMembers({
  page = 1,
  search = "",
  sort = "newest",
  limit = 20,
}) {
  "use cache"
  
  // Create specific cache tags based on parameters
  const cacheTags = ['forum-members']
  
  if (search) {
    cacheTags.push(`members-search-${encodeURIComponent(search)}`)
  } else {
    cacheTags.push('all-members')
  }
  
  cacheTags.push(`members-${sort}-page-${page}-limit-${limit}`)
  
  // Apply cache tags
  cacheTags.forEach(tag => cacheTag(tag))
  cacheLife("hours")
  
  try {
    const offset = (page - 1) * limit;
    
    // Base query
    let baseQuery = db
      .select({
        id: user.id,
        name: user.name,
        username: user.username,
        displayUsername: user.displayUsername,
        image: user.image,
        bio: user.bio,
        reputation: user.reputation,
        createdAt: user.createdAt,
        role: user.role,
      })
      .from(user);

    // Add search filter if provided
    const query = search
      ? baseQuery.where(
          or(
            ilike(user.name, `%${search}%`),
            ilike(user.username, `%${search}%`),
            ilike(user.displayUsername, `%${search}%`)
          )
        )
      : baseQuery;
    
    // Determine orderBy clause
    let orderByClause;
    switch (sort) {
      case "oldest":
        orderByClause = asc(user.createdAt);
        break;
      case "reputation":
        orderByClause = desc(user.reputation);
        break;
      case "name":
        orderByClause = asc(user.name);
        break;
      case "newest":
      default:
        orderByClause = desc(user.createdAt);
        break;
    }
    
    // Get total count for pagination
    const totalCountResult = await db
      .select({ count: count() })
      .from(user)
      .where(search ? 
        or(
          ilike(user.name, `%${search}%`),
          ilike(user.username, `%${search}%`),
          ilike(user.displayUsername, `%${search}%`)
        ) : 
        undefined
      );
    
    // Execute the paginated query with orderBy
    const members = await (search
      ? query
      : query // no-op, but keeps the chain consistent
    )
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);
    
    // Pagination data
    const totalItems = totalCountResult[0]?.count || 0;
    const totalPages = Math.ceil(totalItems / limit);
    
    return {
      success: true,
      members,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  } catch (error) {
    console.error("Error fetching forum members:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch forum members",
      members: [],
      pagination: {
        currentPage: page,
        totalPages: 0,
        totalItems: 0,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
  }
}
