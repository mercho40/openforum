import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, MessageSquare, FolderTree, TrendingUp, Eye, AlertTriangle } from 'lucide-react'
import Link from "next/link"
import { getForumStats } from "@/actions/stats"
import { getAllThreads } from "@/actions/thread"
import { getForumMembers } from "@/actions/user"
import { unstable_cache } from 'next/cache'

// Enable ISR for admin dashboard with frequent updates
export const revalidate = 60 // Revalidate every minute for admin data
export const dynamic = 'force-dynamic' // Keep dynamic for admin sessions

// Cache admin stats with short expiration
const getCachedAdminStats = unstable_cache(
  async () => {
    return await getForumStats()
  },
  ['admin-stats'],
  {
    tags: ['admin-stats', 'forum-stats'],
    revalidate: 60, // Cache for 1 minute
  }
)

// Cache recent activity for admin dashboard
// const getCachedRecentActivity = unstable_cache(
//   async () => {
//     const [threadsResult, membersResult] = await Promise.all([
//       getAllThreads({ page: 1, perPage: 5, sortBy: 'recent' }),
//       getForumMembers({ page: 1, search: "", sort: "newest", limit: 5 })
//     ])
    
//     return {
//       recentThreads: threadsResult.success ? threadsResult.threads : [],
//       recentMembers: membersResult.success ? membersResult.members : []
//     }
//   },
//   ['admin-activity'],
//   {
//     tags: ['admin-activity', 'threads', 'members'],
//     revalidate: 60, // Cache for 1 minute
//   }
// )

// Generate static metadata
export async function generateMetadata() {
  return {
    title: "Admin Dashboard - OpenForum",
    description: "Administrative dashboard for managing OpenForum community and content.",
    robots: {
      index: false, // Don't index admin pages
      follow: false,
    },
  }
}

async function DashboardStats() {
  const stats = await getCachedAdminStats()
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Members</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalMembers}</div>
          <p className="text-xs text-muted-foreground">
            Newest: {stats.newestMember?.name || "None"}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Threads</CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalThreads}</div>
          <p className="text-xs text-muted-foreground">
            Active discussions
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalPosts}</div>
          <p className="text-xs text-muted-foreground">
            Community engagement
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Posts/Thread</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.totalThreads > 0 ? Math.round(stats.totalPosts / stats.totalThreads) : 0}
          </div>
          <p className="text-xs text-muted-foreground">
            Engagement rate
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

async function RecentActivity() {
  const { threads } = await getAllThreads({ page: 1, perPage: 5, sortBy: 'recent' })
  const { members } = await getForumMembers({ page: 1, limit: 5, sort: 'newest' })
  
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Threads</CardTitle>
          <CardDescription>Latest forum discussions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {threads.slice(0, 5).map((thread) => (
            <div key={thread.id} className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none truncate max-w-[200px]">
                  {thread.title}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>by {thread.author.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {thread.categoryName}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Eye className="h-3 w-3" />
                {thread.viewCount}
                <MessageSquare className="h-3 w-3" />
                {thread.replyCount}
              </div>
            </div>
          ))}
          <Button variant="outline" size="sm" asChild className="w-full">
            <Link href="/forum/admin/threads">View All Threads</Link>
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">New Members</CardTitle>
          <CardDescription>Recently joined users</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {members.slice(0, 5).map((member) => (
            <div key={member.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  {member.image ? (
                    <img 
                      src={member.image || "/placeholder.svg"} 
                      alt={member.name || 'User'} 
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <span className="text-xs font-medium">
                      {(member.name || 'U').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">{member.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {member.reputation} reputation
                  </p>
                </div>
              </div>
              <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                {member.role}
              </Badge>
            </div>
          ))}
          <Button variant="outline" size="sm" asChild className="w-full">
            <Link href="/forum/admin/users">View All Users</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[60px] mb-2" />
              <Skeleton className="h-3 w-[120px]" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-[120px]" />
              <Skeleton className="h-4 w-[160px]" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-3 w-[150px]" />
                  </div>
                  <Skeleton className="h-4 w-[60px]" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your forum&apos;s activity and management tools
        </p>
      </div>
      
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardStats />
        <RecentActivity />
      </Suspense>
      
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FolderTree className="h-5 w-5" />
              Categories
            </CardTitle>
            <CardDescription>Manage forum categories and organization</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/forum/admin/categories">Manage Categories</Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Management
            </CardTitle>
            <CardDescription>Moderate users and manage permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/forum/admin/users">Manage Users</Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Reports
            </CardTitle>
            <CardDescription>Review and handle user reports</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/forum/admin/reports">View Reports</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
