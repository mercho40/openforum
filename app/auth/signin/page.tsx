import { auth } from "@/lib/auth"
import { SignInView } from "@/components/views/auth/SignInView"
import { headers } from "next/headers";
import { Suspense } from 'react'
import { Loader2 } from "lucide-react"

// Enable ISR for auth pages with longer revalidation
export const revalidate = 3600 // Revalidate every hour
export const dynamic = "force-dynamic" // Keep dynamic for session handling

// Generate static metadata
export async function generateMetadata() {
  return {
    title: "Sign In - OpenForum",
    description: "Sign in to your OpenForum account to join discussions and connect with the community.",
    openGraph: {
      title: "Sign In - OpenForum",
      description: "Sign in to your OpenForum account to join discussions and connect with the community.",
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

  // Pass session data to the client component
  return (
    <Suspense fallback={<Loader2 className="animate-spin text-muted-foreground" />}>
      <SignInView session={session} isLoading={false} error={error} />;
    </Suspense>
  )
}
