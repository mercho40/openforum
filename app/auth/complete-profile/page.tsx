import { auth } from "@/lib/auth"
import { CompleteProfileView } from "@/components/views/auth/CompleteProfileView"
import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import { headers } from "next/headers"

// Enable ISR for auth pages with longer revalidation
export const revalidate = 3600 // Revalidate every hour
export const dynamic = "force-dynamic" // Keep dynamic for session handling

// Generate static metadata
export async function generateMetadata() {
  return {
    title: "Complete Profile - OpenForum",
    description: "Complete your OpenForum profile setup to start participating in discussions.",
    openGraph: {
      title: "Complete Profile - OpenForum",
      description: "Complete your OpenForum profile setup to start participating in discussions.",
      type: "website",
    },
    robots: {
      index: false, // Don't index auth pages
      follow: false,
    },
  }
}

export default async function Page() {
  // Get session data on the server
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

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center p-4">
      <Suspense fallback={<Loader2 className="animate-spin text-muted-foreground" />}>
        <CompleteProfileView session={session} isLoading={false} error={error} />
      </Suspense>
    </main>
  );
}
