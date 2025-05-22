"use server"

import { db } from "@/db/drizzle"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { category, thread, categorySubscription } from "@/db/schema"
import { eq, desc, asc, and } from "drizzle-orm"
import { slugify } from "@/lib/utils" // You'll need to create this utility
import { count } from 'drizzle-orm'
import { z } from "zod"

const createCategorySchema = z.object({
  name: z.string().min(3).max(50),
  description: z.string().optional(),
  displayOrder: z.number().int().min(0).default(0),
  isHidden: z.boolean().default(false),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format").default("#3498db"),
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
    // Get category
    const categoryData = await db.query.category.findFirst({
      where: eq(category.slug, slug)
    })

    if (!categoryData) {
      throw new Error("Category not found")
    }

    // Get threads with pagination
    const offset = (page - 1) * perPage

    const threads = await db.query.thread.findMany({
      where: eq(thread.categoryId, categoryData.id),
      with: {
        author: {
          columns: {
            id: true,
            name: true,
            username: true,
            displayUsername: true,
            image: true
          }
        },
        category: true,
        lastPost: {
          with: {
            author: {
              columns: {
                id: true,
                name: true,
                username: true,
                displayUsername: true,
                image: true
              }
            }
          }
        }
      },
      orderBy: [
        desc(thread.isPinned),
        desc(thread.lastPostAt)
      ],
      offset,
      limit: perPage
    })

    // Get total thread count for pagination
    const totalCount = await db.select({
      count: count(),
    })
      .from(thread)
      .where(eq(thread.categoryId, categoryData.id))

    return {
      success: true,
      category: categoryData,
      threads,
      pagination: {
        total: Number(totalCount),
        page,
        perPage,
        totalPages: Math.ceil(Number(totalCount) / perPage)
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
