"use client"

import { useEffect, Suspense } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/auth-client"
import { Loader2 } from "lucide-react"
import { BackButton } from "@/components/BackButton"
import { CompleteProfileForm } from "@/components/CompleteProfileForm"

export default function CompleteProfilePage() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center p-4">
        <Suspense fallback={<Loader2 className="animate-spin text-muted-foreground h-8 w-8" />}>
          <CompleteProfileContent />
        </Suspense>
    </main>
  )
}

function CompleteProfileContent() {
  const router = useRouter()
  const { data: session, error } = useSession()

  useEffect(() => {
    if (session !== undefined) {
      if (error) {
        console.error("Error fetching session:", error)
      }
      
      if (!session) {
        router.push("/auth/signin")
      }
      
      // In a real app, check if profile is already completed
      // const profileCompleted = session.user?.hasCompletedProfile
      // if (profileCompleted) {
      //   router.push("/")
      // }
    }
  }, [session, error, router])

  return (
    <>
      <BackButton />
      {session === undefined ? (
        <div className="flex justify-center mt-8">
          <Loader2 className="animate-spin text-muted-foreground h-8 w-8" />
        </div>
      ) : (
        <CompleteProfileForm />
      )}
    </>
  )
}