import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getForumMembers } from "@/actions/user";
import { MembersView } from "@/components/views/forum/MembersView";
import { unstable_cache } from 'next/cache';

// Enable ISR for members page
export const revalidate = 900 // Revalidate every 15 minutes
export const dynamic = 'force-dynamic' // Keep dynamic for user sessions

// Cache member counts for metadata
const getCachedMemberCount = unstable_cache(
  async () => {
    const result = await getForumMembers({
      page: 1,
      search: "",
      sort: "newest",
      limit: 1,
    })
    return result.success ? result.pagination?.totalItems || 0 : 0
  },
  ['member-count'],
  {
    tags: ['members', 'user-stats'],
    revalidate: 1800, // Cache for 30 minutes
  }
)

// Generate static metadata
export async function generateMetadata() {
  try {
    const memberCount = await getCachedMemberCount()
    
    return {
      title: "Members - OpenForum",
      description: `Browse ${memberCount} forum members and connect with the community.`,
      openGraph: {
        title: "Members - OpenForum",
        description: `Browse ${memberCount} forum members and connect with the community.`,
        type: "website",
      },
    }
  } catch {
    return {
      title: "Members - OpenForum",
      description: "Browse forum members and connect with the community.",
    }
  }
}

export interface MembersPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    sort?: string;
  }>;
}

export default async function MembersPage({
  searchParams,
}: MembersPageProps) {
  const params = await searchParams; // Await the searchParams Promise

  const page = Number.parseInt(params.page || "1", 10);
  const search = params.search || "";
  const sort = params.sort || "newest";

  // Get the current user session
  let session = null;
  try {
    session = await auth.api.getSession({
      headers: await headers(),
    });
  } catch (err) {
    console.error("Error fetching session:", err);
  }

  // Fetch members with pagination
  const { members, pagination, success, error } = await getForumMembers({
    page,
    search,
    sort,
    limit: 20,
  });

  if (!success) {
    throw new Error(error || "Failed to fetch members");
  }

  return (
    <Suspense
      fallback={
        <main className="flex min-h-[100dvh] flex-col items-center justify-center p-4">
          <Loader2 className="animate-spin text-muted-foreground" />
        </main>
      }
    >
      <MembersView
        session={session}
        members={members}
        pagination={pagination}
        currentSearch={search}
        currentSort={sort}
      />
    </Suspense>
  );
}