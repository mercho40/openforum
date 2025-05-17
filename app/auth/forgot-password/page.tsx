"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/auth-client"
import { Loader2 } from "lucide-react"
import { BackButton } from "@/components/BackButton"
import React from "react"
import { ForgotPassword } from "@/components/ForgotPassword"

function ForgotPasswordContent() {
  const router = useRouter()
  const { data: session, error } = useSession()
  const [isLoading, setIsLoading] = useState(true)

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

  // Handle error
  if (error) {
    console.error("Error fetching session:", error)
    router.push("/auth/verify-email")
    setIsLoading(false)
    return null
  }

  const handleForgotComplete = () => {
    router.push("/auth/callback")
  }

  return (
    <>
      {session === undefined || isLoading ? (
          <Loader2 className="animate-spin text-muted-foreground" />
      ) : (
        <>
          <BackButton />
          <ForgotPassword
            onForgotComplete={handleForgotComplete}
          />
        </>
      )}
    </>
  )
}

export default function VerifyEmailPage() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center p-4 w-full">
      <Suspense fallback={<Loader2 className="animate-spin text-muted-foreground" />}>
        <ForgotPasswordContent />
      </Suspense>
    </main>
  )
}