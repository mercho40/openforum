/**
 * Cache Configuration
 * Centralized cache settings and policies for the forum application
 */

import { CACHE_DURATIONS, CACHE_TAGS } from './cache'

// Page-level cache configurations
export const PAGE_CACHE_CONFIG = {
  // Forum pages
  FORUM_HOME: {
    revalidate: CACHE_DURATIONS.MEDIUM,
    dynamic: 'force-static' as const,
    tags: [CACHE_TAGS.THREADS, CACHE_TAGS.CATEGORIES]
  },
  
  CATEGORIES: {
    revalidate: CACHE_DURATIONS.LONG,
    dynamic: 'force-static' as const,
    tags: [CACHE_TAGS.CATEGORIES]
  },
  
  CATEGORY_DETAIL: {
    revalidate: CACHE_DURATIONS.MEDIUM,
    dynamic: 'force-static' as const,
    tags: [CACHE_TAGS.CATEGORIES, CACHE_TAGS.THREADS]
  },
  
  THREAD_DETAIL: {
    revalidate: CACHE_DURATIONS.MEDIUM,
    dynamic: 'force-static' as const,
    tags: [CACHE_TAGS.THREADS, CACHE_TAGS.POSTS]
  },
  
  // Dynamic pages that need user context
  THREAD_NEW: {
    dynamic: 'force-dynamic' as const
  },
  
  PROFILE: {
    dynamic: 'force-dynamic' as const
  },
  
  ADMIN: {
    dynamic: 'force-dynamic' as const
  }
} as const

// Data fetching cache policies
export const DATA_CACHE_POLICIES = {
  // Categories
  CATEGORIES_LIST: {
    duration: CACHE_DURATIONS.LONG,
    tags: [CACHE_TAGS.CATEGORIES]
  },
  
  CATEGORY_WITH_THREADS: {
    duration: CACHE_DURATIONS.MEDIUM,
    tags: [CACHE_TAGS.CATEGORIES, CACHE_TAGS.THREADS]
  },
  
  // Threads
  THREAD_LIST: {
    duration: CACHE_DURATIONS.MEDIUM,
    tags: [CACHE_TAGS.THREADS]
  },
  
  THREAD_DETAIL: {
    duration: CACHE_DURATIONS.MEDIUM,
    tags: [CACHE_TAGS.THREADS, CACHE_TAGS.POSTS]
  },
  
  TRENDING_THREADS: {
    duration: CACHE_DURATIONS.SHORT,
    tags: [CACHE_TAGS.THREADS]
  },
  
  // Posts
  POST_LIST: {
    duration: CACHE_DURATIONS.MEDIUM,
    tags: [CACHE_TAGS.POSTS]
  },
  
  // Tags
  TAG_LIST: {
    duration: CACHE_DURATIONS.LONG,
    tags: [CACHE_TAGS.TAGS]
  },
  
  // Users
  USER_PROFILE: {
    duration: CACHE_DURATIONS.MEDIUM,
    tags: [CACHE_TAGS.USERS]
  },
  
  USER_ACTIVITY: {
    duration: CACHE_DURATIONS.SHORT,
    tags: [CACHE_TAGS.USERS, CACHE_TAGS.POSTS, CACHE_TAGS.THREADS]
  }
} as const

// Cache invalidation strategies
export const INVALIDATION_STRATEGIES = {
  // When a new thread is created
  NEW_THREAD: [
    CACHE_TAGS.THREADS,
    CACHE_TAGS.CATEGORIES,
    // Also invalidate the specific category
    (categoryId: string) => CACHE_TAGS.CATEGORY(categoryId)
  ],
  
  // When a new post is created
  NEW_POST: [
    CACHE_TAGS.POSTS,
    CACHE_TAGS.THREADS,
    // Also invalidate the specific thread
    (threadId: string) => CACHE_TAGS.THREAD(threadId)
  ],
  
  // When thread is updated
  UPDATE_THREAD: [
    CACHE_TAGS.THREADS,
    (threadId: string) => CACHE_TAGS.THREAD(threadId)
  ],
  
  // When post is updated/deleted
  UPDATE_POST: [
    CACHE_TAGS.POSTS,
    CACHE_TAGS.THREADS,
    (postId: string) => CACHE_TAGS.POST(postId),
    (threadId: string) => CACHE_TAGS.THREAD(threadId)
  ],
  
  // When category is updated
  UPDATE_CATEGORY: [
    CACHE_TAGS.CATEGORIES,
    CACHE_TAGS.THREADS,
    (categoryId: string) => CACHE_TAGS.CATEGORY(categoryId)
  ],
  
  // When tag is updated
  UPDATE_TAG: [
    CACHE_TAGS.TAGS,
    CACHE_TAGS.THREADS // Tags affect thread listings
  ],
  
  // When user profile is updated
  UPDATE_USER: [
    CACHE_TAGS.USERS,
    (userId: string) => CACHE_TAGS.USER(userId)
  ]
} as const

// Cache warming priorities
export const CACHE_WARMING_PRIORITIES = {
  HIGH: [
    'categories-list',
    'trending-threads',
    'forum-home'
  ],
  MEDIUM: [
    'popular-tags',
    'recent-posts'
  ],
  LOW: [
    'user-stats',
    'admin-metrics'
  ]
} as const

// Development vs Production settings
export const getCacheSettings = () => {
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  return {
    // Disable caching in development for easier debugging
    enableCaching: !isDevelopment,
    
    // Shorter cache durations in development
    durations: isDevelopment ? {
      SHORT: 10,    // 10 seconds
      MEDIUM: 30,   // 30 seconds  
      LONG: 60,     // 1 minute
      VERY_LONG: 300 // 5 minutes
    } : CACHE_DURATIONS,
    
    // Enable cache debugging in development
    debugMode: isDevelopment,
    
    // Cache warming only in production
    enableWarmUp: !isDevelopment
  }
}

// Named export for better tree-shaking
export const cacheConfig = {
  PAGE_CACHE_CONFIG,
  DATA_CACHE_POLICIES,
  INVALIDATION_STRATEGIES,
  CACHE_WARMING_PRIORITIES,
  getCacheSettings
}

export default cacheConfig
