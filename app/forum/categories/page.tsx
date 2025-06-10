import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { getCategories } from "@/actions/category"
import { CategoriesView } from "@/components/views/forum/CategoriesView"
import { unstable_cache } from 'next/cache'

// Enable ISR for categories page
export const revalidate = 600 // Revalidate every 10 minutes
export const dynamic = 'force-dynamic' // Keep dynamic for user sessions

// Cache categories with statistics
const getCachedCategoriesWithStats = unstable_cache(
  async () => {
    const result = await getCategories()
    if (!result.success) {
      throw new Error(result.error || "Failed to fetch categories")
    }
    return result.categories || []
  },
  ['categories-with-stats'],
  {
    tags: ['categories', 'category-stats'],
    revalidate: 600, // Cache for 10 minutes
  }
)

// Generate static metadata
export async function generateMetadata() {
  try {
    const categories = await getCachedCategoriesWithStats()
    
    return {
      title: "Categories - OpenForum",
      description: `Browse all ${categories.length} forum categories and join discussions that interest you.`,
      openGraph: {
        title: "Categories - OpenForum",
        description: `Browse all ${categories.length} forum categories and join discussions that interest you.`,
        type: "website",
      },
    }
  } catch {
    return {
      title: "Categories - OpenForum",
      description: "Browse forum categories and join discussions that interest you.",
    }
  }
}

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

  // Use cached categories with stats
  const categories = await getCachedCategoriesWithStats()

  return (
    <Suspense
      fallback={
        <main className="flex min-h-[100dvh] flex-col items-center justify-center p-4">
          <Loader2 className="animate-spin text-muted-foreground" />
        </main>
      }
    >
      <CategoriesView session={session} categories={categories} />
    </Suspense>
  )
}
