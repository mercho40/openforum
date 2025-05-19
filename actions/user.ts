"use server"

import { db } from "@/db/drizzle"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { Session } from "@/lib/auth"
import { user } from "@/db/schema" // Import the user table from your schema
import { eq } from "drizzle-orm"

interface ProfileUpdateData {
  bio?: string
  signature?: string
  website?: string
  location?: string
  displayUsername?: string
  image?: string
}

export async function updateUserProfile(data: ProfileUpdateData) {
  try {
    const session: Session | null = await auth.api.getSession({
      headers: await headers()
    })
    if (!session?.user?.id) {
      throw new Error("Not authenticated")
    }

    // Filter out undefined values
    const updatableData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined)
    )

    // Use Drizzle to update the user
    await db.update(user)
      .set({
        bio: updatableData.bio,
        signature: updatableData.signature,
        website: updatableData.website,
        location: updatableData.location,
        displayUsername: updatableData.displayUsername,
        image: updatableData.image,
        updatedAt: new Date() // Update the updatedAt timestamp
      })
      .where(eq(user.id, session.user.id));

    revalidatePath('/profile')
    revalidatePath('/')

    return { success: true }
  } catch (error) {
    console.error("Error updating user profile:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update profile"
    }
  }
}

// Track if the user has seen the profile completion form
export async function markProfileSetupSeen() {
  try {
    const session: Session | null = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user?.id) {
      throw new Error("Not authenticated")
    }

    // Use Drizzle to update metadata
    await db.update(user)
      .set({
        metadata: JSON.stringify({ profileSetupSeen: true }),
        updatedAt: new Date()
      })
      .where(eq(user.id, session.user.id));

    return { success: true }
  } catch (error) {
    console.error("Error marking profile setup as seen:", error)
    return { success: false }
  }
}

// Check if user has completed their profile
export async function checkProfileCompletion() {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user?.id) {
      throw new Error("Not authenticated")
    }

    const users = await db.select({
      bio: user.bio,
      image: user.image,
      metadata: user.metadata
    })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    const userData = users[0];

    // Parse metadata if it exists
    const metadata = userData?.metadata ? JSON.parse(userData.metadata as string) : {}

    return {
      success: true,
      isComplete: Boolean(userData?.bio && userData?.image),
      hasSeenSetup: Boolean(metadata.profileSetupSeen)
    }
  } catch (error) {
    console.error("Error checking profile completion:", error)
    return {
      success: false,
      isComplete: false,
      hasSeenSetup: false
    }
  }
}

// Fetch user profile data
export async function fetchUserProfile() {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user?.id) {
      throw new Error("Not authenticated")
    }

    const users = await db.select({
      bio: user.bio,
      image: user.image,
      metadata: user.metadata
    })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    const userData = users[0];

    // Parse metadata if it exists
    const metadata = userData?.metadata ? JSON.parse(userData.metadata as string) : {}

    return {
      success: true,
      user: { ...userData, metadata }
    }
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch profile"
    }
  }
}
