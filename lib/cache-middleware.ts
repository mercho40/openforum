/**
 * Cache Middleware
 * Provides cache monitoring, debugging, and management utilities
 */

import { NextResponse } from 'next/server'
import { cacheMonitoring } from './cache'
import { getCacheSettings } from './cache-config'

// Cache performance monitoring
export class CacheMonitor {
  private static instance: CacheMonitor
  private requests: Map<string, number> = new Map()
  private cacheHits: Map<string, number> = new Map()
  private startTime: number = Date.now()

  static getInstance(): CacheMonitor {
    if (!CacheMonitor.instance) {
      CacheMonitor.instance = new CacheMonitor()
    }
    return CacheMonitor.instance
  }

  recordRequest(key: string) {
    this.requests.set(key, (this.requests.get(key) || 0) + 1)
  }

  recordCacheHit(key: string) {
    this.cacheHits.set(key, (this.cacheHits.get(key) || 0) + 1)
    cacheMonitoring.recordHit()
  }

  recordCacheMiss() {
    cacheMonitoring.recordMiss()
  }

  getStats() {
    const uptime = Date.now() - this.startTime
    return {
      uptime,
      totalRequests: Array.from(this.requests.values()).reduce((a, b) => a + b, 0),
      totalCacheHits: Array.from(this.cacheHits.values()).reduce((a, b) => a + b, 0),
      cacheHitRate: this.calculateHitRate(),
      topRequests: this.getTopRequests(),
      ...cacheMonitoring.getStats()
    }
  }

  private calculateHitRate(): number {
    const totalRequests = Array.from(this.requests.values()).reduce((a, b) => a + b, 0)
    const totalHits = Array.from(this.cacheHits.values()).reduce((a, b) => a + b, 0)
    return totalRequests > 0 ? totalHits / totalRequests : 0
  }

  private getTopRequests(): Array<{ key: string; requests: number; hits: number }> {
    const entries = Array.from(this.requests.entries()).map(([key, requests]) => ({
      key,
      requests,
      hits: this.cacheHits.get(key) || 0
    }))

    return entries
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 10)
  }

  reset() {
    this.requests.clear()
    this.cacheHits.clear()
    this.startTime = Date.now()
    cacheMonitoring.reset()
  }
}

// Cache debugging utilities
export const cacheDebug = {
  logCacheOperation(operation: string, key: string, data?: unknown) {
    const settings = getCacheSettings()
    if (settings.debugMode) {
      console.log(`[Cache ${operation}]`, {
        key,
        timestamp: new Date().toISOString(),
        data: data ? Object.keys(data) : undefined
      })
    }
  },

  logCacheHit(key: string) {
    this.logCacheOperation('HIT', key)
    CacheMonitor.getInstance().recordCacheHit(key)
  },

  logCacheMiss(key: string) {
    this.logCacheOperation('MISS', key)
    CacheMonitor.getInstance().recordCacheMiss()
  },

  logCacheInvalidation(tags: string | string[]) {
    const tagArray = Array.isArray(tags) ? tags : [tags]
    this.logCacheOperation('INVALIDATE', tagArray.join(', '))
    cacheMonitoring.recordInvalidation()
  }
}

// Cache header utilities
export function addCacheHeaders(response: NextResponse, options: {
  maxAge?: number
  staleWhileRevalidate?: number
  mustRevalidate?: boolean
  noCache?: boolean
}) {
  const { maxAge = 0, staleWhileRevalidate = 0, mustRevalidate = false, noCache = false } = options

  if (noCache) {
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
  } else {
    const cacheControl = [
      `max-age=${maxAge}`,
      staleWhileRevalidate > 0 ? `stale-while-revalidate=${staleWhileRevalidate}` : '',
      mustRevalidate ? 'must-revalidate' : '',
    ].filter(Boolean).join(', ')

    response.headers.set('Cache-Control', cacheControl)
  }

  return response
}

// Cache warming scheduler
export class CacheWarmer {
  private static warmingInProgress = false

  static async warmCache() {
    if (this.warmingInProgress) {
      console.log('Cache warming already in progress, skipping...')
      return
    }

    const settings = getCacheSettings()
    if (!settings.enableWarmUp) {
      console.log('Cache warming disabled in current environment')
      return
    }

    this.warmingInProgress = true
    
    try {
      console.log('Starting cache warming...')
      
      // This would implement actual cache warming logic
      // For now, just a placeholder
      
      console.log('Cache warming completed successfully')
    } catch (error) {
      console.error('Cache warming failed:', error)
    } finally {
      this.warmingInProgress = false
    }
  }

  static scheduleWarmUp() {
    // Schedule cache warming every hour in production
    const settings = getCacheSettings()
    if (settings.enableWarmUp) {
      setInterval(() => {
        this.warmCache()
      }, 60 * 60 * 1000) // 1 hour
    }
  }
}

// Export utilities
const cacheUtilities = {
  CacheMonitor,
  cacheDebug,
  addCacheHeaders,
  CacheWarmer
}

export { cacheUtilities }
export default cacheUtilities
