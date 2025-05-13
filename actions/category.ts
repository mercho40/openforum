"use server";

import { prisma } from "@/prisma"
import { headers } from "next/headers";

import { auth } from "@/lib/auth"; // path to Better Auth server instance
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { slugify } from "@/lib/utils";
import { UserRole } from "@/generated/prisma";

const categorySchema = z.object({
  name: z.string().min(3).max(50),
  description: z.string().max(500).optional(),
  parentId: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.number().optional().default(0),
});

export async function getCategories() {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        parent: true,
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        },
        _count: {
          select: { threads: true }
        }
      }
    });

    return { success: true, data: categories };
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return { success: false, error: "Failed to load categories" };
  }
}

export async function getCategoryBySlug(slug: string) {
  try {
    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        parent: true,
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        },
        threads: {
          orderBy: { updatedAt: "desc" },
          take: 10,
          include: {
            author: { select: { id: true, name: true, image: true } },
            category: { select: { id: true, name: true, slug: true } },
            _count: { select: { posts: true, views: true } }
          }
        }
      }
    });

    if (!category) {
      return { success: false, error: "Category not found" };
    }

    return { success: true, data: category };
  } catch (error) {
    console.error("Failed to fetch category:", error);
    return { success: false, error: "Failed to load category" };
  }
}

export async function createCategory(formData: FormData) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session || session.user.role !== UserRole.admin) {
      return { success: false, error: "Unauthorized" };
    }

    const validatedFields = categorySchema.parse({
      name: formData.get("name"),
      description: formData.get("description"),
      parentId: formData.get("parentId"),
      isActive: formData.get("isActive") === "true",
      sortOrder: Number(formData.get("sortOrder") || 0),
    });

    const slug = slugify(validatedFields.name);

    // Check if slug exists
    const existingCategory = await prisma.category.findUnique({
      where: { slug }
    });

    if (existingCategory) {
      return { success: false, error: "A category with this name already exists" };
    }

    const category = await prisma.category.create({
      data: {
        ...validatedFields,
        slug,
      }
    });

    revalidatePath("/categories");
    return { success: true, data: category };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }

    console.error("Failed to create category:", error);
    return { success: false, error: "Failed to create category" };
  }
}

export async function updateCategory(categoryId: string, formData: FormData) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session || session.user.role !== UserRole.admin) {
      return { success: false, error: "Unauthorized" };
    }

    const validatedFields = categorySchema.parse({
      name: formData.get("name"),
      description: formData.get("description"),
      parentId: formData.get("parentId"),
      isActive: formData.get("isActive") === "true",
      sortOrder: Number(formData.get("sortOrder") || 0),
    });

    // If name changed, update slug
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      return { success: false, error: "Category not found" };
    }

    let slug = category.slug;

    if (category.name !== validatedFields.name) {
      slug = slugify(validatedFields.name);

      // Check if slug exists
      const existingCategory = await prisma.category.findUnique({
        where: { slug }
      });

      if (existingCategory && existingCategory.id !== categoryId) {
        return { success: false, error: "A category with this name already exists" };
      }
    }

    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: {
        ...validatedFields,
        slug,
      }
    });

    revalidatePath("/categories");
    revalidatePath(`/categories/${slug}`);
    return { success: true, data: updatedCategory };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }

    console.error("Failed to update category:", error);
    return { success: false, error: "Failed to update category" };
  }
}

export async function deleteCategory(categoryId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session || session.user.role !== UserRole.admin) {
      return { success: false, error: "Unauthorized" };
    }

    // Check if category has threads
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: { select: { threads: true } }
      }
    });

    if (!category) {
      return { success: false, error: "Category not found" };
    }

    if (category._count.threads > 0) {
      return { success: false, error: "Cannot delete category with threads" };
    }

    await prisma.category.delete({
      where: { id: categoryId }
    });

    revalidatePath("/categories");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete category:", error);
    return { success: false, error: "Failed to delete category" };
  }
}

export async function addCategoryModerator(categoryId: string, userId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session || session.user.role !== UserRole.admin) {
      return { success: false, error: "Unauthorized" };
    }

    const moderator = await prisma.categoryModerator.create({
      data: {
        categoryId,
        userId
      }
    });

    revalidatePath(`/admin/categories/${categoryId}`);
    return { success: true, data: moderator };
  } catch (error) {
    console.error("Failed to add moderator:", error);
    return { success: false, error: "Failed to add moderator" };
  }
}

export async function removeCategoryModerator(moderatorId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session || session.user.role !== UserRole.admin) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.categoryModerator.delete({
      where: { id: moderatorId }
    });

    revalidatePath("/admin/categories");
    return { success: true };
  } catch (error) {
    console.error("Failed to remove moderator:", error);
    return { success: false, error: "Failed to remove moderator" };
  }
}
