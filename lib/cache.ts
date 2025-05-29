import { unstable_cache } from 'next/cache'
import { revalidateTag } from 'next/cache'

// Cache tags for different data types
export const CACHE_TAGS = {
  CATEGORIES: 'categories',
  THREADS: 'threads',
  POSTS: 'posts',
  USERS: 'users',
  TAGS: 'tags',
  THREAD_VIEWS: 'thread-views',
  REACTIONS: 'reactions',
  BOOKMARKS: 'bookmarks',
  NOTIFICATIONS: 'notifications',
  // Specific item tags
  CATEGORY: (id: string) => `category-${id}`,
  THREAD: (id: string) => `thread-${id}`,
  POST: (id: string) => `post-${id}`,
  USER: (id: string) => `user-${id}`,
  TAG: (id: string) => `tag-${id}`,
} as const

// Cache durations in seconds
export const CACHE_DURATIONS = {
  SHORT: 60,        // 1 minute
  MEDIUM: 300,      // 5 minutes
  LONG: 3600,       // 1 hour
  VERY_LONG: 86400, // 24 hours
} as const

// Utility function to create cached functions
export function createCachedFunction<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  keyPrefix: string,
  tags: string[],
  revalidate: number = CACHE_DURATIONS.MEDIUM
) {
  return unstable_cache(
    fn,
    [keyPrefix],
    {
      tags,
      revalidate,
    }
  )
}

// Utility to invalidate cache by tags
export function invalidateCache(tags: string | string[]) {
  const tagArray = Array.isArray(tags) ? tags : [tags]
  tagArray.forEach(tag => revalidateTag(tag))
}

// Pre-built cache functions for common operations
export const cachedQueries = {
  // Categories
  getCategories: (fn: () => Promise<unknown>) => 
    createCachedFunction(fn, 'get-categories', [CACHE_TAGS.CATEGORIES], CACHE_DURATIONS.LONG),
  
  getCategoryWithThreads: (fn: (slug: string, page: number, perPage: number) => Promise<unknown>) =>
    createCachedFunction(fn, 'get-category-with-threads', [CACHE_TAGS.CATEGORIES, CACHE_TAGS.THREADS], CACHE_DURATIONS.MEDIUM),

  // Threads
  getThreadWithPosts: (fn: (slug: string, page: number, perPage: number) => Promise<unknown>) =>
    createCachedFunction(fn, 'get-thread-with-posts', [CACHE_TAGS.THREADS, CACHE_TAGS.POSTS], CACHE_DURATIONS.MEDIUM),

  getHomePageThreads: (fn: () => Promise<unknown>) =>
    createCachedFunction(fn, 'get-homepage-threads', [CACHE_TAGS.THREADS], CACHE_DURATIONS.SHORT),

  // Tags
  getAllTags: (fn: (options?: Record<string, unknown>) => Promise<unknown>) =>
    createCachedFunction(fn, 'get-all-tags', [CACHE_TAGS.TAGS], CACHE_DURATIONS.LONG),

  // Users
  getUserProfile: (fn: (id: string) => Promise<unknown>) =>
    createCachedFunction(fn, 'get-user-profile', [CACHE_TAGS.USERS], CACHE_DURATIONS.MEDIUM),
}

// Helper for conditional caching based on user authentication
export function getCacheKeyForUser(baseKey: string, userId?: string) {
  return userId ? `${baseKey}-user-${userId}` : `${baseKey}-anonymous`
}

// Cache warming functions
export async function warmCache() {
  // This could be called to pre-populate cache with commonly accessed data
  console.log('Warming cache...')
  // Implementation would depend on your specific needs
}

// Cache statistics (for debugging/monitoring)
export function getCacheStats() {
  // This would return cache hit/miss statistics if available
  return {
    // Implementation would depend on your monitoring needs
  }
}

// Enhanced cache utilities for production use
export const cacheMonitoring = {
  stats: {
    hits: 0,
    misses: 0,
    invalidations: 0,
  },
  
  recordHit() { this.stats.hits++ },
  recordMiss() { this.stats.misses++ },
  recordInvalidation() { this.stats.invalidations++ },
  
  getStats() {
    return {
      ...this.stats,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0
    }
  },
  
  reset() {
    this.stats.hits = 0
    this.stats.misses = 0
    this.stats.invalidations = 0
  }
}

// Cache warming for common data
export async function warmCommonCache() {
  try {
    console.log('Starting cache warming...')
    // These would be common operations to pre-populate cache
    const operations: Promise<unknown>[] = [
      // Could add specific warming operations here
    ]
    
    await Promise.allSettled(operations)
    console.log('Cache warming completed successfully')
  } catch (error) {
    console.error('Cache warming failed:', error)
  }
}
