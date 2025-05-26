import { Suspense } from "react"
import { notFound } from "next/navigation"
import { Loader2 } from "lucide-react"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { db } from "@/db/drizzle"
import { thread } from "@/db/schema"
import { eq } from "drizzle-orm"
import { EditThreadForm } from "@/components/forum/forms/EditThreadForm"

interface ThreadEditPageProps {
  params: {
    categorySlug: string
    threadSlug: string
  }
}

export default async function ThreadEditPage({ params }: ThreadEditPageProps) {
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

  // Fetch thread
  const threadData = await db.query.thread.findFirst({
    where: eq(thread.slug, params.threadSlug),
    with: {
      author: true,
      category: true,
      tags: {
        with: {
          tag: true,
        },
      },
    },
  })

  if (!threadData) {
    notFound()
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
      <EditThreadForm thread={threadData} categorySlug={params.categorySlug} session={session} />
    </Suspense>
  )
}
