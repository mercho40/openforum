"use server"

import { db } from "@/db/drizzle"
import { tag, threadTag } from "@/db/schema"
import { eq, sql, asc } from "drizzle-orm"
import { revalidateTag } from "next/cache"
import { slugify } from "@/lib/utils"
import { unstable_cacheTag as cacheTag } from 'next/cache'
import { unstable_cacheLife as cacheLife } from 'next/cache'

interface TagCreateData {
  name: string
  description?: string
  color?: string
}

interface TagUpdateData {
  name?: string
  description?: string
  color?: string
}

// Create a new tag
export async function createTag(data: TagCreateData) {
  try {
    const slug = slugify(data.name)
    const color = data.color || "#3498db"

    // Check if tag with same name or slug exists
    const existing = await db.query.tag.findFirst({
      where: sql`${tag.name} = ${data.name} OR ${tag.slug} = ${slug}`
    })
    if (existing) {
      throw new Error("A tag with this name or slug already exists.")
    }

    const [result] = await db.insert(tag)
      .values({
        name: data.name,
        slug,
        description: data.description,
        color
      })
      .returning({ id: tag.id, name: tag.name, slug: tag.slug, description: tag.description, color: tag.color })

    revalidateTag("get-tags")
    return { success: true, tag: result }
  } catch (error) {
    console.error("Error creating tag:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create tag"
    }
  }
}

// Update an existing tag by ID
export async function updateTag(tagId: string, data: TagUpdateData) {
  try {
    let updateValues: any = { ...data }
    if (data.name) {
      updateValues.slug = slugify(data.name)
    }

    await db.update(tag)
      .set(updateValues)
      .where(eq(tag.id, tagId))

    revalidateTag("get-tags")
    return { success: true }
  } catch (error) {
    console.error("Error updating tag:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update tag"
    }
  }
}

// Delete a tag by ID
export async function deleteTag(tagId: string) {
  try {
    // Remove tag associations from threads first (optional; may be onDelete: cascade)
    await db.delete(threadTag).where(eq(threadTag.tagId, tagId))
    // Delete the tag itself
    await db.delete(tag).where(eq(tag.id, tagId))

    revalidateTag("get-tags")
    return { success: true }
  } catch (error) {
    console.error("Error deleting tag:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete tag"
    }
  }
}

// Get all tags (optionally with search)
export async function getAllTags(options?: { search?: string, limit?: number }) {
  "use cache"
  cacheTag('get-tags')
  cacheLife("hours")
  try {
    const { search, limit = 100 } = options || {}
    let tags

    if (search) {
      tags = await db.query.tag.findMany({
        where: sql`${tag.name} ILIKE ${'%' + search + '%'} OR ${tag.slug} ILIKE ${'%' + search + '%'}`,
        orderBy: [asc(tag.name)],
        limit,
      })
    } else {
      tags = await db.query.tag.findMany({
        orderBy: [asc(tag.name)],
        limit,
      })
    }

    return { success: true, tags }
  } catch (error) {
    console.error("Error fetching tags:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch tags",
      tags: []
    }
  }
}

// Get a single tag by ID or slug
export async function getTagByIdOrSlug(idOrSlug: string) {
  "use cache"
  cacheTag('get-tags')
  cacheLife("hours")
  try {
    const tagResult = await db.query.tag.findFirst({
      where: sql`${tag.id} = ${idOrSlug} OR ${tag.slug} = ${idOrSlug}`
    })
    if (!tagResult) {
      return { success: false, error: "Tag not found" }
    }
    return { success: true, tag: tagResult }
  } catch (error) {
    console.error("Error fetching tag:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch tag"
    }
  }
}
