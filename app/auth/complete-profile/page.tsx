"use client"

import { useEffect, Suspense } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/auth-client"
import { Loader2 } from "lucide-react"
import { BackButton } from "@/components/BackButton"
import { CompleteProfileForm } from "@/components/CompleteProfileForm"
import { Session } from "@/lib/auth"
import React from "react"

const checkProfileCompletion = (session: Session) => {
  // Safely parse metadata with optional chaining and nullish coalescing
  const metadata = session.user?.metadata
    ? JSON.parse(session.user.metadata as string)
    : {}

  return {
    success: true,
    isComplete: Boolean(session.user?.bio && session.user?.image),
    hasSeenSetup: Boolean(metadata.profileSetupSeen)
  }
}

function CompleteProfileContent() {
  const router = useRouter()
  // Update to use isPending instead of status
  const { data: session, isPending } = useSession() as {
    data: Session | null,
    isPending: boolean
  }

  useEffect(() => {
    // Redirect to sign in if not authenticated and not loading
    if (!isPending && !session) {
      router.push("/auth/signin")
    }
  }, [session, isPending, router])

  // Check if user already has a complete profile
  useEffect(() => {
    const checkProfile = async () => {
      if (session) {
        const result = checkProfileCompletion(session)
        // If profile setup is seen, redirect to home
        if (result.success && result.hasSeenSetup) {
          router.push("/")
        }
      }
    }

    if (!isPending && session) {
      checkProfile()
    }
  }, [session, router, isPending])

  if (isPending) {
    return <Loader2 className="animate-spin text-muted-foreground" />
  }

  return (
    <>
      {session === undefined || isPending || (session && checkProfileCompletion(session).hasSeenSetup) ? (
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
