export const dynamic = "force-dynamic";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getForumMembers } from "@/actions/user";
import { MembersView } from "@/components/(olds)/views/forum/MembersView";

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