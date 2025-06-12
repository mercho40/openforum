"use server"

import { db } from "@/db/drizzle"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { user } from "@/db/schema"
import { eq } from "drizzle-orm"

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

interface RateLimitOptions {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
  identifier?: string // Optional custom identifier
}

export async function checkRateLimit(
  action: string,
  options: RateLimitOptions
): Promise<{ allowed: boolean; resetTime?: number }> {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    // Use custom identifier or fall back to user ID or IP
    const clientId = options.identifier || session?.user?.id || "anonymous"
    const key = `${action}:${clientId}`
    
    const now = Date.now()
    const existing = rateLimitStore.get(key)
    
    if (!existing || now > existing.resetTime) {
      // Reset the window
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + options.windowMs
      })
      return { allowed: true }
    }
    
    if (existing.count >= options.maxRequests) {
      return { 
        allowed: false, 
        resetTime: existing.resetTime 
      }
    }
    
    // Increment count
    rateLimitStore.set(key, {
      count: existing.count + 1,
      resetTime: existing.resetTime
    })
    
    return { allowed: true }
    
  } catch (error) {
    console.error("Rate limit check failed:", error)
    // Allow request if rate limiting fails
    return { allowed: true }
  }
}

export async function banUser(userId: string, reason: string, expiresAt?: Date) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user?.id) {
      throw new Error("Not authenticated")
    }

    if (session.user.role !== "admin") {
      throw new Error("Not authorized")
    }

    await db.update(user)
      .set({
        banned: true,
        banReason: reason,
        banExpires: expiresAt || null
      })
      .where(eq(user.id, userId))

    return { success: true }
  } catch (error) {
    console.error("Error banning user:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to ban user"
    }
  }
}

export async function unbanUser(userId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user?.id) {
      throw new Error("Not authenticated")
    }

    if (session.user.role !== "admin") {
      throw new Error("Not authorized")
    }

    await db.update(user)
      .set({
        banned: false,
        banReason: null,
        banExpires: null
      })
      .where(eq(user.id, userId))

    return { success: true }
  } catch (error) {
    console.error("Error unbanning user:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to unban user"
    }
  }
}

export async function checkUserBan(userId: string) {
  try {
    const userData = await db.query.user.findFirst({
      where: eq(user.id, userId),
      columns: {
        banned: true,
        banReason: true,
        banExpires: true
      }
    })

    if (!userData) {
      return { banned: false }
    }

    // Check if ban has expired
    if (userData.banned && userData.banExpires && new Date() > userData.banExpires) {
      // Auto-unban
      await unbanUser(userId)
      return { banned: false }
    }

    return {
      banned: userData.banned || false,
      reason: userData.banReason,
      expiresAt: userData.banExpires
    }
  } catch (error) {
    console.error("Error checking user ban:", error)
    return { banned: false }
  }
}
