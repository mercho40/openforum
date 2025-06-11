import Link from "next/link"
import { FolderPlus, Pencil, Trash2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CategoryIcon } from "@/components/(olds)/forum/CategoryIcon"
import { getCategories } from "@/actions/category"

export default async function CategoriesPage() {
  const { success, categories = [], error } = await getCategories()

  if (!success) {
    throw new Error(error || "Failed to fetch categories")
  }

  return (
    <div className="w-full max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex flex-col space-y-2 sm:flex-row sm:justify-between sm:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage forum categories and their settings</p>
        </div>
        <Button asChild size="sm" className="mt-2 sm:mt-0 bg-primary text-primary-foreground hover:bg-primary/90">
          <Link href="/forum/admin/categories/new">
            <Plus className="mr-1 h-4 w-4" />
            New Category
          </Link>
        </Button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category, index) => (
          <div
            key={category.id}
            className="group relative bg-card/30 backdrop-blur-sm border border-border/10 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-md hover:border-border/30"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            {/* Category Header */}
            <div className="p-4 flex items-center gap-3">
              <div
                className="h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300"
                style={{ backgroundColor: category.color ? `${category.color}20` : "var(--primary-10)" }}
              >
                <CategoryIcon iconName={category.iconClass} color={category.color} size="md" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-base truncate">{category.name}</h3>
                <p className="text-xs text-muted-foreground truncate">
                  {category.description || `Discussions about ${category.name}`}
                </p>
              </div>
            </div>

            <Separator className="bg-border/10" />

            {/* Category Details */}
            <div className="p-4 pt-3">
              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                <div>
                  <p className="text-xs text-muted-foreground">Slug</p>
                  <p className="font-mono text-xs truncate">{category.slug}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Display Order</p>
                  <p>{category.displayOrder}</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-normal">
                    {category.threadCount} {category.threadCount === 1 ? "thread" : "threads"}
                  </Badge>
                  {category.isHidden ? (
                    <Badge
                      variant="outline"
                      className="bg-yellow-100/50 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-500 dark:border-yellow-800/30 text-xs font-normal"
                    >
                      Hidden
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="bg-green-100/50 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-500 dark:border-green-800/30 text-xs font-normal"
                    >
                      Visible
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href={`/forum/admin/categories/${category.id}/edit`}>
                      <Pencil className="h-3.5 w-3.5" />
                      <span className="sr-only">Edit</span>
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href={`/forum/admin/categories/${category.id}/delete`}>
                      <Trash2 className="h-3.5 w-3.5" />
                      <span className="sr-only">Delete</span>
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Empty State */}
        {categories.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center p-8 text-center bg-card/30 backdrop-blur-sm border border-border/10 rounded-lg">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <FolderPlus className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-medium">No categories yet</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">Create your first category to get started</p>
            <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/forum/admin/categories/new">
                <Plus className="mr-1 h-4 w-4" />
                New Category
              </Link>
            </Button>
          </div>
        )}

        {/* Add Category Card */}
        <Link
          href="/forum/admin/categories/new"
          className="group flex flex-col items-center justify-center p-6 bg-card/20 backdrop-blur-sm border border-dashed border-border/30 rounded-lg transition-all duration-300 hover:bg-card/30 hover:border-primary/30"
        >
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
            <FolderPlus className="h-5 w-5 text-primary" />
          </div>
          <h3 className="font-medium text-base">Add New Category</h3>
          <p className="text-xs text-muted-foreground text-center mt-1">Create a new forum category</p>
        </Link>
      </div>
    </div>
  )
}
