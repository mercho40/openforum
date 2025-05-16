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
  const { data: session, error } = useSession()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  
  // Get the nextStep
  const nextStep = searchParams.get("next")

  // Check if session is available
  useEffect(() => {
    if (session) {
      setEmail(session.user.email)
      setIsLoading(false)
    } else {
      setIsLoading(true)
    }
  }, [session])

  // Check if session is loading
  if (session === undefined) {
    setIsLoading(true)
    return <Loader2 className="animate-spin text-muted-foreground" />
  }

  // Check if session is loading
  if (session === null) {
    router.push("/auth/signin")
  }

  if (session?.user.emailVerified) {
    // If the email is already verified, redirect to the home page
    router.push("/")
  }

  // Check if there is an error
  if (error) {
    console.error("Error fetching session:", error)
    return (
      <>
        <BackButton />
        <p className="text-red-500 text-center">Error fetching session. Please try again.</p>
      </>
    )
  }

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
      {session === undefined || isLoading ? (
        <Loader2 className="animate-spin text-muted-foreground" />
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
      <Suspense fallback={<Loader2 className="animate-spin text-muted-foreground" />}>
        <VerifyEmailContent />
      </Suspense>
    </main>
  )
}