#!/usr/bin/env tsx

/**
 * Cache Warming Script
 * Pre-populates cache with commonly accessed data after deployment
 */

import { warmCommonCache } from '../lib/cache'
import { CacheWarmer } from '../lib/cache-middleware'

async function main() {
  console.log('🔥 Starting cache warming process...')
  
  try {
    // Warm common cache
    await warmCommonCache()
    
    // Run additional cache warming
    await CacheWarmer.warmCache()
    
    console.log('✅ Cache warming completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Cache warming failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { main as warmCache }
