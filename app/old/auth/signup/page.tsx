export const dynamic = "force-dynamic";
import { auth } from "@/lib/auth"
import { SignUpView } from "@/components/(olds)/views/auth/SignUpView"
import { headers } from "next/headers"
import { Suspense } from 'react'
import { Loader2 } from "lucide-react"

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
  // Pass session data to the client component
  return (
    <Suspense fallback={<Loader2 className="animate-spin text-muted-foreground" />}>
      <main className="flex min-h-[100dvh] flex-col items-center justify-center p-4">
        <SignUpView session={session} isLoading={false} error={error} />
      </main>
    </Suspense>
  )
}
