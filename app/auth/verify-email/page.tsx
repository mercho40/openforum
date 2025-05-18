import { auth } from "@/lib/auth"
import { VerifyEmailView } from "@/components/views/auth/VerifyEmailView"
import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import { headers } from "next/headers";

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
        <VerifyEmailView session={session} isLoading={false} error={error} />
      </Suspense>
    </main>
  )
}