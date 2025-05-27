import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { getAllThreads } from "@/actions/thread"
import { AllThreadsView } from "@/components/views/forum/AllThreadsView"
import { getCategories } from "@/actions/category"

interface ThreadsPageProps {
  searchParams: Promise<{
    page?: string
    sort?: string
    category?: string
    search?: string
    filter?: string
  }>
}

export default async function ThreadsPage({ searchParams }: ThreadsPageProps) {
    const params = await searchParams // Await the searchParams Promise
    
    const page = Number.parseInt(params.page || "1", 10)
    const sort = params.sort || "recent"
    const categoryFilter = params.category
    const searchQuery = params.search
    const filter = params.filter

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

    const threadsResult = await getAllThreads({
        page,
        perPage: 20,
        sortBy,
        categoryId: categoryFilter,
        searchQuery,
        filter: filter as 'pinned' | 'locked' | undefined,
    })

    const categoriesResult = await getCategories()

    if (!threadsResult.success) {
        throw new Error(threadsResult.error || "Failed to fetch threads")
    }

    if (!categoriesResult.success) {
        throw new Error(categoriesResult.error || "Failed to fetch categories")
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
                categories={categoriesResult.categories || []}
                pagination={threadsResult.pagination}
                currentSort={sort} // Pass the original sort value for UI display
                currentCategory={categoryFilter}
                currentSearch={searchQuery}
                currentFilter={filter}
            />
        </Suspense>
    )
}
