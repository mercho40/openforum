import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { getAllThreads } from "@/actions/thread"
import { AllThreadsView } from "@/components/views/forum/AllThreadsView"
import { getCategories } from "@/actions/category"
import { getUserProfile } from "@/actions/user"
import { unstable_cache } from 'next/cache'

// Enable ISR for threads page
export const revalidate = 180 // Revalidate every 3 minutes
export const dynamic = 'force-dynamic' // Keep dynamic for user sessions

// Cache categories for filter dropdown
const getCachedThreadsCategories = unstable_cache(
  async () => {
    const result = await getCategories()
    return result.success ? result.categories : []
  },
  ['threads-categories'],
  {
    tags: ['categories'],
    revalidate: 1800, // Cache for 30 minutes
  }
)

// Cache thread listings for popular pages
const getCachedThreadListing = unstable_cache(
  async (cacheKey: string, options: {
    page: number
    sortBy: 'recent' | 'popular' | 'views' | 'replies'
    categoryId?: string
    searchQuery?: string
    filter?: string
    authorId?: string
  }) => {
    return await getAllThreads({
      page: options.page,
      perPage: 20,
      sortBy: options.sortBy,
      categoryId: options.categoryId,
      searchQuery: options.searchQuery,
      filter: options.filter as 'pinned' | 'locked' | undefined,
      authorId: options.authorId,
    })
  },
  ['thread-listing'],
  {
    tags: ['threads', 'thread-listing'],
    revalidate: 180, // Cache for 3 minutes
  }
)

// Generate static metadata
export async function generateMetadata({ 
  searchParams 
}: { 
  searchParams: Promise<{ 
    sort?: string
    category?: string
    search?: string
    author?: string
  }> 
}) {
  const params = await searchParams
  const { sort, category, search, author } = params
  
  let title = "All Threads - OpenForum"
  let description = "Browse all forum discussions and join the conversation."
  
  if (search) {
    title = `Search: "${search}" - Threads | OpenForum`
    description = `Search results for "${search}" in forum threads.`
  } else if (category) {
    title = `${category} Threads - OpenForum`
    description = `Browse threads in the ${category} category.`
  } else if (author) {
    title = `Threads by ${author} - OpenForum`
    description = `Browse all threads created by ${author}.`
  } else if (sort) {
    const sortMap: Record<string, string> = {
      recent: 'Recent',
      popular: 'Popular',
      views: 'Most Viewed',
      replies: 'Most Replied'
    }
    const sortName = sortMap[sort] || 'Recent'
    title = `${sortName} Threads - OpenForum`
    description = `Browse ${sortName.toLowerCase()} forum discussions.`
  }
  
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
  }
}

interface ThreadsPageProps {
  searchParams: Promise<{
    page?: string
    sort?: string
    category?: string
    search?: string
    filter?: string
    author?: string
  }>
}

export default async function ThreadsPage({ searchParams }: ThreadsPageProps) {
    const params = await searchParams // Await the searchParams Promise
    
    const page = Number.parseInt(params.page || "1", 10)
    const sort = params.sort || "recent"
    const categoryFilter = params.category
    const searchQuery = params.search
    const filter = params.filter
    const authorFilter = params.author

    // Get the current user session
    let session = null
    try {
        session = await auth.api.getSession({
        headers: await headers(),
        })
    } catch (err) {
        console.error("Error fetching session:", err)
    }

    // Validate parameters
    if (!page || page < 1) {
        throw new Error("Invalid page number")
    }

    // Map sort values from URL to getAllThreads sortBy values
    let sortBy: 'recent' | 'popular' | 'views' | 'replies' = 'recent'
    switch (sort) {
        case 'recent':
        case 'lastPost':
            sortBy = 'recent'
            break
        case 'popular':
            sortBy = 'popular'
            break
        case 'views':
            sortBy = 'views'
            break
        case 'replies':
            sortBy = 'replies'
            break
        case 'title':
        case 'created':
            // These don't map directly to getAllThreads options, default to recent
            sortBy = 'recent'
            break
        default:
            sortBy = 'recent'
            break
    }

    // Validate filter parameter
    if (filter && filter !== "pinned" && filter !== "locked") {
        throw new Error("Invalid filter parameter")
    }

    // Fetch author data if filtering by author
    let authorData: {
        id: string
        name: string
        image?: string | null
        username?: string | null
        displayUsername?: string | null
    } | undefined = undefined
    if (authorFilter) {
        const authorResult = await getUserProfile(authorFilter)
        if (authorResult.success && authorResult.userData) {
            authorData = {
                id: authorResult.userData.id,
                name: authorResult.userData.name,
                image: authorResult.userData.image,
                username: authorResult.userData.username,
                displayUsername: authorResult.userData.displayUsername,
            }
        }
    }

    // Use caching for popular thread listings (first few pages without complex filters)
    let threadsResult
    const shouldUseCache = page <= 3 && !searchQuery && !authorFilter
    const cacheKey = `threads-${sort}-${categoryFilter || 'all'}-${filter || 'none'}-page-${page}`
    
    if (shouldUseCache) {
        threadsResult = await getCachedThreadListing(cacheKey, {
            page,
            sortBy,
            categoryId: categoryFilter,
            searchQuery,
            filter,
            authorId: authorFilter,
        })
    } else {
        threadsResult = await getAllThreads({
            page,
            perPage: 20,
            sortBy,
            categoryId: categoryFilter,
            searchQuery,
            filter: filter as 'pinned' | 'locked' | undefined,
            authorId: authorFilter,
        })
    }

    // Use cached categories
    const categories = await getCachedThreadsCategories()

    if (!threadsResult.success) {
        throw new Error(threadsResult.error || "Failed to fetch threads")
    }

    return (
        <Suspense
            fallback={
                <main className="flex min-h-[100dvh] flex-col items-center justify-center p-4">
                    <Loader2 className="animate-spin text-muted-foreground" />
                </main>
            }
        >
            <AllThreadsView
                session={session}
                threads={threadsResult.threads || []}
                categories={categories || []}
                pagination={threadsResult.pagination}
                currentSort={sort} // Pass the original sort value for UI display
                currentCategory={categoryFilter}
                currentSearch={searchQuery}
                currentFilter={filter}
                currentAuthor={authorFilter}
                authorData={authorData}
            />
        </Suspense>
    )
}
