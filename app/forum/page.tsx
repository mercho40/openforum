import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { ForumHomeView } from "@/components/views/forum/ForumHomeView"
import { getCategories } from "@/actions/category"
import { getHomePageThreads } from "@/actions/thread"
import { getUserStats, getForumStats } from "@/actions/stats"
import { unstable_cache } from 'next/cache'

// Enable ISR for forum homepage with smart revalidation
export const revalidate = 300 // Revalidate every 5 minutes
export const dynamic = 'force-dynamic' // Keep dynamic for user sessions

// Cache static data that doesn't change frequently
const getCachedCategories = unstable_cache(
  async () => {
    const result = await getCategories()
    return result.success ? result.categories : []
  },
  ['forum-categories'],
  {
    tags: ['categories'],
    revalidate: 600, // Cache for 10 minutes
  }
)

const getCachedForumStats = unstable_cache(
  async () => {
    return await getForumStats()
  },
  ['forum-stats'],
  {
    tags: ['forum-stats'],
    revalidate: 300, // Cache for 5 minutes
  }
)

// Generate static metadata
export async function generateMetadata() {
  const forumStats = await getCachedForumStats()
  
  return {
    title: "Forum - OpenForum",
    description: `Join our community forum with ${forumStats?.totalThreads || 0} discussions and ${forumStats?.totalMembers || 0} members.`,
    openGraph: {
      title: "Forum - OpenForum",
      description: `Join our community forum with ${forumStats?.totalThreads || 0} discussions and ${forumStats?.totalMembers || 0} members.`,
      type: "website",
    },
  }
}

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

  // Use cached categories and forum stats
  const [categories, homePageThreadsResult, forumStats] = await Promise.all([
    getCachedCategories(),
    getHomePageThreads(), // This needs to be fresh for trending content
    getCachedForumStats()
  ]);

  // Extract thread data from results with fallbacks
  const recentThreads = homePageThreadsResult.success ? homePageThreadsResult.recentThreads : [];
  const trendingThreads = homePageThreadsResult.success ? homePageThreadsResult.trendingThreads : [];

  // Fetch user stats only if user is logged in
  const rawUserStats = session?.user?.id 
    ? await getUserStats(session.user.id)
    : null;
  const userStats = rawUserStats === null ? undefined : rawUserStats;

  return (
    <Suspense fallback={<main className="flex min-h-[100dvh] flex-col items-center justify-center p-4"><Loader2 className="animate-spin text-muted-foreground" /></main>}>
      <ForumHomeView
        session={session}
        categories={categories as CategoryWithStats[]}
        recentThreads={recentThreads}
        trendingThreads={trendingThreads}
        userStats={userStats}
        forumStats={forumStats}
      />
    </Suspense>
  )
}
