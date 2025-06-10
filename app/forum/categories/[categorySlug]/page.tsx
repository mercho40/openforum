import { Suspense } from "react"
import { notFound } from "next/navigation"
import { Loader2 } from 'lucide-react'
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { getCategoryWithThreads, getOnlyCategories } from "@/actions/category"
import { CategoryView } from "@/components/views/forum/CategoryView"
import { unstable_cache } from 'next/cache'

// Enable ISR for category pages
export const revalidate = 300 // Revalidate every 5 minutes
export const dynamic = 'force-dynamic' // Keep dynamic for user sessions

// Generate static params for popular categories
export async function generateStaticParams() {
  try {
    const result = await getOnlyCategories()
    if (!result.success || !result.categories) return []
    
    // Generate params for all categories
    return result.categories.map((category) => ({
      categorySlug: category.slug,
    }))
  } catch {
    return []
  }
}

// Cache category metadata
const getCachedCategoryMetadata = unstable_cache(
  async (categorySlug: string) => {
    const result = await getCategoryWithThreads(categorySlug, 1, 1)
    return result.success ? result.category : null
  },
  ['category-metadata'],
  {
    tags: ['category-metadata'],
    revalidate: 1800, // Cache for 30 minutes
  }
)

// Generate static metadata
export async function generateMetadata({ params }: { params: Promise<{ categorySlug: string }> }) {
  try {
    const { categorySlug } = await params
    const category = await getCachedCategoryMetadata(categorySlug)
    
    if (!category) {
      return {
        title: "Category Not Found - OpenForum",
        description: "The requested category could not be found.",
      }
    }

    return {
      title: `${category.name} - OpenForum`,
      description: category.description || `Browse discussions in the ${category.name} category.`,
      openGraph: {
        title: `${category.name} - OpenForum`,
        description: category.description || `Browse discussions in the ${category.name} category.`,
        type: "website",
      },
    }
  } catch {
    return {
      title: "Category - OpenForum",
      description: "Browse category discussions.",
    }
  }
}

interface CategoryPageProps {
  params: Promise<{
    categorySlug: string
  }>
  searchParams: Promise<{
    page?: string
  }>
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { categorySlug } = await params
  const { page: pageParam } = await searchParams
  const page = parseInt(pageParam || "1", 10)
  
  // Get the current user session
  let session = null
  try {
    session = await auth.api.getSession({
      headers: await headers()
    })
  } catch (err) {
    console.error("Error fetching session:", err)
  }

  // Fetch category with threads
  const result = await getCategoryWithThreads(categorySlug, page, 20)
  
  if (!result.success || !result.category) {
    notFound()
  }

  return (
    <Suspense fallback={
      <main className="flex min-h-[100dvh] flex-col items-center justify-center p-4">
        <Loader2 className="animate-spin text-muted-foreground" />
      </main>
    }>
      <CategoryView
        session={session}
        category={result.category}
        threads={result.threads || []}
        pagination={result.pagination}
      />
    </Suspense>
  )
}