import { Suspense } from "react"
import { notFound } from "next/navigation"
import { Loader2 } from 'lucide-react'
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { getCategoryWithThreads } from "@/actions/category"
import { CategoryView } from "@/components/(olds)/views/forum/CategoryView"

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