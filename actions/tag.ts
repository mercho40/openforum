"use server";

import { prisma } from "@/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { slugify } from "@/lib/utils";
import { UserRole } from "@/generated/prisma";

const tagSchema = z.object({
  name: z.string().min(2).max(30),
  description: z.string().max(200).optional(),
  color: z.string().regex(/^#([0-9A-F]{6})$/i).optional(),
});

export async function getTags() {
  try {
    const tags = await prisma.tag.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { threads: true } }
      }
    });

    return { success: true, data: tags };
  } catch (error) {
    console.error("Failed to fetch tags:", error);
    return { success: false, error: "Failed to load tags" };
  }
}

export async function createTag(formData: FormData) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session || session.user.role !== UserRole.admin) {
      return { success: false, error: "Unauthorized" };
    }

    const validatedFields = tagSchema.parse({
      name: formData.get("name"),
      description: formData.get("description"),
      color: formData.get("color"),
    });

    const slug = slugify(validatedFields.name);

    // Check if tag exists
    const existingTag = await prisma.tag.findFirst({
      where: {
        OR: [
          { name: validatedFields.name },
          { slug }
        ]
      }
    });

    if (existingTag) {
      return { success: false, error: "A tag with this name already exists" };
    }

    const tag = await prisma.tag.create({
      data: {
        ...validatedFields,
        slug,
      }
    });

    revalidatePath("/admin/tags");
    return { success: true, data: tag };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }

    console.error("Failed to create tag:", error);
    return { success: false, error: "Failed to create tag" };
  }
}

export async function updateTag(tagId: string, formData: FormData) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session || session.user.role !== UserRole.admin) {
      return { success: false, error: "Unauthorized" };
    }

    const validatedFields = tagSchema.parse({
      name: formData.get("name"),
      description: formData.get("description"),
      color: formData.get("color"),
    });

    const tag = await prisma.tag.findUnique({
      where: { id: tagId }
    });

    if (!tag) {
      return { success: false, error: "Tag not found" };
    }

    let slug = tag.slug;

    if (tag.name !== validatedFields.name) {
      slug = slugify(validatedFields.name);

      // Check if tag exists with new name/slug
      const existingTag = await prisma.tag.findFirst({
        where: {
          OR: [
            { name: validatedFields.name },
            { slug }
          ],
          NOT: { id: tagId }
        }
      });

      if (existingTag) {
        return { success: false, error: "A tag with this name already exists" };
      }
    }

    const updatedTag = await prisma.tag.update({
      where: { id: tagId },
      data: {
        ...validatedFields,
        slug,
      }
    });

    revalidatePath("/admin/tags");
    return { success: true, data: updatedTag };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }

    console.error("Failed to update tag:", error);
    return { success: false, error: "Failed to update tag" };
  }
}

export async function deleteTag(tagId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session || session.user.role !== UserRole.admin) {
      return { success: false, error: "Unauthorized" };
    }

    // Check if tag has threads
    const tag = await prisma.tag.findUnique({
      where: { id: tagId },
      include: {
        _count: { select: { threads: true } }
      }
    });

    if (!tag) {
      return { success: false, error: "Tag not found" };
    }

    if (tag._count.threads > 0) {
      return { success: false, error: "Cannot delete tag that is used by threads" };
    }

    await prisma.tag.delete({
      where: { id: tagId }
    });

    revalidatePath("/admin/tags");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete tag:", error);
    return { success: false, error: "Failed to delete tag" };
  }
}
