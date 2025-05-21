import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { FolderPlus, Pencil, Trash2, MessageSquare } from 'lucide-react'
import { db } from "@/db/drizzle"
import { category, thread } from "@/db/schema"
import { count, eq } from "drizzle-orm"

export default async function CategoriesPage() {
  // Fetch categories with thread counts
  const categories = await db
    .select({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      displayOrder: category.displayOrder,
      isHidden: category.isHidden,
      color: category.color,
      iconClass: category.iconClass,
    })
    .from(category)
    .orderBy(category.displayOrder)

  // Get thread counts for each category
  const categoriesWithCounts = await Promise.all(
    categories.map(async (cat) => {
      const threadCountResult = await db
        .select({ count: count() })
        .from(thread)
        .where(eq(thread.categoryId, cat.id))

      return {
        ...cat,
        threadCount: threadCountResult[0]?.count || 0,
      }
    })
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground">Manage forum categories and their settings.</p>
        </div>
        <Button asChild>
          <Link href="/forum/admin/categories/new">
            <FolderPlus className="mr-2 h-4 w-4" />
            New Category
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Categories</CardTitle>
          <CardDescription>
            A list of all categories in your forum. Drag and drop to reorder.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Threads</TableHead>
                <TableHead>Visibility</TableHead>
                <TableHead>Order</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoriesWithCounts.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-6 w-6 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: category.color ? `${category.color}20` : "var(--primary-10)" }}
                      >
                        {category.iconClass ? (
                          <span
                            className={`text-sm ${category.iconClass}`}
                            style={{ color: category.color || "var(--primary)" }}
                          ></span>
                        ) : (
                          <MessageSquare
                            className="h-3 w-3"
                            style={{ color: category.color || "var(--primary)" }}
                          />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{category.name}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[300px]">
                          {category.description || `Discussions about ${category.name}`}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{category.threadCount}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        category.isHidden
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500"
                          : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500"
                      }`}
                    >
                      {category.isHidden ? "Hidden" : "Visible"}
                    </span>
                  </TableCell>
                  <TableCell>{category.displayOrder}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/forum/admin/categories/${category.id}/edit`}>
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/forum/admin/categories/${category.id}/delete`}>
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
