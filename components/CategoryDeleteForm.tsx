"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { deleteCategory } from "../../actions"
import { ArrowLeft, AlertTriangle } from "lucide-react"

interface DeleteCategoryFormProps {
  category: {
    id: string
    name: string
    slug: string
    description: string | null
  }
}

export function DeleteCategoryForm({ category }: DeleteCategoryFormProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteCategory(category.id)
      if (result.success) {
        toast.success("Category deleted successfully")
        router.push("/forum/admin/categories")
      } else {
        toast.error(result.error || "Failed to delete category")
      }
    } catch (error) {
      console.error("Error deleting category:", error)
      toast.error("An unexpected error occurred")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/forum/admin/categories">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Delete Category</h1>
          <p className="text-muted-foreground">Permanently delete a category.</p>
        </div>
      </div>

      <div className="mx-auto max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="h-5 w-5" />
              Delete Category
            </CardTitle>
            <CardDescription>
              Are you sure you want to delete this category? This action cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">Category Name</h3>
                <p>{category.name}</p>
              </div>
              <div>
                <h3 className="font-medium">Slug</h3>
                <p>{category.slug}</p>
              </div>
              {category.description && (
                <div>
                  <h3 className="font-medium">Description</h3>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </div>
              )}
              <div className="rounded-md bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-500">
                <p>
                  <strong>Warning:</strong> Deleting this category will also delete all threads and posts within it.
                  Consider moving important content to another category before deletion.
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" asChild>
              <Link href="/forum/admin/categories">Cancel</Link>
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete Category"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
