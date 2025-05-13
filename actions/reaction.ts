"use server";

import { revalidatePath } from "next/cache";
import { ReactionType } from "@/generated/prisma";
import { createNotification } from "./notification";
import { prisma } from "@/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function toggleReaction(
  type: ReactionType,
  entityType: "thread" | "post",
  entityId: string
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session) {
      return { success: false, error: "You must be signed in to react" };
    }

    // Check if user is banned
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (user?.banned) {
      return { success: false, error: "Your account has been banned" };
    }

    // Check if entity exists
    if (entityType === "thread") {
      const thread = await prisma.thread.findUnique({
        where: { id: entityId },
        include: {
          author: true,
          category: true
        }
      });

      if (!thread) {
        return { success: false, error: "Thread not found" };
      }

      // Check if reaction exists
      const existingReaction = await prisma.reaction.findFirst({
        where: {
          threadId: entityId,
          userId: session.user.id,
          type
        }
      });

      if (existingReaction) {
        // Remove reaction
        await prisma.reaction.delete({
          where: { id: existingReaction.id }
        });

        // Decrease reputation if it was a like
        if (type === "LIKE" && thread.authorId !== session.user.id) {
          await prisma.user.update({
            where: { id: thread.authorId },
            data: { reputation: { decrement: 1 } }
          });
        }
      } else {
        // Add reaction
        await prisma.reaction.create({
          data: {
            type,
            threadId: entityId,
            userId: session.user.id
          }
        });

        // Increase reputation if it's a like and not self-like
        if (type === "LIKE" && thread.authorId !== session.user.id) {
          await prisma.user.update({
            where: { id: thread.authorId },
            data: { reputation: { increment: 1 } }
          });

          // Create notification for thread author
          await createNotification({
            type: "LIKE",
            userId: thread.authorId,
            actorId: session.user.id,
            entityId: thread.id,
            entityType: "THREAD",
            title: "New Like",
            message: `${session.user.name} liked your thread: ${thread.title}`,
            link: `/categories/${thread.category.slug}/${thread.slug}`
          });
        }
      }

      revalidatePath(`/categories/${thread.category.slug}/${thread.slug}`);
    } else if (entityType === "post") {
      const post = await prisma.post.findUnique({
        where: { id: entityId },
        include: {
          author: true,
          thread: { include: { category: true } }
        }
      });

      if (!post) {
        return { success: false, error: "Post not found" };
      }

      // Check if reaction exists
      const existingReaction = await prisma.reaction.findFirst({
        where: {
          postId: entityId,
          userId: session.user.id,
          type
        }
      });

      if (existingReaction) {
        // Remove reaction
        await prisma.reaction.delete({
          where: { id: existingReaction.id }
        });

        // Decrease reputation if it was a like
        if (type === "LIKE" && post.authorId !== session.user.id) {
          await prisma.user.update({
            where: { id: post.authorId },
            data: { reputation: { decrement: 1 } }
          });
        }
      } else {
        // Add reaction
        await prisma.reaction.create({
          data: {
            type,
            postId: entityId,
            userId: session.user.id
          }
        });

        // Increase reputation if it's a like and not self-like
        if (type === "LIKE" && post.authorId !== session.user.id) {
          await prisma.user.update({
            where: { id: post.authorId },
            data: { reputation: { increment: 1 } }
          });

          // Create notification for post author
          await createNotification({
            type: "LIKE",
            userId: post.authorId,
            actorId: session.user.id,
            entityId: post.id,
            entityType: "POST",
            title: "New Like",
            message: `${session.user.name} liked your post in thread: ${post.thread.title}`,
            link: `/categories/${post.thread.category.slug}/${post.thread.slug}#post-${post.id}`
          });
        }
      }

      revalidatePath(`/categories/${post.thread.category.slug}/${post.thread.slug}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to toggle reaction:", error);
    return { success: false, error: "Failed to update reaction" };
  }
}
