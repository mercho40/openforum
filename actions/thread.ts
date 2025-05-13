"use server";

import { prisma } from "@/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { slugify } from "@/lib/utils";
// import { UserRole } from "@/generated/prisma";
import { createNotification } from "./notification";

const threadSchema = z.object({
  title: z.string().min(5).max(100),
  content: z.string().min(10),
  categoryId: z.string(),
  tags: z.array(z.string()).optional(),
});

export async function getThreads({
  categoryId,
  page = 1,
  limit = 20,
  orderBy = "updatedAt"
}: {
  categoryId?: string,
  page?: number,
  limit?: number,
  orderBy?: "createdAt" | "updatedAt" | "views"
}) {
  try {
    const where = categoryId ? { categoryId } : {};
    const skip = (page - 1) * limit;

    const [threads, totalCount] = await Promise.all([
      prisma.thread.findMany({
        where,
        skip,
        take: limit,
        orderBy: orderBy === "views"
          ? { views: { _count: "desc" } }
          : { [orderBy]: "desc" },
        include: {
          author: { select: { id: true, name: true, image: true } },
          category: { select: { id: true, name: true, slug: true } },
          tags: { include: { tag: true } },
          _count: {
            select: {
              posts: true,
              views: true,
              reactions: { where: { type: "LIKE" } }
            }
          }
        }
      }),
      prisma.thread.count({ where })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      success: true,
      data: {
        threads,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages
        }
      }
    };
  } catch (error) {
    console.error("Failed to fetch threads:", error);
    return { success: false, error: "Failed to load threads" };
  }
}

export async function getThreadBySlug(categorySlug: string, threadSlug: string, userId?: string) {
  try {
    const category = await prisma.category.findUnique({
      where: { slug: categorySlug }
    });

    if (!category) {
      return { success: false, error: "Category not found" };
    }

    const thread = await prisma.thread.findUnique({
      where: {
        slug_categoryId: {
          slug: threadSlug,
          categoryId: category.id
        }
      },
      include: {
        author: true,
        category: true,
        tags: { include: { tag: true } },
        posts: {
          orderBy: { createdAt: "asc" },
          include: {
            author: true,
            reactions: true,
            _count: {
              select: {
                reactions: { where: { type: "LIKE" } },
                replies: true
              }
            }
          }
        },
        solutionPost: { include: { author: true } },
        _count: { select: { views: true, reactions: true } }
      }
    });

    if (!thread) {
      return { success: false, error: "Thread not found" };
    }

    // Track thread view if user is provided
    if (userId) {
      await prisma.threadView.upsert({
        where: {
          threadId_userId: {
            threadId: thread.id,
            userId
          }
        },
        update: { createdAt: new Date() },
        create: {
          threadId: thread.id,
          userId
        }
      });
    }

    return { success: true, data: thread };
  } catch (error) {
    console.error("Failed to fetch thread:", error);
    return { success: false, error: "Failed to load thread" };
  }
}

export async function createThread(formData: FormData) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session) {
      return { success: false, error: "You must be signed in to create a thread" };
    }

    // Check if user is banned
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (user?.banned) {
      return { success: false, error: "Your account has been banned" };
    }

    const validatedFields = threadSchema.parse({
      title: formData.get("title"),
      content: formData.get("content"),
      categoryId: formData.get("categoryId"),
      tags: formData.getAll("tags") as string[],
    });

    const slug = slugify(validatedFields.title);

    // Check if thread exists in the category
    const existingThread = await prisma.thread.findUnique({
      where: {
        slug_categoryId: {
          slug,
          categoryId: validatedFields.categoryId
        }
      }
    });

    if (existingThread) {
      return { success: false, error: "A thread with this title already exists in this category" };
    }

    // Create thread with tags
    const thread = await prisma.thread.create({
      data: {
        title: validatedFields.title,
        slug,
        content: validatedFields.content,
        categoryId: validatedFields.categoryId,
        authorId: session.user.id,
        tags: {
          create: validatedFields.tags?.map(tagId => ({
            tag: { connect: { id: tagId } }
          })) || []
        }
      },
      include: {
        category: true
      }
    });

    // Create notification for category moderators
    const moderators = await prisma.categoryModerator.findMany({
      where: { categoryId: validatedFields.categoryId },
      select: { userId: true }
    });

    for (const moderator of moderators) {
      await createNotification({
        type: "THREAD",
        userId: moderator.userId,
        actorId: session.user.id,
        entityId: thread.id,
        entityType: "THREAD",
        title: "New Thread",
        message: `New thread created in ${thread.category.name}: ${thread.title}`,
        link: `/categories/${thread.category.slug}/${thread.slug}`
      });
    }

    revalidatePath(`/categories/${thread.category.slug}`);
    return {
      success: true,
      data: thread,
      redirect: `/categories/${thread.category.slug}/${thread.slug}`
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }

    console.error("Failed to create thread:", error);
    return { success: false, error: "Failed to create thread" };
  }
}

// Additional thread actions like updateThread, deleteThread, etc. would follow the same pattern
// with the updated auth.api.getSession method
