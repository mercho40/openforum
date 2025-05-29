/**
 * Cache Admin Dashboard
 * Provides cache monitoring and management interface for administrators
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { RefreshCw, Trash2, Zap, Activity } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface CacheStats {
  uptime: number
  totalRequests: number
  totalCacheHits: number
  cacheHitRate: number
  hits: number
  misses: number
  invalidations: number
  hitRate: number
  topRequests: Array<{
    key: string
    requests: number
    hits: number
  }>
}

export default function CacheAdminDashboard() {
  const [stats, setStats] = useState<CacheStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/cache')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch cache stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInvalidateAll = async () => {
    setActionLoading('invalidate-all')
    try {
      const response = await fetch('/api/cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true })
      })
      
      if (response.ok) {
        await fetchStats()
      }
    } catch (error) {
      console.error('Failed to invalidate cache:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleWarmCache = async () => {
    setActionLoading('warm')
    try {
      const response = await fetch('/api/cache', {
        method: 'PUT'
      })
      
      if (response.ok) {
        await fetchStats()
      }
    } catch (error) {
      console.error('Failed to warm cache:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleResetStats = async () => {
    setActionLoading('reset')
    try {
      const response = await fetch('/api/cache', {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await fetchStats()
      }
    } catch (error) {
      console.error('Failed to reset stats:', error)
    } finally {
      setActionLoading(null)
    }
  }

  useEffect(() => {
    fetchStats()
    
    // Auto-refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const formatUptime = (uptime: number) => {
    const seconds = Math.floor(uptime / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ${hours % 24}h`
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cache Management</h1>
          <p className="text-muted-foreground">Monitor and manage application cache</p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={fetchStats} 
            variant="outline" 
            size="sm"
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Button 
            onClick={handleWarmCache} 
            variant="outline" 
            size="sm"
            disabled={actionLoading === 'warm'}
          >
            <Zap className="h-4 w-4 mr-2" />
            {actionLoading === 'warm' ? 'Warming...' : 'Warm Cache'}
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive" 
                size="sm"
                disabled={actionLoading === 'invalidate-all'}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All Cache
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear All Cache</AlertDialogTitle>
                <AlertDialogDescription>
                  This will invalidate all cached data. The application may experience 
                  slower performance until the cache is rebuilt.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleInvalidateAll}>
                  Clear Cache
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {stats && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatPercentage(stats.hitRate || stats.cacheHitRate)}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.hits || stats.totalCacheHits} hits, {stats.misses} misses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalRequests?.toLocaleString() || 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                Since last reset
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Invalidations</CardTitle>
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.invalidations}</div>
              <p className="text-xs text-muted-foreground">
                Cache invalidations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Uptime</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatUptime(stats.uptime)}</div>
              <p className="text-xs text-muted-foreground">
                Since startup
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {stats?.topRequests && stats.topRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Cache Keys</CardTitle>
            <CardDescription>
              Most frequently requested cache keys
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topRequests.map((request, index) => (
                <div key={request.key} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{request.key}</p>
                    <p className="text-xs text-muted-foreground">
                      {request.requests} requests, {request.hits} hits
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {formatPercentage(request.hits / request.requests)}
                    </Badge>
                    <Badge variant="outline">
                      #{index + 1}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Cache Actions</CardTitle>
          <CardDescription>
            Administrative actions for cache management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Reset Statistics</p>
                <p className="text-sm text-muted-foreground">
                  Clear all cache monitoring statistics
                </p>
              </div>
              <Button 
                onClick={handleResetStats} 
                variant="outline"
                disabled={actionLoading === 'reset'}
              >
                {actionLoading === 'reset' ? 'Resetting...' : 'Reset Stats'}
              </Button>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Cache Status</p>
                <p className="text-sm text-muted-foreground">
                  Current cache configuration and health
                </p>
              </div>
              <Badge variant="default">Active</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
