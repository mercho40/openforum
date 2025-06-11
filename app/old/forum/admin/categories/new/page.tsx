"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { createCategory } from "@/actions/category"
import { ArrowLeft, FolderPlus, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { IconPicker } from "@/components/(olds)/forum/admin/IconPicker"
import { ColorPicker } from "@/components/(olds)/forum/admin/ColorPicker"

// Form schema
const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  description: z.string().max(500, "Description is too long").optional(),
  displayOrder: z.coerce.number().int().min(0),
  isHidden: z.boolean(),
  color: z.string().max(50),
  iconClass: z.string().max(100).optional(),
})

export default function NewCategoryPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      displayOrder: 0,
      isHidden: false,
      color: "#3498db",
      iconClass: "",
    },
  })

  // Handle form submission
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)
    try {
      const result = await createCategory(data)
      if (result.success) {
        setIsSuccess(true)
        toast.success("Category created successfully")

        // Redirect after a short delay to show success state
        setTimeout(() => {
          router.push("/forum/admin/categories")
        }, 1000)
      } else {
        toast.error(result.error || "Failed to create category")
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error("Error creating category:", error)
      toast.error("An unexpected error occurred")
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-[800px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <Link href="/forum/admin/categories">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Category</h1>
          <p className="text-sm text-muted-foreground mt-1">Create a new forum category</p>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-card/30 backdrop-blur-sm border border-border/10 rounded-lg overflow-hidden">
        {/* Form Header */}
        <div className="p-4 sm:p-6 flex items-center gap-3 border-b border-border/10">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <FolderPlus className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-medium">Category Details</h2>
            <p className="text-sm text-muted-foreground">Fill in the details for your new category</p>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-4 sm:p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Category name" className="bg-background/50 border-border/10" {...field} />
                    </FormControl>
                    <FormDescription>The display name of the category.</FormDescription>
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
                        className="min-h-24 resize-none bg-background/50 border-border/10"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>Explain what this category is about.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="displayOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Order</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" className="bg-background/50 border-border/10" {...field} />
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
                      <FormControl>
                        <ColorPicker
                          value={field.value || "#3498db"}
                          onValueChange={field.onChange}
                          placeholder="Select a color"
                        />
                      </FormControl>
                      <FormDescription>Color for the category icon and theme.</FormDescription>
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
                    <FormLabel>Icon</FormLabel>
                    <FormControl>
                      <IconPicker
                        value={field.value || ""}
                        onValueChange={field.onChange}
                        placeholder="Select an icon"
                      />
                    </FormControl>
                    <FormDescription>Choose an icon to represent this category.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isHidden"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-border/10 p-4 bg-background/30">
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

              <Separator className="my-6 bg-border/10" />

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="bg-background/50 border-border/10"
                  asChild
                  disabled={isSubmitting || isSuccess}
                >
                  <Link href="/forum/admin/categories">Cancel</Link>
                </Button>
                <Button
                  type="submit"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 min-w-[120px]"
                  disabled={isSubmitting || isSuccess}
                >
                  <div className="relative flex items-center justify-center h-5">
                    {/* Default State */}
                    <span
                      className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
                        !isSubmitting && !isSuccess
                          ? "opacity-100 transform translate-y-0"
                          : "opacity-0 transform -translate-y-8"
                      }`}
                    >
                      Create Category
                    </span>

                    {/* Loading State */}
                    <span
                      className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
                        isSubmitting && !isSuccess
                          ? "opacity-100 transform translate-y-0"
                          : "opacity-0 transform translate-y-8"
                      }`}
                    >
                      Creating...
                    </span>

                    {/* Success State */}
                    <span
                      className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
                        isSuccess ? "opacity-100 transform translate-y-0" : "opacity-0 transform translate-y-8"
                      }`}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Created!
                    </span>
                  </div>
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  )
}
