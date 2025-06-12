"use server"

import { z } from "zod"
import { checkRateLimit } from "./security"

// Common validation schemas
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

// Validation wrapper with rate limiting
export async function validateWithRateLimit<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  action: string,
  rateLimitOptions?: { windowMs: number; maxRequests: number }
): Promise<{ 
  success: boolean; 
  data?: T; 
  error?: string; 
  rateLimited?: boolean;
  resetTime?: number;
}> {
  try {
    // Apply rate limiting if specified
    if (rateLimitOptions) {
      const rateLimit = await checkRateLimit(action, rateLimitOptions)
      if (!rateLimit.allowed) {
        return {
          success: false,
          rateLimited: true,
          resetTime: rateLimit.resetTime,
          error: "Rate limit exceeded. Please try again later."
        }
      }
    }

    // Validate data
    const validatedData = schema.parse(data)
    
    return {
      success: true,
      data: validatedData
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => err.message).join(", ")
      return {
        success: false,
        error: errorMessages
      }
    }
    
    return {
      success: false,
      error: "Validation failed"
    }
  }
}

// Content sanitization
export function sanitizeContent(content: string): string {
  // Basic HTML sanitization - in production, use a proper library like DOMPurify
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+="[^"]*"/g, '') // Remove event handlers
    .trim()
}

// Profanity filter (basic implementation)
export function containsProfanity(text: string): boolean {
  const profanityList = [
    // Add your profanity words here
    'badword1', 'badword2' // Example placeholders
  ]
  
  const lowerText = text.toLowerCase()
  return profanityList.some(word => lowerText.includes(word))
}

// Spam detection
export function isSpam(content: string): boolean {
  const spamPatterns = [
    /(.)\1{10,}/i, // Repeated characters
    /(https?:\/\/[^\s]+.*){5,}/i, // Multiple URLs
    /buy now|click here|limited time|act fast/i, // Spam phrases
  ]
  
  return spamPatterns.some(pattern => pattern.test(content))
}

// URL validation and extraction
export function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  return text.match(urlRegex) || []
}

export function validateImageUrl(url: string): boolean {
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg)$/i
  return imageExtensions.test(url)
}

// Username validation
export function validateUsername(username: string): { valid: boolean; error?: string } {
  if (username.length < 3) {
    return { valid: false, error: "Username must be at least 3 characters" }
  }
  
  if (username.length > 30) {
    return { valid: false, error: "Username must not exceed 30 characters" }
  }
  
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return { valid: false, error: "Username can only contain letters, numbers, hyphens, and underscores" }
  }
  
  const reservedNames = ['admin', 'moderator', 'system', 'support', 'help', 'api', 'www']
  if (reservedNames.includes(username.toLowerCase())) {
    return { valid: false, error: "This username is reserved" }
  }
  
  return { valid: true }
}

// Generic error handler for actions
export function handleActionError(error: unknown): { success: false; error: string } {
  console.error("Action error:", error)
  
  if (error instanceof Error) {
    return {
      success: false,
      error: error.message
    }
  }
  
  return {
    success: false,
    error: "An unexpected error occurred"
  }
}
