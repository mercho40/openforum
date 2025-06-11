import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { MoreHorizontal, Search, Pin, Lock, Eye, EyeOff, Trash2, MessageSquare, Calendar } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { getAllThreads } from "@/actions/thread"
import { getOnlyCategories } from "@/actions/category"

interface ThreadsPageProps {
  searchParams: Promise<{
    page?: string
    search?: string
    sort?: string
    category?: string
    filter?: string
  }>
}

async function ThreadsList({ searchParams }: ThreadsPageProps) {
  const params = await searchParams
  const page = parseInt(params.page || '1')
  const search = params.search || ''
  const sort = (params.sort || 'recent') as 'recent' | 'popular' | 'views' | 'replies'
  const categoryId = params.category
  const filter = params.filter as 'pinned' | 'locked' | undefined
  
  const { threads, pagination } = await getAllThreads({
    page,
    perPage: 20,
    searchQuery: search,
    sortBy: sort,
    categoryId,
    filter
  })
  
  const { categories } = await getOnlyCategories()
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search threads..."
            className="pl-10"
            defaultValue={search}
          />
        </div>
        <Select defaultValue={categoryId || 'all'}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories?.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select defaultValue={sort}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Recent</SelectItem>
            <SelectItem value="popular">Popular</SelectItem>
            <SelectItem value="views">Most Viewed</SelectItem>
            <SelectItem value="replies">Most Replies</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue={filter || 'all'}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pinned">Pinned</SelectItem>
            <SelectItem value="locked">Locked</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Forum Threads</CardTitle>
          <CardDescription>
            Moderate and manage forum discussions ({pagination.total} total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {threads.map((thread) => (
              <div key={thread.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Link 
                      href={`/forum/threads/${thread.slug}`}
                      className="font-medium hover:underline truncate"
                    >
                      {thread.title}
                    </Link>
                    {thread.isPinned && (
                      <Pin className="h-4 w-4 text-blue-500" />
                    )}
                    {thread.isLocked && (
                      <Lock className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>by {thread.author.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {thread.categoryName}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {thread.viewCount}
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {thread.replyCount}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(thread.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem>
                      <Pin className="mr-2 h-4 w-4" />
                      {thread.isPinned ? 'Unpin' : 'Pin'} Thread
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Lock className="mr-2 h-4 w-4" />
                      {thread.isLocked ? 'Unlock' : 'Lock'} Thread
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <EyeOff className="mr-2 h-4 w-4" />
                      Hide Thread
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Thread
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
          
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={!pagination.hasPrev}
                >
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={!pagination.hasNext}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function ThreadsListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-[180px]" />
        <Skeleton className="h-10 w-[150px]" />
        <Skeleton className="h-10 w-[120px]" />
      </div>
      
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-[120px]" />
          <Skeleton className="h-4 w-[200px]" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-[300px]" />
                  <Skeleton className="h-3 w-[400px]" />
                </div>
                <Skeleton className="h-8 w-8" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ThreadsPage({ searchParams }: ThreadsPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Thread Management</h1>
        <p className="text-muted-foreground">
          Moderate forum discussions and manage thread settings
        </p>
      </div>
      
      <Suspense fallback={<ThreadsListSkeleton />}>
        <ThreadsList searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
