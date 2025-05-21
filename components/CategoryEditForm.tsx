"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { updateCategory, type CategoryFormData } from "../../actions"
import { ArrowLeft } from "lucide-react"

// Form schema
const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(100, "Slug is too long")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  description: z.string().max(500, "Description is too long").optional().nullable(),
  displayOrder: z.coerce.number().int().min(0),
  isHidden: z.boolean().default(false),
  color: z.string().max(50).optional().nullable(),
  iconClass: z.string().max(100).optional().nullable(),
})

interface EditCategoryFormProps {
  category: {
    id: string
    name: string
    slug: string
    description: string | null
    displayOrder: number
    isHidden: boolean
    color: string | null
    iconClass: string | null
  }
}

export function EditCategoryForm({ category }: EditCategoryFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize form with category data
  const form = useForm<CategoryFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      displayOrder: category.displayOrder,
      isHidden: category.isHidden,
      color: category.color || "#3498db",
      iconClass: category.iconClass || "",
    },
  })

  // Handle form submission
  const onSubmit = async (data: CategoryFormData) => {
    setIsSubmitting(true)
    try {
      const result = await updateCategory(category.id, data)
      if (result.success) {
        toast.success("Category updated successfully")
        router.push("/forum/admin/categories")
      } else {
        toast.error(result.error || "Failed to update category")
      }
    } catch (error) {
      console.error("Error updating category:", error)
      toast.error("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
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
          <h1 className="text-3xl font-bold tracking-tight">Edit Category</h1>
          <p className="text-muted-foreground">Update category details.</p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Category name" {...field} />
                  </FormControl>
                  <FormDescription>The display name of the category.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input placeholder="category-slug" {...field} />
                  </FormControl>
                  <FormDescription>
                    The URL-friendly version of the name. Used in the URL: /forum/category/slug
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="A brief description of the category"
                      className="min-h-24 resize-none"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>Explain what this category is about.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="displayOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Order</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormDescription>Categories are displayed in ascending order (0 appears first).</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input {...field} value={field.value || ""} />
                      </FormControl>
                      <div
                        className="h-10 w-10 rounded-md border"
                        style={{ backgroundColor: field.value || "#3498db" }}
                      />
                    </div>
                    <FormDescription>Color for the category icon (hex code, RGB, or color name).</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="iconClass"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icon Class</FormLabel>
                  <FormControl>
                    <Input placeholder="fa-solid fa-comments" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormDescription>
                    Optional CSS class for the icon (e.g., Font Awesome class). Leave empty to use the default icon.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isHidden"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Hidden</FormLabel>
                    <FormDescription>Hidden categories are only visible to administrators.</FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button variant="outline" asChild>
                <Link href="/forum/admin/categories">Cancel</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}
