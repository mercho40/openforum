"use server"

import { db } from "@/db/drizzle"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { user } from "@/db/schema"
import { eq } from "drizzle-orm"
import { revalidateTag } from "next/cache"

type UserRole = 'user' | 'moderator' | 'admin'

interface PermissionCheck {
  canModerate: boolean
  canEditAnyPost: boolean
  canDeleteAnyPost: boolean
  canBanUsers: boolean
  canManageCategories: boolean
  canViewReports: boolean
  canManageRoles: boolean
}

export async function checkPermissions(userId?: string): Promise<PermissionCheck> {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    const targetUserId = userId || session?.user?.id
    if (!targetUserId) {
      return getDefaultPermissions()
    }

    const userData = await db.query.user.findFirst({
      where: eq(user.id, targetUserId),
      columns: {
        role: true
      }
    })

    const role = userData?.role as UserRole || 'user'
    
    return getPermissionsForRole(role)
  } catch (error) {
    console.error("Error checking permissions:", error)
    return getDefaultPermissions()
  }
}

function getPermissionsForRole(role: UserRole): PermissionCheck {
  switch (role) {
    case 'admin':
      return {
        canModerate: true,
        canEditAnyPost: true,
        canDeleteAnyPost: true,
        canBanUsers: true,
        canManageCategories: true,
        canViewReports: true,
        canManageRoles: true
      }
    case 'moderator':
      return {
        canModerate: true,
        canEditAnyPost: true,
        canDeleteAnyPost: true,
        canBanUsers: false, // Only admins can ban
        canManageCategories: false,
        canViewReports: true,
        canManageRoles: false
      }
    case 'user':
    default:
      return getDefaultPermissions()
  }
}

function getDefaultPermissions(): PermissionCheck {
  return {
    canModerate: false,
    canEditAnyPost: false,
    canDeleteAnyPost: false,
    canBanUsers: false,
    canManageCategories: false,
    canViewReports: false,
    canManageRoles: false
  }
}

export async function updateUserRole(targetUserId: string, newRole: UserRole) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user?.id) {
      throw new Error("Not authenticated")
    }

    // Only admins can change roles
    if (session.user.role !== "admin") {
      throw new Error("Not authorized to change user roles")
    }

    // Prevent demoting the last admin
    if (newRole !== 'admin') {
      const adminCount = await db.query.user.findMany({
        where: eq(user.role, 'admin'),
        columns: { id: true }
      })

      if (adminCount.length === 1 && adminCount[0].id === targetUserId) {
        throw new Error("Cannot demote the last admin")
      }
    }

    await db.update(user)
      .set({ role: newRole })
      .where(eq(user.id, targetUserId))

    // Invalidate relevant caches
    revalidateTag(`user-${targetUserId}`)
    revalidateTag(`user-profile-${targetUserId}`)
    revalidateTag('forum-members')
    revalidateTag('admin-users')

    return { success: true }
  } catch (error) {
    console.error("Error updating user role:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update user role"
    }
  }
}

export async function getRoleStats() {
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

    const users = await db.query.user.findMany({
      columns: {
        role: true
      }
    })

    const stats = {
      admins: users.filter(u => u.role === 'admin').length,
      moderators: users.filter(u => u.role === 'moderator').length,
      users: users.filter(u => !u.role || u.role === 'user').length
    }

    return { success: true, stats }
  } catch (error) {
    console.error("Error fetching role stats:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch role stats",
      stats: { admins: 0, moderators: 0, users: 0 }
    }
  }
}

export async function requirePermission(permission: keyof PermissionCheck) {
  const permissions = await checkPermissions()
  
  if (!permissions[permission]) {
    throw new Error(`Permission denied: ${permission}`)
  }
  
  return true
}

// Utility function to check if user owns content or has permission
export async function canModifyContent(
  contentAuthorId: string,
  requirePermission?: keyof PermissionCheck
): Promise<boolean> {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user?.id) {
      return false
    }

    // Owner can always modify their content
    if (session.user.id === contentAuthorId) {
      return true
    }

    // Check if user has the required permission
    if (requirePermission) {
      const permissions = await checkPermissions()
      return permissions[requirePermission]
    }

    return false
  } catch (error) {
    console.error("Error checking content modification permissions:", error)
    return false
  }
}
