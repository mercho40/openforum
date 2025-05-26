import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import { desc, eq, sql, and } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { db } from "@/db/drizzle"
import { category, post, thread, user } from "@/db/schema"
import { ForumHomeView } from "@/components/views/forum/ForumHomeView"


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

  // Fetch categories with thread and post counts
  const categoriesQuery = await db
    .select({
      id: category.id,
      name: category.name,
      description: category.description,
      slug: category.slug,
      iconClass: category.iconClass,
      color: category.color,
    })
    .from(category)
    .where(eq(category.isHidden, false))
    .orderBy(category.displayOrder)

  // Get counts and last thread for each category
  const categoriesWithCounts = await Promise.all(
    categoriesQuery.map(async (cat) => {
      // Get thread count
      const threadCountResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(thread)
        .where(and(eq(thread.categoryId, cat.id), eq(thread.isHidden, false)))

      // Get post count
      const postCountResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(post)
        .innerJoin(thread, eq(post.threadId, thread.id))
        .where(and(eq(thread.categoryId, cat.id), eq(thread.isHidden, false), eq(post.isDeleted, false)))

      // Get last thread
      const lastThreadResult = await db
        .select({
          id: thread.id,
          title: thread.title,
          slug: thread.slug,
          createdAt: thread.createdAt,
          author: {
            id: user.id,
            name: user.name,
            image: user.image,
          },
        })
        .from(thread)
        .innerJoin(user, eq(thread.authorId, user.id))
        .where(and(eq(thread.categoryId, cat.id), eq(thread.isHidden, false)))
        .orderBy(desc(thread.createdAt))
        .limit(1)

      return {
        ...cat,
        threadCount: threadCountResult[0]?.count || 0,
        postCount: postCountResult[0]?.count || 0,
        lastThread: lastThreadResult[0] || null,
      }
    })
  )

  // Fetch recent threads
  const recentThreads = await db
    .select({
      id: thread.id,
      title: thread.title,
      slug: thread.slug,
      createdAt: thread.createdAt,
      viewCount: thread.viewCount,
      replyCount: thread.replyCount,
      isPinned: thread.isPinned,
      isLocked: thread.isLocked,
      categoryId: thread.categoryId,
      categoryName: category.name,
      categorySlug: category.slug,
      author: {
        id: user.id,
        name: user.name,
        image: user.image,
      },
    })
    .from(thread)
    .innerJoin(category, eq(thread.categoryId, category.id))
    .innerJoin(user, eq(thread.authorId, user.id))
    .where(eq(thread.isHidden, false))
    .orderBy(desc(thread.lastPostAt))
    .limit(10)

  // Fetch trending threads (most viewed in last week)
  const trendingThreads = await db
    .select({
      id: thread.id,
      title: thread.title,
      slug: thread.slug,
      viewCount: thread.viewCount,
      replyCount: thread.replyCount,
      categoryId: thread.categoryId,
      categoryName: category.name,
      categorySlug: category.slug,
      author: {
        id: user.id,
        name: user.name,
        image: user.image,
      },
    })
    .from(thread)
    .innerJoin(category, eq(thread.categoryId, category.id))
    .innerJoin(user, eq(thread.authorId, user.id))
    .where(and(
      sql`${thread.createdAt} > NOW() - INTERVAL '7 days'`,
      eq(thread.isHidden, false)
    ))
    .orderBy(desc(thread.viewCount))
    .limit(5)

  return (
    <Suspense fallback={<main className="flex min-h-[100dvh] flex-col items-center justify-center p-4"><Loader2 className="animate-spin text-muted-foreground" /></main>}>
      <ForumHomeView
        session={session}
        categories={categoriesWithCounts}
        recentThreads={recentThreads}
        trendingThreads={trendingThreads}
      />
    </Suspense>
  )
}
