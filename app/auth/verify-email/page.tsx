"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/auth-client"
import { Loader2 } from "lucide-react"
import { BackButton } from "@/components/BackButton"
import { VerifyEmail } from "@/components/VerifyEmail"
import { useSearchParams } from "next/navigation"

// Import useSearchParams only within the component that uses it
function VerifyEmailContent() {
  // Import useSearchParams here
  const searchParams = useSearchParams()
  const router = useRouter()
  const { data: session, error } = useSession()
  const [email, setEmail] = useState("")
  
  // Get the nextStep
  const nextStep = searchParams.get("next")

  useEffect(() => {
    if (session !== undefined) {
      if (error) {
        console.error("Error fetching session:", error)
      }
      
      if (!session) {
        router.push("/auth/signin")
      } else if (session.user?.email) {
        // Set the email from the session
        setEmail(session.user.email)
      }
    }
  }, [session, error, router])

  const handleVerificationComplete = () => {
    if (nextStep === "complete-profile") {
      router.push("/auth/complete-profile")
    } else {
      router.push("/")
    }
  }

  return (
    <>
      <BackButton />
      {session === undefined ? (
        <Loader2 className="animate-spin text-muted-foreground h-8 w-8" />
      ) : (
        <VerifyEmail 
          email={email} 
          onVerificationComplete={handleVerificationComplete}
        />
      )}
    </>
  )
}

export default function VerifyEmailPage() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        <Suspense fallback={<Loader2 className="animate-spin text-muted-foreground h-8 w-8" />}>
          <VerifyEmailContent />
        </Suspense>
      </div>
    </main>
  )
}