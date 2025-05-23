"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { BackButton } from "@/components/BackButton"
import { CompleteProfileForm } from "@/components/auth/CompleteProfileForm"
import { Session } from "@/lib/auth"

interface CompleteProfileViewProps {
  session: Session | null;
  isLoading: boolean;
  error?: Error | null;
}

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

export function CompleteProfileView({ session, isLoading, error }: CompleteProfileViewProps) {
  const router = useRouter()

  useEffect(() => {
    // Redirect to sign in if not authenticated and not loading
    if (!isLoading && !session) {
      router.push("/auth/signin")
    }
  }, [session, isLoading, router])

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

    if (!isLoading && session) {
      checkProfile()
    }
  }, [session, router, isLoading])

  if (error) {
    console.error("Error fetching session:", error)
    router.push("/auth/signin")
    return null
  }

  if (isLoading || !session) {
    return (
      <div className="flex items-center justify-center">
        <Loader2 className="animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <>
      <BackButton />
      <CompleteProfileForm session={session} />
    </>
  )
}