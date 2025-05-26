import { Suspense } from "react"
import { notFound } from "next/navigation"
import { Loader2 } from "lucide-react"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { db } from "@/db/drizzle"
import { NewThreadForm } from "@/components/forum/forms/NewThreadForm"

export default async function NewThreadPage() {
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

  // Fetch all categories
  const categories = await db.query.category.findMany({
    orderBy: (category, { asc }) => [asc(category.name)],
  })

  if (!categories || categories.length === 0) {
    notFound()
  }

  return (
    <Suspense
      fallback={
        <main className="flex min-h-[100dvh] w-full flex-col items-center justify-center p-4">
          <Loader2 className="animate-spin text-muted-foreground" />
        </main>
      }
    >
      <NewThreadForm categories={categories} session={session} />
    </Suspense>
  )
}