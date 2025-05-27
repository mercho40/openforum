import { Suspense } from "react"
import { notFound } from "next/navigation"
import { Loader2 } from "lucide-react"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
// import { db } from "@/db/drizzle"
// import { thread } from "@/db/schema"
// import { eq } from "drizzle-orm"
import { getThreadData } from "@/actions/thread"
import { EditThreadForm } from "@/components/forum/forms/EditThreadForm"


export default async function ThreadEditPage({
  params,
}: {
  params: Promise<{ categorySlug: string, threadSlug: string }>
}) {
  // Get the current user session
  let session = null
  try {
    session = await auth.api.getSession({
      headers: await headers(),
    })
  } catch (err) {
    console.error("Error fetching session:", err)
  }

  if (!session?.user?.id) {
    notFound()
  }
  const { categorySlug, threadSlug } = await params

  // Fetch thread
  // const threadData = await db.query.thread.findFirst({
  //   where: eq(thread.slug, threadSlug),
  //   with: {
  //     author: true,
  //     category: true,
  //     tags: {
  //       with: {
  //         tag: true,
  //       },
  //     },
  //   },
  // })
  //
  const { threadData, success, error } = await getThreadData(threadSlug)
  if (!threadData) {
    notFound()
  }
  if (!success) {
    throw new Error(error || "Failed to fetch categories")
  }


  // Check if user can edit (author or admin)
  const canEdit = threadData.authorId === session.user.id || session.user.role === "admin"
  if (!canEdit) {
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
      <EditThreadForm thread={threadData} categorySlug={categorySlug} session={session} />
    </Suspense>
  )
}
