"use server"

import { db } from "@/db/drizzle"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { category, thread, categorySubscription } from "@/db/schema"
import { eq, desc, asc, and, inArray } from "drizzle-orm"
import { slugify } from "@/lib/utils" // You'll need to create this utility
import { count } from 'drizzle-orm'
import { z } from "zod"

const createCategorySchema = z.object({
  name: z.string().min(3).max(50),
  description: z.string().optional(),
  displayOrder: z.number().int().min(0).default(0),
  isHidden: z.boolean().default(false),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format").default("#3498db"),
  iconClass: z.string().optional().nullable(),
});

const updateCategorySchema = z.object({
  name: z.string().min(3).max(50),
  slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/),
  description: z.string().optional().nullable(),
  displayOrder: z.number().int().min(0).default(0),
  isHidden: z.boolean().default(false),
  color: z.string().optional().nullable(),
  iconClass: z.string().optional().nullable(),
});

export type CategoryFormData = z.infer<typeof updateCategorySchema>;

// Get all categories
export async function getCategories() {
  try {
    const categories = await db.query.category.findMany({
      orderBy: [asc(category.displayOrder), asc(category.name)],
      where: eq(category.isHidden, false)
    })

    return {
      success: true,
      categories
    }
  } catch (error) {
    console.error("Error fetching categories:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch categories"
    }
  }
}

// Get category with threads
export async function getCategoryWithThreads(slug: string, page = 1, perPage = 20) {
  try {
    // Get category using basic query
    const categoryData = await db.select().from(category)
      .where(eq(category.slug, slug))
      .limit(1)
      .then(rows => rows[0])

    if (!categoryData) {
      throw new Error("Category not found")
    }

    // Get threads with pagination - avoid using relations
    const offset = (page - 1) * perPage

    const threadsData = await db.select({
      thread: thread,
    })
      .from(thread)
      .where(eq(thread.categoryId, categoryData.id))
      .orderBy(desc(thread.isPinned), desc(thread.lastPostAt))
      .offset(offset)
      .limit(perPage)
    
    // Extract threads from result
    const threads = threadsData.map(t => t.thread)

    // Separately fetch authors for these threads
    const authors = await db.query.user.findMany({
      where: (user) => {
        const authorIds = threads.map(t => t.authorId)
        return inArray(user.id, authorIds)
      },
      columns: {
        id: true,
        name: true,
        image: true
        // Remove username and displayUsername which cause type issues
      }
    })

    // Manually join threads with authors - ensure each thread has an author
    const threadsWithAuthors = threads.map(thread => {
      // Find author or create a default one if not found
      const author = authors.find(a => a.id === thread.authorId) || {
        id: thread.authorId,
        name: "Unknown User",
        image: null
      }
      
      return {
        ...thread,
        author,
        // Ensure required fields exist with proper types
        createdAt: thread.createdAt || new Date(),
        viewCount: thread.viewCount || 0,
        replyCount: thread.replyCount || 0,
        isPinned: !!thread.isPinned,
        isLocked: !!thread.isLocked,
        // No lastPost for now since that was causing issues
      }
    })

    // Get total thread count for pagination
    const totalCountResult = await db.select({
      count: count(),
    })
      .from(thread)
      .where(eq(thread.categoryId, categoryData.id))

    const totalThreads = totalCountResult[0]?.count || 0

    return {
      success: true,
      category: categoryData,
      threads: threadsWithAuthors,
      pagination: {
        total: totalThreads,
        page,
        perPage,
        totalPages: Math.ceil(totalThreads / perPage)
      }
    }
  } catch (error) {
    console.error("Error fetching category:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch category"
    }
  }
}

// Subscribe to category
export async function subscribeToCategoryAction(categoryId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user?.id) {
      throw new Error("Not authenticated")
    }

    const userId = session.user.id

    // Check if already subscribed
    const existingSubscription = await db.query.categorySubscription.findFirst({
      where: and(
        eq(categorySubscription.categoryId, categoryId),
        eq(categorySubscription.userId, userId),
      )
    })

    if (!existingSubscription) {
      // Create new subscription
      await db.insert(categorySubscription)
        .values({
          categoryId,
          userId,
          createdAt: new Date()
        })
    }

    return { success: true }
  } catch (error) {
    console.error("Error subscribing to category:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to subscribe to category"
    }
  }
}

// Unsubscribe from category
export async function unsubscribeFromCategoryAction(categoryId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user?.id) {
      throw new Error("Not authenticated")
    }

    const userId = session.user.id

    // Delete subscription
    await db.delete(categorySubscription)
      .where(
        and(
          eq(categorySubscription.categoryId, categoryId),
          eq(categorySubscription.userId, userId)
        )
      )

    return { success: true }
  } catch (error) {
    console.error("Error unsubscribing from category:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to unsubscribe from category"
    }
  }
}

export async function createCategory(input: z.infer<typeof createCategorySchema>) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })
    if (!session?.user?.id) {
      throw new Error("Not authenticated")
    }
    const formData = createCategorySchema.parse(input);
    const slug = slugify(formData.name);

    // Create the category
    const [newCategory] = await db.insert(category).values({
      name: formData.name,
      description: formData.description,
      slug,
      displayOrder: formData.displayOrder,
      isHidden: formData.isHidden,
      color: formData.color,
      iconClass: formData.iconClass || null,
    }).returning();

    if (!newCategory) {
      throw new Error("Failed to create category");
    }

    // Revalidate the categories page
    revalidatePath("/categories");

    return { success: true, data: newCategory };


  } catch (error) {
    console.error("Error creating category:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create category"
    }
  }
}

// Update category
export async function updateCategory(categoryId: string, input: CategoryFormData) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })
    
    if (!session?.user?.id) {
      throw new Error("Not authenticated")
    }
    
    const formData = updateCategorySchema.parse(input);
    
    // Update the category
    const [updatedCategory] = await db.update(category)
      .set({
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        displayOrder: formData.displayOrder,
        isHidden: formData.isHidden,
        color: formData.color,
        iconClass: formData.iconClass,
        updatedAt: new Date()
      })
      .where(eq(category.id, categoryId))
      .returning();
      
    if (!updatedCategory) {
      throw new Error("Failed to update category");
    }
    
    // Revalidate the categories page
    revalidatePath("/forum/admin/categories");
    
    return { success: true, data: updatedCategory };
  } catch (error) {
    console.error("Error updating category:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update category"
    }
  }
}

// Delete category
export async function deleteCategory(categoryId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })
    
    if (!session?.user?.id) {
      throw new Error("Not authenticated")
    }
    
    // Delete the category
    // Note: In a real application, you might want to handle cascading deletes
    // or prevent deletion if there are threads in the category
    const [deletedCategory] = await db.delete(category)
      .where(eq(category.id, categoryId))
      .returning();
      
    if (!deletedCategory) {
      throw new Error("Failed to delete category");
    }
    
    // Revalidate the categories page
    revalidatePath("/forum/admin/categories");
    
    return { success: true };
  } catch (error) {
    console.error("Error deleting category:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete category"
    }
  }
}
