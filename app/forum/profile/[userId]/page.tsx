import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Loader2 } from "lucide-react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getUserProfile, getForumMembers } from "@/actions/user";
import { UserProfileView } from "@/components/views/forum/UserProfileView";
import { unstable_cache } from 'next/cache';

// Enable ISR for user profile pages
export const revalidate = 600 // Revalidate every 10 minutes
export const dynamic = 'force-dynamic' // Keep dynamic for user sessions

// Generate static params for active users
export async function generateStaticParams() {
  try {
    const result = await getForumMembers({
      page: 1,
      search: "",
      sort: "newest",
      limit: 100, // Generate for top 100 active users
    })
    
    if (!result.success || !result.members) return []
    
    return result.members.map((member) => ({
      userId: member.id,
    }))
  } catch {
    return []
  }
}

// Cache user profile data
const getCachedUserProfile = unstable_cache(
  async (userId: string) => {
    return await getUserProfile(userId)
  },
  ['user-profile'],
  {
    tags: ['user-profile'],
    revalidate: 600, // Cache for 10 minutes
  }
)

// Generate static metadata
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ userId: string }> 
}) {
  try {
    const { userId } = await params
    const { userData, success } = await getCachedUserProfile(userId)
    
    if (!success || !userData) {
      return {
        title: "User Profile Not Found - OpenForum",
        description: "The requested user profile could not be found.",
      }
    }

    return {
      title: `${userData.name} - Profile | OpenForum`,
      description: `View ${userData.name}'s profile, threads, and activity on OpenForum.`,
      openGraph: {
        title: `${userData.name} - Profile | OpenForum`,
        description: `View ${userData.name}'s profile, threads, and activity on OpenForum.`,
        type: "profile",
        images: userData.image ? [{ url: userData.image }] : [],
      },
      twitter: {
        card: 'summary',
        title: `${userData.name} - Profile | OpenForum`,
        description: `View ${userData.name}'s profile, threads, and activity on OpenForum.`,
        images: userData.image ? [userData.image] : [],
      },
    }
  } catch {
    return {
      title: "User Profile - OpenForum",
      description: "View user profile and activity.",
    }
  }
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  // Get the userId parameter
  const { userId } = await params;

  // Get the current user session
  let session = null;
  try {
    session = await auth.api.getSession({
      headers: await headers(),
    });
  } catch (err) {
    console.error("Error fetching session:", err);
  }

  // Use cached user profile data
  const { userData, success } = await getCachedUserProfile(userId);

  if (!success || !userData) {
    notFound();
  }

  return (
    <Suspense
      fallback={
        <main className="flex min-h-[100dvh] flex-col items-center justify-center p-4">
          <Loader2 className="animate-spin text-muted-foreground" />
        </main>
      }
    >
      <UserProfileView session={session} userData={userData} />
    </Suspense>
  );
}