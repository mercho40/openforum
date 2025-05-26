"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { createThread } from "@/actions/thread"
import { ArrowLeft, Check, PlusCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Session } from "@/lib/auth"
import { CategoryIcon } from "@/components/forum/CategoryIcon"

// Form schema
const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(200, "Title is too long"),
  content: z.string().min(10, "Content must be at least 10 characters").max(10000, "Content is too long"),
  tags: z.array(z.string()).max(5, "Maximum 5 tags allowed").optional(),
})

type FormData = z.infer<typeof formSchema>

interface Category {
  id: string
  name: string
  description: string | null
  slug: string
  iconClass: string | null
  color: string | null
}

interface NewThreadFormProps {
  category: Category
  session: Session
}

// Mock tags - in a real app, you'd fetch these from your database
const availableTags = [
  { id: "1", name: "Question", slug: "question", color: "#3498db" },
  { id: "2", name: "Discussion", slug: "discussion", color: "#2ecc71" },
  { id: "3", name: "Help", slug: "help", color: "#e74c3c" },
  { id: "4", name: "Tutorial", slug: "tutorial", color: "#9b59b6" },
  { id: "5", name: "News", slug: "news", color: "#f39c12" },
  { id: "6", name: "Feedback", slug: "feedback", color: "#1abc9c" },
  { id: "7", name: "Bug Report", slug: "bug-report", color: "#e67e22" },
  { id: "8", name: "Feature Request", slug: "feature-request", color: "#34495e" },
]

export function NewThreadForm({ category, session }: NewThreadFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  // Initialize form
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
      tags: [],
    },
  })

  // Handle tag selection
  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) => {
      const newTags = prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
      form.setValue("tags", newTags)
      return newTags
    })
  }

  // Handle form submission
  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    try {
      // Make sure we're passing the selected tag IDs correctly
      const result = await createThread({
        title: data.title,
        content: data.content,
        categoryId: category.id,
        tags: selectedTags, // Use selectedTags instead of data.tags to ensure we send the right data
      })

      // Check if slug exists on the result object
      const slug = result.success && 'slug' in result ? result.slug : null

      if (result.success && slug) {
        setIsSuccess(true)
        toast.success("Thread created successfully")

        // Redirect after a short delay to show success state
        setTimeout(() => {
          router.push(`/forum/categories/${category.slug}/threads/${slug}`)
        }, 1000)
      } else {
        // Reset submitting state and show error
        setIsSubmitting(false)
        toast.error('error' in result ? result.error : "Failed to create thread")
      }
    } catch (error) {
      setIsSubmitting(false)
      console.error("Error creating thread:", error)
      toast.error("An unexpected error occurred")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-card/50 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <Link href={`/forum/categories/${category.slug}`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Create New Thread</h1>
              <p className="text-sm text-muted-foreground">in {category.name}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-6 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link href="/forum" className="hover:text-foreground">
              Forum
            </Link>
            <span>/</span>
            <Link href="/forum/categories" className="hover:text-foreground">
              Categories
            </Link>
            <span>/</span>
            <Link href={`/forum/categories/${category.slug}`} className="hover:text-foreground">
              {category.name}
            </Link>
            <span>/</span>
            <span className="text-foreground">New Thread</span>
          </nav>

          <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
            {/* Main Form */}
            <div className="space-y-6">
              {/* Category Info */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: category.color ? `${category.color}20` : "var(--primary-10)" }}
                    >
                      <CategoryIcon iconName={category.iconClass} color={category.color} size="md" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                      <CardDescription>{category.description || "Share your thoughts and ideas"}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Thread Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Thread Details</CardTitle>
                  <CardDescription>Provide a clear title and detailed content for your thread</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Thread Title</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter a descriptive title for your thread"
                                className="bg-background/50 border-border/10"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Choose a clear, descriptive title that summarizes your thread topic.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Content</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Write your thread content here. Be detailed and provide context for better discussions."
                                className="min-h-[200px] resize-none bg-background/50 border-border/10"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Provide detailed information about your topic. You can edit this later if needed.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="tags"
                        render={() => (
                          <FormItem>
                            <FormLabel>Tags (Optional)</FormLabel>
                            <FormDescription className="mb-3">
                              Select up to 5 tags to help categorize your thread and make it easier to find.
                            </FormDescription>
                            <FormControl>
                              <div className="space-y-3">
                                {/* Selected Tags */}
                                {selectedTags.length > 0 && (
                                  <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-md border border-border/10">
                                    {selectedTags.map((tagId) => {
                                      const tag = availableTags.find((t) => t.id === tagId)
                                      if (!tag) return null
                                      return (
                                        <Badge
                                          key={tag.id}
                                          variant="secondary"
                                          className="flex items-center gap-1 pr-1"
                                          style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                                        >
                                          {tag.name}
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-4 w-4 hover:bg-destructive/20 hover:text-destructive"
                                            onClick={() => toggleTag(tag.id)}
                                          >
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </Badge>
                                      )
                                    })}
                                  </div>
                                )}

                                {/* Available Tags */}
                                <div className="flex flex-wrap gap-2">
                                  {availableTags
                                    .filter((tag) => !selectedTags.includes(tag.id))
                                    .map((tag) => (
                                      <Button
                                        key={tag.id}
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-8 text-xs"
                                        onClick={() => toggleTag(tag.id)}
                                        disabled={selectedTags.length >= 5}
                                      >
                                        <PlusCircle className="mr-1 h-3 w-3" />
                                        {tag.name}
                                      </Button>
                                    ))}
                                </div>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Separator />

                      <div className="flex justify-end gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          className="bg-background/50 border-border/10"
                          asChild
                          disabled={isSubmitting || isSuccess}
                        >
                          <Link href={`/forum/categories/${category.slug}`}>Cancel</Link>
                        </Button>
                        <Button
                          type="submit"
                          className="bg-primary text-primary-foreground hover:bg-primary/90 min-w-[140px]"
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
                              <PlusCircle className="mr-2 h-4 w-4" />
                              Create Thread
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
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Guidelines */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Thread Guidelines</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="space-y-2">
                    <h4 className="font-medium">Before posting:</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Search for existing threads on your topic</li>
                      <li>• Use a clear, descriptive title</li>
                      <li>• Provide enough context and details</li>
                      <li>• Choose appropriate tags</li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-medium">Keep in mind:</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Be respectful and constructive</li>
                      <li>• Stay on topic for this category</li>
                      <li>• You can edit your thread after posting</li>
                      <li>• Moderators may move or edit threads</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* User Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Posting as</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium">{session.user.name?.charAt(0) || "U"}</span>
                    </div>
                    <div>
                      <p className="font-medium">{session.user.name}</p>
                      <p className="text-sm text-muted-foreground">{session.user.email}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Category Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Category Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Threads:</span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Posts:</span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Active Members:</span>
                    <span className="font-medium">0</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
