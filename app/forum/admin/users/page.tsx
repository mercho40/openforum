import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { MoreHorizontal, Search, UserCheck, UserX, Shield, Crown, User } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getForumMembers } from "@/actions/user"

interface UsersPageProps {
  searchParams: Promise<{
    page?: string
    search?: string
    sort?: string
  }>
}

async function UsersList({ searchParams }: UsersPageProps) {
  const params = await searchParams
  const page = parseInt(params.page || '1')
  const search = params.search || ''
  const sort = params.sort || 'newest'
  
  const { members, pagination } = await getForumMembers({
    page,
    search,
    sort,
    limit: 20
  })
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="pl-10"
            defaultValue={search}
          />
        </div>
        <Select defaultValue={sort}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="name">Name A-Z</SelectItem>
            <SelectItem value="reputation">Reputation</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Forum Members</CardTitle>
          <CardDescription>
            Manage user accounts and permissions ({pagination.totalItems} total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    {member.image ? (
                      <img 
                        src={member.image || "/placeholder.svg"} 
                        alt={member.name || 'User'} 
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      <span className="text-sm font-medium">
                        {(member.name || 'U').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{member.name}</h4>
                      {member.role === 'admin' && (
                        <Crown className="h-4 w-4 text-yellow-500" />
                      )}
                      {member.role === 'moderator' && (
                        <Shield className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>@{member.username || member.displayUsername}</span>
                      <span>{member.reputation} reputation</span>
                      <span>Joined {new Date(member.createdAt).toLocaleDateString()}</span>
                    </div>
                    {member.bio && (
                      <p className="text-sm text-muted-foreground max-w-md truncate">
                        {member.bio}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant={
                    member.role === 'admin' ? 'default' : 
                    member.role === 'moderator' ? 'secondary' : 
                    'outline'
                  }>
                    {member.role}
                  </Badge>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem>
                        <User className="mr-2 h-4 w-4" />
                        View Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <UserCheck className="mr-2 h-4 w-4" />
                        Make Moderator
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">
                        <UserX className="mr-2 h-4 w-4" />
                        Ban User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
          
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                Page {pagination.currentPage} of {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={!pagination.hasPrevPage}
                >
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={!pagination.hasNextPage}
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

function UsersListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-[180px]" />
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
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[150px]" />
                    <Skeleton className="h-3 w-[250px]" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-[60px]" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function UsersPage({ searchParams }: UsersPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">
          Manage forum members, roles, and permissions
        </p>
      </div>
      
      <Suspense fallback={<UsersListSkeleton />}>
        <UsersList searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
