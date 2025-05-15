"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useSession } from "@/lib/auth-client"
import { useSearchParams } from "next/navigation"

// Component with searchParams hook that needs to be wrapped in Suspense
function CallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, error } = useSession()
  const [loading, setLoading] = useState(true)

  // Add debug logging to diagnose session issues
  useEffect(() => {
    console.log("Callback session state:", {
      session: session === undefined ? "loading" : (session ? "authenticated" : "not authenticated"),
      error: error || "none"
    });
    
    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000);
    
    return () => clearTimeout(timeout);
  }, [session, error]);

  useEffect(() => {
    // Don't try to process until we know the session status
    if (session !== undefined || !loading) {
      const processCallback = async () => {
        try {
          // If there's an error in the session, show it
          if (error) {
            console.error("Authentication error:", error)
            router.push("/auth/signin?error=auth_error")
            return
          }

          // Authentication successful
          if (session) {
            // Check if the session is new (just created)
            const isNewUser = searchParams.get("new") === "true"
            const providerParam = searchParams.get("provider") || ""
            const isSocialProvider = ["github", "google"].includes(providerParam)
            
            console.log("Auth callback:", { 
              isNewUser, 
              provider: providerParam, 
              isSocialProvider 
            })

            if (isNewUser) {
              // New user registration flow
              if (isSocialProvider) {
                // Social registration: skip verification, go directly to complete profile
                router.push("/auth/complete-profile")
              } else {
                // Email registration: verify email first, then complete profile
                router.push(`/auth/verify-email?next=complete-profile`)
              }
            } else {
              // Login flow
              if (isSocialProvider) {
                // Social login: go directly to homepage
                router.push("/")
              } else {
                // Email login: verify email first  
                router.push("/auth/verify-email")
              }
            }
          } else {
            // No session, redirect to sign in
            router.push("/auth/signin?error=no_session")
          }
        } catch (err) {
          console.error("Error processing authentication:", err)
          router.push("/auth/signin?error=process_error")
        }
      }

      processCallback()
    }
  }, [session, error, router, searchParams, loading])

  return (
    <div className="text-center">
      <Loader2 className="animate-spin text-muted-foreground" />
      <h2 className="text-xl font-semibold mb-2">Processing your authentication</h2>
      <p className="text-muted-foreground">Please wait while we complete your request...</p>
    </div>
  )
}

// Main page component with Suspense boundary
export default function CallbackPage() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center p-4">
      <Suspense fallback={<Loader2 className="animate-spin text-muted-foreground" />}>
        <CallbackContent />
      </Suspense>
    </main>
  )
}