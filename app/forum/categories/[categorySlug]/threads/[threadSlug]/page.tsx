import { Suspense } from "react"
import { notFound } from "next/navigation"
import { Loader2 } from "lucide-react"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { getThreadWithPosts } from "@/actions/thread"
import { ThreadView } from "@/components/views/forum/ThreadView"


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
