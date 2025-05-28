"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { deleteCategory } from "@/actions/category"
import { ArrowLeft, AlertTriangle, Trash2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

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
  const [isSuccess, setIsSuccess] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!category) return null;

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }

    setIsDeleting(true)
    try {
      const result = await deleteCategory(category.id)
      if (result.success) {
        setIsSuccess(true)
        toast.success("Category deleted successfully")

        // Redirect after a short delay to show success state
        setTimeout(() => {
          router.push("/forum/admin/categories")
        }, 1000)
      } else {
        toast.error(result.error || "Failed to delete category")
        setIsDeleting(false)
      }
    } catch (error) {
      console.error("Error deleting category:", error)
      toast.error("An unexpected error occurred")
      setIsDeleting(false)
    }
  }

  return (
    <div className="w-full max-w-[600px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <Link href="/forum/admin/categories">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Delete Category</h1>
          <p className="text-sm text-muted-foreground mt-1">Permanently delete a category</p>
        </div>
      </div>

      {/* Delete Card */}
      <div className="bg-card/30 backdrop-blur-sm border border-border/10 rounded-lg overflow-hidden">
        {/* Warning Header */}
        <div className="p-4 sm:p-6 bg-destructive/10 dark:bg-destructive/20 border-b border-border/10">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-destructive">Delete Category</h2>
              <p className="text-sm text-destructive/80 mt-1">
                This action cannot be undone. This will permanently delete the category and all associated data.
              </p>
            </div>
          </div>
        </div>

        {/* Category Details */}
        <div className="p-4 sm:p-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Category Name</h3>
              <p className="text-lg font-semibold mt-1">{category.name}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Slug</h3>
              <p className="font-mono text-sm bg-muted/30 px-2 py-1 rounded inline-block mt-1">{category.slug}</p>
            </div>

            {category.description && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                <p className="text-sm mt-1">{category.description}</p>
              </div>
            )}

            <div className="rounded-md bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-500 border border-amber-200 dark:border-amber-800/30 mt-4">
              <div className="flex gap-2 items-start">
                <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Warning</p>
                  <p className="mt-1">
                    Deleting this category will also delete all threads and posts within it. Consider moving important
                    content to another category before deletion.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator className="bg-border/10" />

        {/* Action Buttons */}
        <div className="p-4 sm:p-6 flex justify-between items-center">
          <Button
            variant="outline"
            className="bg-background/50 border-border/10"
            asChild
            disabled={isDeleting || isSuccess}
          >
            <Link href="/forum/admin/categories">Cancel</Link>
          </Button>

          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || isSuccess}
            className={`min-w-[140px] ${confirmDelete ? "animate-pulse" : ""} overflow-hidden`}
          >
            <div className="relative flex items-center justify-center h-5">
              {/* Default State */}
              <span
                className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${!confirmDelete && !isDeleting && !isSuccess
                  ? "opacity-100 transform translate-y-0"
                  : "opacity-0 transform -translate-y-8"
                  }`}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Category
              </span>

              {/* Confirm State */}
              <span
                className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${confirmDelete && !isDeleting && !isSuccess
                  ? "opacity-100 transform translate-y-0"
                  : "opacity-0 transform translate-y-8"
                  }`}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Confirm Delete
              </span>

              {/* Loading State */}
              <span
                className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${isDeleting && !isSuccess ? "opacity-100 transform translate-y-0" : "opacity-0 transform translate-y-8"
                  }`}
              >
                Deleting...
              </span>

              {/* Success State */}
              <span
                className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${isSuccess ? "opacity-100 transform translate-y-0" : "opacity-0 transform translate-y-8"
                  }`}
              >
                <Check className="mr-2 h-4 w-4" />
                Deleted!
              </span>
            </div>
          </Button>
        </div>
      </div>
    </div>
  )
}
