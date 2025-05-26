import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { getCategories } from "@/actions/category"
import { CategoriesView } from "@/components/views/forum/CategoriesView"

export default async function CategoriesPage() {
  // Get the current user session
  let session = null
  try {
    session = await auth.api.getSession({
      headers: await headers(),
    })
  } catch (err) {
    console.error("Error fetching session:", err)
  }

  // Fetch all categories with stats
  const result = await getCategories()

  if (!result.success) {
    throw new Error(result.error || "Failed to fetch categories")
  }

  return (
    <Suspense
      fallback={
        <main className="flex min-h-[100dvh] flex-col items-center justify-center p-4">
          <Loader2 className="animate-spin text-muted-foreground" />
        </main>
      }
    >
      <CategoriesView session={session} categories={result.categories || []} />
    </Suspense>
  )
}
