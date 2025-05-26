import { Suspense } from "react"
import { notFound } from "next/navigation"
import { Loader2 } from "lucide-react"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { db } from "@/db/drizzle"
import { category } from "@/db/schema"
import { eq } from "drizzle-orm"
import { NewThreadForm } from "@/components/forum/forms/NewThreadForm"

interface NewThreadPageProps {
  params: {
    categorySlug: string
  }
}

export default async function NewThreadPage({ params }: NewThreadPageProps) {
  // Get the categorySlug parameter
  const { categorySlug } = await params
  
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

  // Fetch category
  const categoryData = await db.query.category.findFirst({
    where: eq(category.slug, categorySlug),
  })

  if (!categoryData) {
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
      <NewThreadForm category={categoryData} session={session} />
    </Suspense>
  )
}
