"use server"

import { prisma } from "@/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"

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
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user?.id) {
      throw new Error("Not authenticated")
    }

    // Filter out undefined values
    const updatableData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined)
    )

    // Update the user profile
    const updatedUser = await prisma.user.update({
      where: {
        id: session.user.id
      },
      data: updatableData
    })

    // Revalidate relevant paths
    revalidatePath('/profile')
    revalidatePath('/')

    return { success: true, user: updatedUser }
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
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user?.id) {
      throw new Error("Not authenticated")
    }

    // Store this information in the user's metadata
    await prisma.user.update({
      where: {
        id: session.user.id
      },
      data: {
        // Using the 'metadata' field from the schema to store this flag
        metadata: JSON.stringify({ profileSetupSeen: true })
      }
    })

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

    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id
      },
      select: {
        bio: true,
        image: true,
        metadata: true
      }
    })

    // Parse metadata if it exists
    const metadata = user?.metadata ? JSON.parse(user.metadata as string) : {}

    console.log("isComplete: ", Boolean(user?.bio || user?.image), "haSeenSetup:  ", Boolean(metadata.profileSetupSeen))

    return {
      success: true,
      isComplete: Boolean(user?.bio || user?.image),
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

    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id
      },
      select: {
        bio: true,
        image: true,
        metadata: true
      }
    })

    // Parse metadata if it exists
    const metadata = user?.metadata ? JSON.parse(user.metadata as string) : {}

    return {
      success: true,
      user: { ...user, metadata }
    }
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch profile"
    }
  }
}
