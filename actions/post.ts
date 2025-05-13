"use server";

import { prisma } from "@/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { UserRole } from "@/generated/prisma";
import { createNotification } from "./notification";
import { headers } from "next/headers";

const postSchema = z.object({
  content: z.string().min(5),
  parentId: z.string().optional(),
});

export async function createPost(threadId: string, formData: FormData) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session) {
      return { success: false, error: "You must be signed in to create a post" };
    }

    // Check if user is banned
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (user?.banned) {
      return { success: false, error: "Your account has been banned" };
    }

    // Check if thread exists and is not locked
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      include: {
        author: true,
        category: true
      }
    });

    if (!thread) {
      return { success: false, error: "Thread not found" };
    }

    if (thread.isLocked) {
      return { success: false, error: "This thread is locked and cannot receive new posts" };
    }

    const validatedFields = postSchema.parse({
      content: formData.get("content"),
      parentId: formData.get("parentId") || undefined,
    });

    // If parentId is provided, check if it exists in this thread
    if (validatedFields.parentId) {
      const parentPost = await prisma.post.findUnique({
        where: {
          id: validatedFields.parentId,
          threadId
        },
        include: { author: true }
      });

      if (!parentPost) {
        return { success: false, error: "Parent post not found in this thread" };
      }
    }

    const post = await prisma.post.create({
      data: {
        content: validatedFields.content,
        threadId,
        authorId: session.user.id,
        parentId: validatedFields.parentId,
      },
      include: {
        author: true,
        thread: {
          include: { category: true }
        },
        parent: {
          include: { author: true }
        }
      }
    });

    // Update thread's updatedAt to bring it to the top
    await prisma.thread.update({
      where: { id: threadId },
      data: { updatedAt: new Date() }
    });

    // Create notifications

    // 1. Notify thread author if different from post author
    if (thread.authorId !== session.user.id) {
      await createNotification({
        type: "REPLY",
        userId: thread.authorId,
        actorId: session.user.id,
        entityId: post.id,
        entityType: "POST",
        title: "New Reply",
        message: `${session.user.name} replied to your thread: ${thread.title}`,
        link: `/categories/${thread.category.slug}/${thread.slug}#post-${post.id}`
      });
    }

    // 2. Notify parent post author if this is a reply and different from post author
    // Fixed: Use optional chaining to safely access post.parent.authorId
    if (post.parentId && post.parent && post.parent.authorId !== session.user.id) {
      await createNotification({
        type: "REPLY",
        userId: post.parent.authorId,
        actorId: session.user.id,
        entityId: post.id,
        entityType: "POST",
        title: "New Reply",
        message: `${session.user.name} replied to your post in: ${thread.title}`,
        link: `/categories/${thread.category.slug}/${thread.slug}#post-${post.id}`
      });
    }

    // Add reputation to post author
    await prisma.user.update({
      where: { id: session.user.id },
      data: { reputation: { increment: 2 } }
    });

    revalidatePath(`/categories/${thread.category.slug}/${thread.slug}`);

    return {
      success: true,
      data: post,
      redirect: `/categories/${thread.category.slug}/${thread.slug}#post-${post.id}`
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }

    console.error("Failed to create post:", error);
    return { success: false, error: "Failed to create post" };
  }
}

export async function updatePost(postId: string, formData: FormData) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session) {
      return { success: false, error: "You must be signed in to update a post" };
    }

    // Get post to check permissions
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        thread: { include: { category: true } }
      }
    });

    if (!post) {
      return { success: false, error: "Post not found" };
    }

    // Check if thread is locked
    if (post.thread.isLocked) {
      return { success: false, error: "This thread is locked and posts cannot be edited" };
    }

    // Check if user is author, moderator, or admin
    const isModerator = await prisma.categoryModerator.findFirst({
      where: {
        userId: session.user.id,
        categoryId: post.thread.categoryId
      }
    });

    if (post.authorId !== session.user.id &&
      !isModerator &&
      session.user.role !== UserRole.admin) {
      return { success: false, error: "You don't have permission to update this post" };
    }

    const validatedFields = postSchema.parse({
      content: formData.get("content"),
    });

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        content: validatedFields.content,
        isEdited: true
      },
      include: {
        thread: {
          include: { category: true }
        }
      }
    });

    revalidatePath(`/categories/${updatedPost.thread.category.slug}/${updatedPost.thread.slug}`);

    return {
      success: true,
      data: updatedPost
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }

    console.error("Failed to update post:", error);
    return { success: false, error: "Failed to update post" };
  }
}

export async function deletePost(postId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session) {
      return { success: false, error: "You must be signed in to delete a post" };
    }

    // Get post to check permissions
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        thread: { include: { category: true } }
      }
    });

    if (!post) {
      return { success: false, error: "Post not found" };
    }

    // Check if user is author, moderator, or admin
    const isModerator = await prisma.categoryModerator.findFirst({
      where: {
        userId: session.user.id,
        categoryId: post.thread.categoryId
      }
    });

    if (post.authorId !== session.user.id &&
      !isModerator &&
      session.user.role !== UserRole.admin) {
      return { success: false, error: "You don't have permission to delete this post" };
    }

    await prisma.post.delete({
      where: { id: postId }
    });

    // If this was the solution post, update thread
    if (post.thread.solutionPostId === postId) {
      await prisma.thread.update({
        where: { id: post.threadId },
        data: {
          solutionPostId: null,
          isSolved: false
        }
      });
    }

    revalidatePath(`/categories/${post.thread.category.slug}/${post.thread.slug}`);

    return { success: true };
  } catch (error) {
    console.error("Failed to delete post:", error);
    return { success: false, error: "Failed to delete post" };
  }
}
