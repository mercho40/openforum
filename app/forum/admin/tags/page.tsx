import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, Edit, Trash2, Tag } from 'lucide-react'
import { getAllTags } from "@/actions/tag"
import { TagCreateDialog } from "@/components/forum/admin/TagCreateDialog"

interface TagsPageProps {
  searchParams: Promise<{
    search?: string
  }>
}

async function TagsList({ searchParams }: TagsPageProps) {
    const params = await searchParams
  const search = params.search || ''
  
  const { tags } = await getAllTags({ search, limit: 100 })
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tags..."
            className="pl-10"
            defaultValue={search}
          />
        </div>
        <TagCreateDialog />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Forum Tags</CardTitle>
          <CardDescription>
            Manage tags for organizing forum content ({tags?.length || 0} total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tags && tags.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tags.map((tag) => (
                <div key={tag.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Badge 
                      variant="outline" 
                      className="text-sm"
                      style={{ 
                        borderColor: tag.color || '#3498db',
                        color: tag.color || '#3498db'
                      }}
                    >
                      <Tag className="mr-1 h-3 w-3" />
                      {tag.name}
                    </Badge>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{tag.slug}</p>
                    {tag.description && (
                      <p className="text-xs text-muted-foreground">
                        {tag.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Tag className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No tags found</h3>
              <p className="text-muted-foreground mb-4">
                {search ? 'No tags match your search.' : 'Create your first tag to get started.'}
              </p>
              <TagCreateDialog />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function TagsListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-[120px]" />
      </div>
      
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-[120px]" />
          <Skeleton className="h-4 w-[200px]" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Skeleton className="h-6 w-[80px]" />
                  <div className="flex gap-1">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-3 w-[150px]" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function TagsPage({ searchParams }: TagsPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tag Management</h1>
        <p className="text-muted-foreground">
          Create and manage tags for organizing forum content
        </p>
      </div>
      
      <Suspense fallback={<TagsListSkeleton />}>
        <TagsList searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
