"use server"

import { db } from "@/db/drizzle"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { user } from "@/db/schema"
import { eq } from "drizzle-orm"
import { revalidateTag } from "next/cache"
import { validateWithRateLimit } from "./validation"
import { userProfileSchema } from "@/lib/validation-schemas"

interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  emailNotifications: {
    threadReplies: boolean
    mentions: boolean
    newsletter: boolean
    securityAlerts: boolean
  }
  privacy: {
    showEmail: boolean
    showOnlineStatus: boolean
    allowDirectMessages: boolean
  }
  display: {
    postsPerPage: number
    timezone: string
    language: string
  }
}

interface AccountSettings {
  email: string
  username?: string
  displayUsername?: string
  bio?: string
  signature?: string
  website?: string
  location?: string
}

interface SecuritySettings {
  twoFactorEnabled: boolean
  currentPassword?: string
  newPassword?: string
  confirmPassword?: string
}

export async function getUserPreferences(): Promise<{
  success: boolean
  preferences?: UserPreferences
  error?: string
}> {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user?.id) {
      throw new Error("Not authenticated")
    }

    const userData = await db.query.user.findFirst({
      where: eq(user.id, session.user.id),
      columns: {
        metadata: true
      }
    })

    let preferences: UserPreferences = {
      theme: 'system',
      emailNotifications: {
        threadReplies: true,
        mentions: true,
        newsletter: false,
        securityAlerts: true
      },
      privacy: {
        showEmail: false,
        showOnlineStatus: true,
        allowDirectMessages: true
      },
      display: {
        postsPerPage: 20,
        timezone: 'UTC',
        language: 'en'
      }
    }

    // Parse existing preferences from metadata
    if (userData?.metadata) {
      try {
        const parsed = JSON.parse(userData.metadata)
        if (parsed.preferences) {
          preferences = { ...preferences, ...parsed.preferences }
        }
      } catch (error) {
        console.error("Error parsing user preferences:", error)
      }
    }

    return { success: true, preferences }
  } catch (error) {
    console.error("Error fetching user preferences:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch preferences"
    }
  }
}

export async function updateUserPreferences(preferences: Partial<UserPreferences>): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user?.id) {
      throw new Error("Not authenticated")
    }

    // Get current metadata
    const userData = await db.query.user.findFirst({
      where: eq(user.id, session.user.id),
      columns: {
        metadata: true
      }
    })

    let currentMetadata = {}
    if (userData?.metadata) {
      try {
        currentMetadata = JSON.parse(userData.metadata)
      } catch (error) {
        console.error("Error parsing current metadata:", error)
      }
    }

    // Update preferences in metadata
    const updatedMetadata = {
      ...currentMetadata,
      preferences: {
        ...((currentMetadata as any).preferences || {}),
        ...preferences
      }
    }

    await auth.api.updateUser({
      body: {
        metadata: JSON.stringify(updatedMetadata)
      },
      headers: await headers()
    })

    // Invalidate caches
    revalidateTag(`user-${session.user.id}`)
    revalidateTag(`user-profile-${session.user.id}`)

    return { success: true }
  } catch (error) {
    console.error("Error updating user preferences:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update preferences"
    }
  }
}

export async function updateAccountSettings(settings: Partial<AccountSettings>): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const validation = await validateWithRateLimit(
      userProfileSchema,
      settings,
      "update-profile",
      { windowMs: 60000, maxRequests: 5 } // 5 updates per minute
    )

    if (!validation.success) {
      return {
        success: false,
        error: validation.error
      }
    }

    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user?.id) {
      throw new Error("Not authenticated")
    }

    // Check if username is taken (if being updated)
    if (settings.username && settings.username !== session.user.username) {
      const existingUser = await db.query.user.findFirst({
        where: eq(user.username, settings.username),
        columns: { id: true }
      })

      if (existingUser && existingUser.id !== session.user.id) {
        throw new Error("Username is already taken")
      }
    }

    // Update user profile
    await auth.api.updateUser({
      body: {
        username: settings.username,
        displayUsername: settings.displayUsername,
        bio: settings.bio,
        signature: settings.signature,
        website: settings.website,
        location: settings.location
      },
      headers: await headers()
    })

    // Invalidate caches
    revalidateTag(`user-${session.user.id}`)
    revalidateTag(`user-profile-${session.user.id}`)
    revalidateTag('forum-members')
    revalidateTag('get-threads') // Username changes affect thread displays

    return { success: true }
  } catch (error) {
    console.error("Error updating account settings:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update account settings"
    }
  }
}

export async function updateSecuritySettings(settings: SecuritySettings): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user?.id) {
      throw new Error("Not authenticated")
    }

    // If updating password, validate current password first
    if (settings.newPassword) {
      if (!settings.currentPassword) {
        throw new Error("Current password is required")
      }

      if (settings.newPassword !== settings.confirmPassword) {
        throw new Error("New passwords do not match")
      }

      // Validate password strength
      if (settings.newPassword.length < 8) {
        throw new Error("New password must be at least 8 characters long")
      }

      // Update password using auth context
      const ctx = await auth.$context
      const newPasswordHash = await ctx.password.hash(settings.newPassword)
      await ctx.internalAdapter.updatePassword(session.user.id, newPasswordHash)
    }

    // Handle 2FA settings
    if (settings.twoFactorEnabled !== undefined) {
      // In a real implementation, you would handle 2FA setup/disable here
      // This would involve generating TOTP secrets, QR codes, etc.
      console.log("2FA toggle requested:", settings.twoFactorEnabled)
    }

    // Invalidate caches
    revalidateTag(`user-${session.user.id}`)

    return { success: true }
  } catch (error) {
    console.error("Error updating security settings:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update security settings"
    }
  }
}

export async function deleteAccount(): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user?.id) {
      throw new Error("Not authenticated")
    }

    // In a real implementation, you might want to:
    // 1. Anonymize user's posts instead of deleting
    // 2. Keep account for X days before permanent deletion
    // 3. Send confirmation email
    // 4. Handle data export requests

    // For now, we'll just mark the account as deleted
    await db.update(user)
      .set({
        banned: true,
        banReason: "Account deleted by user",
        email: `deleted_${session.user.id}@deleted.local`,
        name: "Deleted User",
        bio: null,
        signature: null,
        website: null,
        location: null
      })
      .where(eq(user.id, session.user.id))

    // Invalidate all related caches
    revalidateTag(`user-${session.user.id}`)
    revalidateTag(`user-profile-${session.user.id}`)
    revalidateTag('forum-members')
    revalidateTag('get-threads')

    return { success: true }
  } catch (error) {
    console.error("Error deleting account:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete account"
    }
  }
}

export async function exportUserData(): Promise<{
  success: boolean
  data?: string
  error?: string
}> {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user?.id) {
      throw new Error("Not authenticated")
    }

    // Get user data
    const userData = await db.query.user.findFirst({
      where: eq(user.id, session.user.id)
    })

    // Get user's threads and posts
    const threads = await db.query.thread.findMany({
      where: eq(user.id, session.user.id),
      with: {
        category: true
      }
    })

    const posts = await db.query.post.findMany({
      where: eq(user.id, session.user.id),
      with: {
        thread: {
          with: {
            category: true
          }
        }
      }
    })

    const exportData = {
      exportDate: new Date().toISOString(),
      user: {
        id: userData?.id,
        name: userData?.name,
        email: userData?.email,
        username: userData?.username,
        displayUsername: userData?.displayUsername,
        bio: userData?.bio,
        signature: userData?.signature,
        website: userData?.website,
        location: userData?.location,
        reputation: userData?.reputation,
        createdAt: userData?.createdAt
      },
      threads: threads.map(thread => ({
        id: thread.id,
        title: thread.title,
        slug: thread.slug,
        createdAt: thread.createdAt,
        category: thread.category?.name,
        viewCount: thread.viewCount,
        replyCount: thread.replyCount
      })),
      posts: posts.map(post => ({
        id: post.id,
        content: post.content,
        createdAt: post.createdAt,
        threadTitle: post.thread?.title,
        category: post.thread?.category?.name
      }))
    }

    return {
      success: true,
      data: JSON.stringify(exportData, null, 2)
    }
  } catch (error) {
    console.error("Error exporting user data:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to export user data"
    }
  }
}
