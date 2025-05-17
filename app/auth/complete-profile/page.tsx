"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/auth-client"
import { Loader2 } from "lucide-react"
import { BackButton } from "@/components/BackButton"
import { CompleteProfileForm } from "@/components/CompleteProfileForm"
import { checkProfileCompletion } from "@/actions/user"
import React from "react"

function CompleteProfileContent() {
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

  useEffect(() => {
    if (!isLoading) {
      if (!session && !error) {
        router.push("/auth/signin")
      }
    }
  }, [session, error, router, isLoading])

  // Check if user already has a profile
  useEffect(() => {
    const checkProfile = async () => {
      if (session) {
        const result = await checkProfileCompletion()
        if (result.success && result.hasSeenSetup) {
          router.push("/")
        }
      }
    }
    
    checkProfile()
  }, [session, router])

  // Handle error
  if (error) {
    console.error("Error fetching session:", error)
    router.push("/auth/complete-profile")
    setIsLoading(false)
    return null
  }

  return (
    <>
      {session === undefined || isLoading ? (
          <Loader2 className="animate-spin text-muted-foreground" />
      ) : (
        <>
          <BackButton />
          <CompleteProfileForm />
        </>
      )}
    </>
  )
}

export default function CompleteProfilePage() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center p-4">
        <Suspense fallback={<Loader2 className="animate-spin text-muted-foreground" />}>
          <CompleteProfileContent />
        </Suspense>
    </main>
  )
}