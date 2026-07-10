"use server"

import { z } from "zod"
import { checkRateLimit } from "./security"
import {
  threadSchema,
  postSchema,
  userProfileSchema,
  categorySchema,
  reportSchema
} from "@/lib/validation-schemas"

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

// Utility functions are now in lib/validation-utils
// import {
//   sanitizeContent,
//   containsProfanity,
//   isSpam,
//   extractUrls,
//   validateImageUrl,
//   validateUsername,
//   handleActionError
// } from "@/lib/validation-utils"
