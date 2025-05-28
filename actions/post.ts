"use server"

import { db } from "@/db/drizzle"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { post, thread, vote, user, notification } from "@/db/schema"
import { eq, and, sql } from "drizzle-orm"
import { revalidateTag } from 'next/cache'

interface PostCreateData {
  content: string
  threadId: string
}

interface PostUpdateData {
  content: string
}

// Create a new post (reply)
export async function createPost(data: PostCreateData) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user?.id) {
      throw new Error("Not authenticated")
    }

    const authorId = session.user.id

    // Check if thread exists and is not locked
    const threadData = await db.query.thread.findFirst({
      where: eq(thread.id, data.threadId),
      columns: {
        isLocked: true,
        slug: true,
        authorId: true,
      },
      with: {
        category: {
          columns: {
            name: true,
          },
        },
      },
    })

    if (!threadData) {
      throw new Error("Thread not found")
    }

    if (threadData.isLocked) {
      throw new Error("Thread is locked")
    }

    return await db.transaction(async (tx) => {
      // Create post
      const [postResult] = await tx.insert(post)
        .values({
          content: data.content,
          threadId: data.threadId,
          authorId,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning({ id: post.id })

      // Update thread with last post info and increment reply count
      await tx.update(thread)
        .set({
          lastPostId: postResult.id,
          lastPostAt: new Date(),
          replyCount: sql`${thread.replyCount} + 1`
        })
        .where(eq(thread.id, data.threadId))

      // Create notification for thread author (if not the same as post author)
      // const threadInfo = await tx.query.thread.findFirst({
      //   where: eq(thread.id, data.threadId),
      //   columns: {
      //     authorId: true
      //   }
      // })
      //
      if (threadData && threadData.authorId !== authorId) {
        await tx.insert(notification).values({
          userId: threadData.authorId,
          type: 'new_reply',
          data: JSON.stringify({
            postId: postResult.id,
            threadId: data.threadId,
            authorId,
            threadSlug: threadData.slug
          }),
          createdAt: new Date(),
        })
      }

      revalidatePath(`/forum/categories/${threadData.category.name}/threads/`)
      revalidatePath("/forum")
      revalidatePath("/forum/threads/")
      revalidateTag('get-threads')
      return {
        success: true,
        postId: postResult.id
      }
    })
  } catch (error) {
    console.error("Error creating post:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create post"
    }
  }
}

// Update post
export async function updatePost(postId: string, data: PostUpdateData) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user?.id) {
      throw new Error("Not authenticated")
    }

    // Check if user is post author or admin
    const postData = await db.query.post.findFirst({
      where: eq(post.id, postId),
      columns: {
        authorId: true,
        threadId: true
      },
      with: {
        thread: {
          columns: {
            slug: true,
          }
        }
      }
    })
    if (!postData) {
      throw new Error("Post not found")
    }

    // Only allow author or admin to update
    const isAdmin = session.user.role === "admin"
    if (postData.authorId !== session.user.id && !isAdmin) {
      throw new Error("Not authorized to update this post")
    }

    await db.update(post)
      .set({
        content: data.content,
        isEdited: true,
        editedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(post.id, postId))

    // revalidatePath(`/forum/categories/${postData.thread?.slug}/`)

    revalidateTag('get-threads')
    return { success: true }
  } catch (error) {
    console.error("Error updating post:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update post"
    }
  }
}

// Delete post
export async function deletePost(postId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user?.id) {
      throw new Error("Not authenticated")
    }

    // Check if user is post author or admin
    const postData = await db.query.post.findFirst({
      where: eq(post.id, postId),
      columns: {
        authorId: true,
        threadId: true
      },
      with: {
        thread: {
          columns: {
            slug: true
          }
        }
      }
    })

    if (!postData) {
      throw new Error("Post not found")
    }

    // Only allow author or admin to delete
    const isAdmin = session.user.role === "admin"
    if (postData.authorId !== session.user.id && !isAdmin) {
      throw new Error("Not authorized to delete this post")
    }

    // Soft delete the post
    await db.update(post)
      .set({
        isDeleted: true,
        content: "[This post has been deleted]",
        updatedAt: new Date()
      })
      .where(eq(post.id, postId))

    // Update thread reply count
    await db.update(thread)
      .set({
        replyCount: sql`${thread.replyCount} - 1`
      })
      .where(eq(thread.id, postData.threadId))

    // revalidatePath(`/threads/${postData.thread.slug}`)

    revalidateTag('get-threads')
    return { success: true }
  } catch (error) {
    console.error("Error deleting post:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete post"
    }
  }
}

// Vote on a post
export async function votePost(postId: string, value: 1 | 0 | -1) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user?.id) {
      throw new Error("Not authenticated")
    }

    const userId = session.user.id

    // Check if post exists
    const postData = await db.query.post.findFirst({
      where: eq(post.id, postId),
      columns: {
        authorId: true,
        threadId: true
      },
      with: {
        thread: {
          columns: {
            slug: true
          }
        }
      }
    })

    if (!postData) {
      throw new Error("Post not found")
    }

    // Don't allow voting on own posts
    if (postData.authorId === userId) {
      throw new Error("Cannot vote on your own post")
    }

    return await db.transaction(async (tx) => {
      // Check if user has already voted
      const existingVote = await tx.query.vote.findFirst({
        where: and(
          eq(vote.postId, postId),
          eq(vote.userId, userId)
        )
      })

      if (existingVote) {
        if (value === 0) {
          // Remove vote
          await tx.delete(vote)
            .where(
              and(
                eq(vote.postId, postId),
                eq(vote.userId, userId)
              )
            )

          // Update user reputation (reverse previous vote)
          const reputationChange = -existingVote.value
          await tx.update(user)
            .set({
              reputation: sql`${user.reputation} + ${reputationChange}`
            })
            .where(eq(user.id, postData.authorId))
        } else if (existingVote.value !== value) {
          // Update vote
          await tx.update(vote)
            .set({
              value,
              updatedAt: new Date()
            })
            .where(
              and(
                eq(vote.postId, postId),
                eq(vote.userId, userId)
              )
            )

          // Update user reputation (remove old value, add new value)
          const reputationChange = value - existingVote.value
          await tx.update(user)
            .set({
              reputation: sql`${user.reputation} + ${reputationChange}`
            })
            .where(eq(user.id, postData.authorId))
        }
      } else if (value !== 0) {
        // Create new vote
        await tx.insert(vote)
          .values({
            postId,
            userId,
            value,
            createdAt: new Date(),
            updatedAt: new Date()
          })

        // Update user reputation
        await tx.update(user)
          .set({
            reputation: sql`${user.reputation} + ${value}`
          })
          .where(eq(user.id, postData.authorId))
      }

      // Create notification for post author
      if (value === 1) {
        await tx.insert(notification).values({
          userId: postData.authorId,
          type: 'post_upvote',
          data: JSON.stringify({
            postId,
            threadId: postData.threadId,
            voterId: userId,
            // threadSlug: postData.thread.slug
          }),
          createdAt: new Date(),
        })
      }

      // revalidatePath(`/threads/${postData.thread.slug}`)

      revalidateTag('get-threads')
      return { success: true }
    })
  } catch (error) {
    console.error("Error voting on post:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to vote on post"
    }
  }
}
