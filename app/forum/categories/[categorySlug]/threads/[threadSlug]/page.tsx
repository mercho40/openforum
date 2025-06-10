import { Suspense } from "react"
import { notFound } from "next/navigation"
import { Loader2 } from "lucide-react"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { getThreadWithPosts, getAllThreads } from "@/actions/thread"
import { ThreadView } from "@/components/views/forum/ThreadView"
import { unstable_cache } from 'next/cache'

// Enable ISR for thread pages
export const revalidate = 180 // Revalidate every 3 minutes
export const dynamic = 'force-dynamic' // Keep dynamic for user sessions

// Generate static params for popular threads
export async function generateStaticParams() {
  try {
    const result = await getAllThreads({
      page: 1,
      perPage: 50, // Generate for top 50 threads
      sortBy: 'recent',
    })
    
    if (!result.success || !result.threads) return []
    
    return result.threads.map((thread) => ({
      categorySlug: thread.category?.slug || '',
      threadSlug: thread.slug,
    }))
  } catch {
    return []
  }
}

// Cache thread metadata for SEO
const getCachedThreadMetadata = unstable_cache(
  async (threadSlug: string) => {
    const result = await getThreadWithPosts(threadSlug, 1, 1)
    return result.success ? result.thread : null
  },
  ['thread-metadata'],
  {
    tags: ['thread-metadata'],
    revalidate: 900, // Cache for 15 minutes
  }
)

// Generate static metadata
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ categorySlug: string, threadSlug: string }> 
}) {
  try {
    const { threadSlug } = await params
    const thread = await getCachedThreadMetadata(threadSlug)
    
    if (!thread) {
      return {
        title: "Thread Not Found - OpenForum",
        description: "The requested thread could not be found.",
      }
    }

    return {
      title: `${thread.title} - OpenForum`,
      description: `Join the discussion about ${thread.title}. Created by ${thread.author?.name || 'Anonymous'}.`,
      openGraph: {
        title: `${thread.title} - OpenForum`,
        description: `Join the discussion about ${thread.title}. Created by ${thread.author?.name || 'Anonymous'}.`,
        type: "article",
        authors: [thread.author?.name || 'Anonymous'],
        publishedTime: thread.createdAt.toISOString(),
        modifiedTime: thread.updatedAt.toISOString(),
      },
      twitter: {
        card: 'summary_large_image',
        title: `${thread.title} - OpenForum`,
        description: `Join the discussion about ${thread.title}. Created by ${thread.author?.name || 'Anonymous'}.`,
      },
    }
  } catch {
    return {
      title: "Thread - OpenForum",
      description: "Join the discussion.",
    }
  }
}


export default async function ThreadPage({
  params, searchParams,
}: {
  params: Promise<{ categorySlug: string, threadSlug: string }>, searchParams: Promise<{ page?: string }>
}) {
  const searchPar = await searchParams
  const par = await params
  const page = Number.parseInt(searchPar.page || "1", 10)

  // Get the current user session
  let session = null
  try {
    session = await auth.api.getSession({
      headers: await headers(),
    })
  } catch (err) {
    console.error("Error fetching session:", err)
  }

  // Fetch thread with posts
  const result = await getThreadWithPosts(par.threadSlug, page, 20)

  if (!result.success || !result.thread) {
    notFound()
  }

  return (
    <Suspense
      fallback={
        <main className="flex min-h-[100dvh] flex-col items-center justify-center p-4">
          <Loader2 className="animate-spin text-muted-foreground" />
        </main>
      }
    >
      <ThreadView
        session={session}
        thread={result.thread}
        posts={result.posts || []}
        pagination={result.pagination}
        categorySlug={par.categorySlug}
      />
    </Suspense>
  )
}
