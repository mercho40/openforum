import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { ForumHomeView } from "@/components/views/forum/ForumHomeView"
import { getCategories } from "@/actions/category"
import { getHomePageThreads } from "@/actions/thread"

// Define a type that matches what ForumHomeView expects
type CategoryWithStats = {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  iconClass: string | null;
  color: string | null;
  threadCount: number;
  postCount: number;
  lastThread: {
    id: string;
    title: string;
    slug: string;
    createdAt: Date;
    author: {
      id: string;
      name: string;
      image: string | null;
    };
  } | null;
};

export default async function ForumPage() {
  // Get the current user session
  let session = null;
  let error = null;

  try {
    session = await auth.api.getSession({
      headers: await headers()
    })
  } catch (err) {
    error = err as Error;
    console.error("Error fetching session:", error);
  }

  // Fetch categories and thread data using server actions
  const [categoriesResult, homePageThreadsResult] = await Promise.all([
    getCategories(),
    getHomePageThreads()
  ]);

  // Extract data from results with fallbacks if needed
  // Use type casting with a specific type instead of 'any'
  const categories = categoriesResult.success && categoriesResult.categories
    ? (categoriesResult.categories as CategoryWithStats[])
    : [] as CategoryWithStats[];

  const recentThreads = homePageThreadsResult.success ? homePageThreadsResult.recentThreads : [];
  const trendingThreads = homePageThreadsResult.success ? homePageThreadsResult.trendingThreads : [];

  return (
    <Suspense fallback={<main className="flex min-h-[100dvh] flex-col items-center justify-center p-4"><Loader2 className="animate-spin text-muted-foreground" /></main>}>
      <ForumHomeView
        session={session}
        categories={categories}
        recentThreads={recentThreads}
        trendingThreads={trendingThreads}
      />
    </Suspense>
  )
}
