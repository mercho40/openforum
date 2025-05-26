"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { updateThread } from "@/actions/thread"
import { ArrowLeft, Check, Save, X, PlusCircle, Settings, Lock, Pin, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Session } from "@/lib/auth"
import { CategoryIcon } from "@/components/forum/CategoryIcon"

// Form schema
const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(200, "Title is too long"),
  categoryId: z.string().min(1, "Category is required"),
  tags: z.array(z.string()).max(5, "Maximum 5 tags allowed").optional(),
  isPinned: z.boolean().optional(),
  isLocked: z.boolean().optional(),
  isHidden: z.boolean().optional(),
})

type FormData = z.infer<typeof formSchema>

interface Thread {
  id: string
  title: string
  slug: string
  categoryId: string
  isPinned: boolean
  isLocked: boolean
  isHidden: boolean
  author: {
    id: string
    name: string | null
    image: string | null
  }
  category: {
    id: string
    name: string
    slug: string
    iconClass: string | null
    color: string | null
  }
  tags?: Array<{
    tag: {
      id: string
      name: string
      slug: string
      color: string
    }
  }>
}

interface ThreadEditFormProps {
  thread: Thread
  categorySlug: string
  session: Session
}

// Mock categories - in a real app, you'd fetch these from your database
const availableCategories = [
  { id: "1", name: "General Discussion", slug: "general", iconClass: "MessageSquare", color: "#3498db" },
  { id: "2", name: "Help & Support", slug: "help", iconClass: "HelpCircle", color: "#e74c3c" },
  { id: "3", name: "Development", slug: "development", iconClass: "Code", color: "#2ecc71" },
  { id: "4", name: "Announcements", slug: "announcements", iconClass: "Megaphone", color: "#f39c12" },
  { id: "5", name: "Off Topic", slug: "off-topic", iconClass: "Coffee", color: "#9b59b6" },
]

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

export function EditThreadForm({ thread, categorySlug, session }: ThreadEditFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>(thread.tags?.map((t) => t.tag.id) || [])

  const isAdmin = session.user.role === "admin"

  // Initialize form with thread data
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: thread.title,
      categoryId: thread.categoryId,
      tags: thread.tags?.map((t) => t.tag.id) || [],
      isPinned: thread.isPinned,
      isLocked: thread.isLocked,
      isHidden: thread.isHidden,
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
      const updateData: {
        title: string
        categoryId: string
        isPinned?: boolean
        isLocked?: boolean
        isHidden?: boolean
      } = {
        title: data.title,
        categoryId: data.categoryId,
      }

      // Only include admin fields if user is admin
      if (isAdmin) {
        updateData.isPinned = data.isPinned
        updateData.isLocked = data.isLocked
        updateData.isHidden = data.isHidden
      }

      const result = await updateThread(thread.id, updateData)

      if (result.success) {
        setIsSuccess(true)
        toast.success("Thread updated successfully")

        // Redirect after a short delay to show success state
        setTimeout(() => {
          const newSlug = result.slug || thread.slug
          router.push(`/forum/categories/${categorySlug}/threads/${newSlug}`)
        }, 1000)
      } else {
        toast.error(result.error || "Failed to update thread")
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error("Error updating thread:", error)
      toast.error("An unexpected error occurred")
      setIsSubmitting(false)
    }
  }

  const selectedCategory = availableCategories.find((cat) => cat.id === form.watch("categoryId"))

  return (
    <div className="min-h-screen w-full bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-card/50 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <Link href={`/forum/categories/${categorySlug}/threads/${thread.slug}`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Edit Thread</h1>
              <p className="text-sm text-muted-foreground">Update thread details</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/forum/categories/${categorySlug}/threads/${thread.slug}`}>
                <Eye className="mr-2 h-4 w-4" />
                View Thread
              </Link>
            </Button>
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
            <Link href={`/forum/categories/${categorySlug}`} className="hover:text-foreground">
              {thread.category.name}
            </Link>
            <span>/</span>
            <Link href={`/forum/categories/${categorySlug}/threads/${thread.slug}`} className="hover:text-foreground">
              {thread.title}
            </Link>
            <span>/</span>
            <span className="text-foreground">Edit</span>
          </nav>

          <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
            {/* Main Form */}
            <div className="space-y-6">
              {/* Current Thread Info */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-full flex items-center justify-center"
                      style={{
                        backgroundColor: thread.category.color ? `${thread.category.color}20` : "var(--primary-10)",
                      }}
                    >
                      <CategoryIcon iconName={thread.category.iconClass} color={thread.category.color} size="md" />
                    </div>
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {thread.isPinned && <Pin className="h-4 w-4 text-primary" />}
                        {thread.isLocked && <Lock className="h-4 w-4 text-muted-foreground" />}
                        {thread.isHidden && <EyeOff className="h-4 w-4 text-muted-foreground" />}
                        {thread.title}
                      </CardTitle>
                      <CardDescription>
                        Created by {thread.author.name} in {thread.category.name}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Edit Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Thread Details</CardTitle>
                  <CardDescription>Update the thread title, category, and other settings</CardDescription>
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
                        name="categoryId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-background/50 border-border/10">
                                  <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {availableCategories.map((category) => (
                                  <SelectItem key={category.id} value={category.id}>
                                    <div className="flex items-center gap-2">
                                      <div
                                        className="h-4 w-4 rounded-full flex items-center justify-center"
                                        style={{
                                          backgroundColor: category.color ? `${category.color}20` : "var(--primary-10)",
                                        }}
                                      >
                                        <CategoryIcon
                                          iconName={category.iconClass}
                                          color={category.color}
                                          size="sm"
                                          className="h-3 w-3"
                                        />
                                      </div>
                                      {category.name}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>Move this thread to a different category if needed.</FormDescription>
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

                      {/* Admin Controls */}
                      {isAdmin && (
                        <>
                          <Separator />
                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <Settings className="h-4 w-4" />
                              <h3 className="text-sm font-medium">Moderation Settings</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <FormField
                                control={form.control}
                                name="isPinned"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-border/10 p-4 bg-background/30">
                                    <FormControl>
                                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                      <FormLabel className="flex items-center gap-2">
                                        <Pin className="h-4 w-4" />
                                        Pinned
                                      </FormLabel>
                                      <FormDescription>Pin this thread to the top of the category</FormDescription>
                                    </div>
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="isLocked"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-border/10 p-4 bg-background/30">
                                    <FormControl>
                                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                      <FormLabel className="flex items-center gap-2">
                                        <Lock className="h-4 w-4" />
                                        Locked
                                      </FormLabel>
                                      <FormDescription>Prevent new replies to this thread</FormDescription>
                                    </div>
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
                                      <FormLabel className="flex items-center gap-2">
                                        <EyeOff className="h-4 w-4" />
                                        Hidden
                                      </FormLabel>
                                      <FormDescription>Hide this thread from public view</FormDescription>
                                    </div>
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        </>
                      )}

                      <Separator />

                      <div className="flex justify-end gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          className="bg-background/50 border-border/10"
                          asChild
                          disabled={isSubmitting || isSuccess}
                        >
                          <Link href={`/forum/categories/${categorySlug}/threads/${thread.slug}`}>Cancel</Link>
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
                              <Save className="mr-2 h-4 w-4" />
                              Save Changes
                            </span>

                            {/* Loading State */}
                            <span
                              className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
                                isSubmitting && !isSuccess
                                  ? "opacity-100 transform translate-y-0"
                                  : "opacity-0 transform translate-y-8"
                              }`}
                            >
                              Saving...
                            </span>

                            {/* Success State */}
                            <span
                              className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
                                isSuccess ? "opacity-100 transform translate-y-0" : "opacity-0 transform translate-y-8"
                              }`}
                            >
                              <Check className="mr-2 h-4 w-4" />
                              Saved!
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
              {/* Current Category */}
              {selectedCategory && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Moving to Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                      <div
                        className="h-10 w-10 rounded-full flex items-center justify-center"
                        style={{
                          backgroundColor: selectedCategory.color ? `${selectedCategory.color}20` : "var(--primary-10)",
                        }}
                      >
                        <CategoryIcon
                          iconName={selectedCategory.iconClass}
                          color={selectedCategory.color}
                          size="md"
                          className="h-5 w-5"
                        />
                      </div>
                      <div>
                        <p className="font-medium">{selectedCategory.name}</p>
                        <p className="text-sm text-muted-foreground">New category</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Edit Guidelines */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Edit Guidelines</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="space-y-2">
                    <h4 className="font-medium">What you can edit:</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Thread title</li>
                      <li>• Category assignment</li>
                      <li>• Thread tags</li>
                      {isAdmin && <li>• Moderation settings</li>}
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-medium">Keep in mind:</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Changes are logged for moderation</li>
                      <li>• Moving categories may affect visibility</li>
                      <li>• URL will update if title changes</li>
                      {isAdmin && <li>• Moderation actions are immediate</li>}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Thread Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Thread Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Author:</span>
                    <span className="font-medium">{thread.author.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current Category:</span>
                    <span className="font-medium">{thread.category.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <div className="flex gap-1">
                      {thread.isPinned && (
                        <Badge variant="secondary" className="text-xs">
                          Pinned
                        </Badge>
                      )}
                      {thread.isLocked && (
                        <Badge variant="secondary" className="text-xs">
                          Locked
                        </Badge>
                      )}
                      {thread.isHidden && (
                        <Badge variant="secondary" className="text-xs">
                          Hidden
                        </Badge>
                      )}
                      {!thread.isPinned && !thread.isLocked && !thread.isHidden && (
                        <Badge variant="secondary" className="text-xs">
                          Normal
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current Tags:</span>
                    <span className="font-medium">{thread.tags?.length || 0}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Permissions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Your Permissions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Edit Title:</span>
                    <span className="font-medium text-green-600">✓ Yes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Change Category:</span>
                    <span className="font-medium text-green-600">✓ Yes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Edit Tags:</span>
                    <span className="font-medium text-green-600">✓ Yes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Moderation:</span>
                    <span className={`font-medium ${isAdmin ? "text-green-600" : "text-red-600"}`}>
                      {isAdmin ? "✓ Yes" : "✗ No"}
                    </span>
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
