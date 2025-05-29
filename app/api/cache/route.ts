/**
 * Cache Management API
 * Provides endpoints for cache monitoring, invalidation, and warming
 */

import { NextRequest, NextResponse } from 'next/server'
import { CacheMonitor, CacheWarmer } from '@/lib/cache-middleware'
import { invalidateCache, CACHE_TAGS, warmCommonCache } from '@/lib/cache'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

// GET /api/cache/stats - Get cache statistics
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    // Only allow admins to view cache stats
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const monitor = CacheMonitor.getInstance()
    const stats = monitor.getStats()

    return NextResponse.json({
      success: true,
      stats
    })
  } catch (error) {
    console.error('Error fetching cache stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cache statistics' },
      { status: 500 }
    )
  }
}

// POST /api/cache/invalidate - Invalidate specific cache tags
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    // Only allow admins to invalidate cache
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { tags, all = false } = await request.json()

    if (all) {
      // Invalidate all cache tags
      const allTags = Object.values(CACHE_TAGS).filter(tag => typeof tag === 'string')
      invalidateCache(allTags as string[])
      
      return NextResponse.json({
        success: true,
        message: 'All cache invalidated',
        invalidatedTags: allTags
      })
    }

    if (!tags || !Array.isArray(tags)) {
      return NextResponse.json(
        { error: 'Invalid tags parameter' },
        { status: 400 }
      )
    }

    invalidateCache(tags)

    return NextResponse.json({
      success: true,
      message: 'Cache invalidated successfully',
      invalidatedTags: tags
    })
  } catch (error) {
    console.error('Error invalidating cache:', error)
    return NextResponse.json(
      { error: 'Failed to invalidate cache' },
      { status: 500 }
    )
  }
}

// PUT /api/cache/warm - Warm cache with common data
export async function PUT() {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    // Only allow admins to warm cache
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await warmCommonCache()
    await CacheWarmer.warmCache()

    return NextResponse.json({
      success: true,
      message: 'Cache warming initiated'
    })
  } catch (error) {
    console.error('Error warming cache:', error)
    return NextResponse.json(
      { error: 'Failed to warm cache' },
      { status: 500 }
    )
  }
}

// DELETE /api/cache/reset - Reset cache statistics
export async function DELETE() {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    // Only allow admins to reset cache stats
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const monitor = CacheMonitor.getInstance()
    monitor.reset()

    return NextResponse.json({
      success: true,
      message: 'Cache statistics reset'
    })
  } catch (error) {
    console.error('Error resetting cache stats:', error)
    return NextResponse.json(
      { error: 'Failed to reset cache statistics' },
      { status: 500 }
    )
  }
}
