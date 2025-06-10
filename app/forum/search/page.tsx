import { Suspense } from "react"
import { SearchView } from "@/components/views/forum/SearchView"
import { getAllThreads } from "@/actions/thread"
import { getOnlyCategories } from "@/actions/category"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { unstable_cache } from 'next/cache'

// Enable ISR for search page
export const revalidate = 600 // Revalidate every 10 minutes
export const dynamic = 'force-dynamic' // Keep dynamic for user sessions and search queries

// Cache categories for search filters
const getCachedSearchCategories = unstable_cache(
  async () => {
    const result = await getOnlyCategories()
    return result.success ? result.categories : []
  },
  ['search-categories'],
  {
    tags: ['categories'],
    revalidate: 1800, // Cache for 30 minutes
  }
)

// Cache popular search results
const getCachedSearchResults = unstable_cache(
  async (searchParams: {
    q?: string
    category?: string
    sort?: string
    filter?: string
    page?: string
  }) => {
    const { q, category, sort, filter, page } = searchParams
    const pageNumber = page ? parseInt(page) : 1
    
    return await getAllThreads({
      page: pageNumber,
      perPage: 10,
      categoryId: category,
      sortBy: sort === 'views' ? 'views' : sort === 'replies' ? 'replies' : 'recent',
      searchQuery: q,
      filter: filter as 'pinned' | 'locked' | undefined
    })
  },
  ['search-results'],
  {
    tags: ['search-results', 'threads'],
    revalidate: 300, // Cache for 5 minutes
  }
)

// Generate static metadata
export async function generateMetadata({ 
  searchParams 
}: { 
  searchParams: Promise<{ q?: string }> 
}) {
  const params = await searchParams
  const query = params.q
  
  if (query) {
    return {
      title: `Search: "${query}" - OpenForum`,
      description: `Search results for "${query}" in OpenForum discussions.`,
      openGraph: {
        title: `Search: "${query}" - OpenForum`,
        description: `Search results for "${query}" in OpenForum discussions.`,
        type: "website",
      },
    }
  }
  
  return {
    title: "Search - OpenForum",
    description: "Search through forum discussions and find what you're looking for.",
    openGraph: {
      title: "Search - OpenForum",
      description: "Search through forum discussions and find what you're looking for.",
      type: "website",
    },
  }
}

interface SearchPageProps {
  searchParams: Promise<{
    q?: string
    category?: string
    sort?: string
    filter?: string
    page?: string
  }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams
  
  const session = await auth.api.getSession({
    headers: await headers()
  })

  const { q, category, sort, filter, page } = params
  
  // Get cached categories for filter dropdown
  const categories = await getCachedSearchCategories()
  
  // For cached results, only cache non-user-specific searches
  let threadsResult
  if (!q || q.length < 3) {
    // For empty or short queries, get fresh results
    const pageNumber = page ? parseInt(page) : 1
    threadsResult = await getAllThreads({
      page: pageNumber,
      perPage: 10,
      categoryId: category,
      sortBy: sort === 'views' ? 'views' : sort === 'replies' ? 'replies' : 'recent',
      searchQuery: q,
      filter: filter as 'pinned' | 'locked' | undefined
    })
  } else {
    // For substantial queries, use caching
    threadsResult = await getCachedSearchResults(params)
  }
  
  const threads = threadsResult.success ? threadsResult.threads : []
  const pagination = threadsResult.success ? threadsResult.pagination : {
    total: 0,
    page: 1,
    perPage: 10,
    totalPages: 0
  }

  return (
    <Suspense fallback={<div className="p-12 text-center">Loading search results...</div>}>
      <SearchView 
        session={session} 
        threads={threads} 
        categories={categories ?? []}
        pagination={pagination}
        currentSearch={q || ""}
        currentCategory={category}
        currentSort={sort || "recent"}
        currentFilter={filter}
      />
    </Suspense>
  )
}
