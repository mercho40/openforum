import { Suspense } from "react"
import { SearchView } from "@/components/views/forum/SearchView"
import { getAllThreads } from "@/actions/thread"
import { getOnlyCategories } from "@/actions/category"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

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
  
  const pageNumber = page ? parseInt(page) : 1
  
  // Get categories for the filter dropdown
  const categoriesResult = await getOnlyCategories()
  const categories = categoriesResult.success ? categoriesResult.categories : []
  
  // Get threads based on search query
  const threadsResult = await getAllThreads({
    page: pageNumber,
    perPage: 10,
    categoryId: category,
    sortBy: sort === 'views' ? 'views' : sort === 'replies' ? 'replies' : 'recent',
    searchQuery: q,
    filter: filter as 'pinned' | 'locked' | undefined
  })
  
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
