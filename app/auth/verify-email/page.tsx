"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/auth-client"
import { Loader2 } from "lucide-react"
import { BackButton } from "@/components/BackButton"
import { VerifyEmail } from "@/components/VerifyEmail"
import React from "react"

function VerifyEmailContent() {
  const router = useRouter()
  const { data: session, error } = useSession()
  const [isLoading, setIsLoading] = useState(true)
  const [email, setEmail] = useState("")

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (session === undefined) {
        setIsLoading(true)
      } else {
        setIsLoading(false)
      }
    }, 3000)
    
    return () => clearTimeout(timeout)
  }, [session])

  useEffect(() => {
    if (!isLoading) {
      if (!session && !error) {
        router.push("/auth/signin")
      }
    }
  }, [session, error, router, isLoading])

  // Check if the email is verified
  useEffect(() => {
    const checkEmailVerification = () => {
      if (session) {
        setEmail(session.user.email)
        
        if (session.user.emailVerified) {
          router.push("/auth/callback")
        }
      }
    }
    
    checkEmailVerification()
  }, [session, router])

  // Handle error
  if (error) {
    console.error("Error fetching session:", error)
    router.push("/auth/verify-email")
    setIsLoading(false)
    return null
  }

  const handleVerificationComplete = () => {
    router.push("/auth/callback")
  }

  return (
    <>
      {session === undefined || isLoading || session?.user.emailVerified ? (
          <Loader2 className="animate-spin text-muted-foreground" />
      ) : (
        <>
          <BackButton />
          <VerifyEmail
            email={email}
            onVerificationComplete={handleVerificationComplete}
          />
        </>
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