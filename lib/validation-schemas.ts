import { z } from "zod"

export const threadSchema = z.object({
  title: z.string()
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title must not exceed 200 characters")
    .refine(title => title.trim().length > 0, "Title cannot be empty"),
  content: z.string()
    .min(10, "Content must be at least 10 characters")
    .max(10000, "Content must not exceed 10,000 characters"),
  categoryId: z.string().min(1, "Category is required"),
  tags: z.array(z.string()).max(5, "Maximum 5 tags allowed").optional()
})

export const postSchema = z.object({
  content: z.string()
    .min(1, "Content is required")
    .max(5000, "Content must not exceed 5,000 characters"),
  threadId: z.string().min(1, "Thread ID is required")
})

export const userProfileSchema = z.object({
  bio: z.string().max(500, "Bio must not exceed 500 characters").optional(),
  signature: z.string().max(200, "Signature must not exceed 200 characters").optional(),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  location: z.string().max(100, "Location must not exceed 100 characters").optional(),
  displayUsername: z.string()
    .min(3, "Display name must be at least 3 characters")
    .max(30, "Display name must not exceed 30 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Display name can only contain letters, numbers, hyphens, and underscores")
    .optional()
})

export const categorySchema = z.object({
  name: z.string()
    .min(3, "Category name must be at least 3 characters")
    .max(50, "Category name must not exceed 50 characters"),
  description: z.string()
    .max(200, "Description must not exceed 200 characters")
    .optional(),
  color: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color")
    .optional(),
  iconClass: z.string().optional()
})

export const reportSchema = z.object({
  targetType: z.enum(['post', 'thread', 'user']),
  targetId: z.string().min(1, "Target ID is required"),
  reason: z.enum([
    'spam',
    'harassment',
    'inappropriate_content',
    'misinformation',
    'copyright_violation',
    'other'
  ]),
  description: z.string()
    .max(1000, "Description must not exceed 1,000 characters")
    .optional()
})
