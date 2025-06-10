import { Suspense } from "react"
import { notFound } from "next/navigation"
import { Loader2 } from "lucide-react"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { getCategories } from "@/actions/category"
import { NewThreadForm } from "@/components/forum/forms/NewThreadForm"
import { unstable_cache } from 'next/cache'

// Enable ISR for new thread page
export const revalidate = 600 // Revalidate every 10 minutes
export const dynamic = "force-dynamic" // Keep dynamic for auth requirements

// Cache categories for new thread form
const getCachedNewThreadCategories = unstable_cache(
  async () => {
    const result = await getCategories()
    return result.success ? result.categories : []
  },
  ['new-thread-categories'],
  {
    tags: ['categories'],
    revalidate: 1800, // Cache for 30 minutes
  }
)

// Generate static metadata
export async function generateMetadata() {
  return {
    title: "Create New Thread - OpenForum",
    description: "Start a new discussion in the OpenForum community.",
    openGraph: {
      title: "Create New Thread - OpenForum",
      description: "Start a new discussion in the OpenForum community.",
      type: "website",
    },
    robots: {
      index: false, // Don't index creation pages
      follow: false,
    },
  }
}

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

  // Use cached categories
  const categories = await getCachedNewThreadCategories()

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
