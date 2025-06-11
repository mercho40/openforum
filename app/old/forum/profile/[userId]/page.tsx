export const dynamic = "force-dynamic";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Loader2 } from "lucide-react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getUserProfile } from "@/actions/user";
import { UserProfileView } from "@/components/(olds)/views/forum/UserProfileView";

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

  // Fetch user profile data
  const { userData, success } = await getUserProfile(userId);

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