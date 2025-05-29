/**
 * Performance Monitor Component
 * Tracks page load times and cache effectiveness for development
 */

'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Activity, Clock, Zap } from 'lucide-react'

interface PerformanceMetrics {
  pageLoadTime: number
  cacheHit: boolean
  renderTime: number
  timestamp: Date
}

interface PerformanceMonitorProps {
  pageName: string
  cacheInfo?: {
    hitRate?: number
    lastCached?: Date
    tags?: string[]
  }
}

export default function PerformanceMonitor({ 
  pageName, 
  cacheInfo 
}: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Only show in development
    const isDev = process.env.NODE_ENV === 'development'
    setIsVisible(isDev)

    if (!isDev) return

    const startTime = performance.now()
    
    // Measure page load performance
    const measurePerformance = () => {
      const loadTime = performance.now() - startTime
      
      // Get performance navigation data
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      
      setMetrics({
        pageLoadTime: navigation ? navigation.loadEventEnd - navigation.loadEventStart : loadTime,
        cacheHit: cacheInfo?.hitRate ? cacheInfo.hitRate > 0.5 : false,
        renderTime: loadTime,
        timestamp: new Date()
      })
    }

    // Measure after component mounts
    const timer = setTimeout(measurePerformance, 100)
    
    return () => clearTimeout(timer)
  }, [cacheInfo, pageName])

  if (!isVisible || !metrics) return null

  const formatTime = (ms: number) => `${ms.toFixed(1)}ms`
  const formatPercentage = (rate: number) => `${(rate * 100).toFixed(1)}%`

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-64 bg-background/95 backdrop-blur-sm border shadow-lg">
        <CardContent className="p-3 space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium">
            <Activity className="h-3 w-3 text-muted-foreground" />
            <span>{pageName}</span>
            <Badge variant="secondary" className="ml-auto text-xs">
              DEV
            </Badge>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-muted-foreground" />
                Page Load
              </span>
              <span className="font-mono">
                {formatTime(metrics.pageLoadTime)}
              </span>
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3 text-muted-foreground" />
                Render
              </span>
              <span className="font-mono">
                {formatTime(metrics.renderTime)}
              </span>
            </div>
            
            {cacheInfo && (
              <div className="space-y-1 pt-1 border-t">
                <div className="flex items-center justify-between text-xs">
                  <span>Cache Hit Rate</span>
                  <Badge 
                    variant={cacheInfo.hitRate && cacheInfo.hitRate > 0.7 ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {cacheInfo.hitRate ? formatPercentage(cacheInfo.hitRate) : 'N/A'}
                  </Badge>
                </div>
                
                {cacheInfo.tags && (
                  <div className="flex flex-wrap gap-1">
                    {cacheInfo.tags.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {cacheInfo.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{cacheInfo.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
