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
import { createCategory } from "@/actions/category"
import { ArrowLeft } from "lucide-react"

// Form schema
const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  description: z.string().max(500, "Description is too long").optional(),
  displayOrder: z.coerce.number().int().min(0),
  isHidden: z.boolean(),
  color: z.string().max(50),
});

export default function NewCategoryPage() {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Initialize form
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
          name: "",
          description: "",
          displayOrder: 0,
          isHidden: false,
          color: "#3498db",
        },
    })

    // Handle form submission with real server action
    const onSubmit = async (data: z.infer<typeof formSchema>) => {
        setIsSubmitting(true)
        try {
            const result = await createCategory(data)
            if (result.success) {
                toast.success("Category created successfully")
                router.push("/forum/admin/categories")
            } else {
                toast.error(result.error || "Failed to create category")
            }
        } catch (error) {
            console.error("Error creating category:", error)
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
                    <h1 className="text-3xl font-bold tracking-tight">New Category</h1>
                    <p className="text-muted-foreground">Create a new forum category.</p>
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
                            <Input
                            placeholder="Category name"
                            {...field}
                            />
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
                        {isSubmitting ? "Creating..." : "Create Category"}
                    </Button>
                    </div>
                </form>
                </Form>
            </div>
        </div>
    )
}
