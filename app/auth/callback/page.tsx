"use client"

import { useEffect, Suspense } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useSession } from "@/lib/auth-client"
import { useSearchParams } from "next/navigation"

// Component with searchParams hook that needs to be wrapped in Suspense
function CallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, error } = useSession()

  useEffect(() => {
    // Handle authentication callback processing
    if (session !== undefined) {
      const processCallback = async () => {
        try {
          // If there's an error in the session, show it
          if (error) {
            console.error("Authentication error:", error)
            return
          }

          // Authentication successful
          if (session) {
            // Check if the session is new (just created)
            const isNewUser = searchParams.get("new") === "true"
            const needsEmailVerification = true // This would be determined by your auth logic
            const hasCompletedProfile = false // This would be stored in the user's profile

            if (needsEmailVerification) {
              // Redirect to email verification with appropriate next steps
              const nextStep = isNewUser && !hasCompletedProfile ? "complete-profile" : ""
              router.push(`/auth/verify-email?next=${nextStep}`)
            } else if (isNewUser && !hasCompletedProfile) {
              // If email is already verified but profile is incomplete
              router.push("/auth/complete-profile")
            } else {
              // Everything is complete, go to home
              router.push("/")
            }
          } else {
            // No session, redirect to sign in
            router.push("/auth/signin")
          }
        } catch (err) {
          console.error("Error processing authentication:", err)
        }
      }

      processCallback()
    }
  }, [session, error, router, searchParams])

  return (
    <div className="text-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
      <h2 className="text-xl font-semibold mb-2">Processing your authentication</h2>
      <p className="text-muted-foreground">Please wait while we complete your request...</p>
    </div>
  )
}

// Main page component with Suspense boundary
export default function CallbackPage() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center p-4">
      <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-primary" />}>
        <CallbackContent />
      </Suspense>
    </main>
  )
}