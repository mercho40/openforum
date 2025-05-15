"use client"

import { useEffect, useState, Suspense } from "react"
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
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsLoading(false)
    }, 3000)
    
    return () => clearTimeout(timeout)
  }, [])

  useEffect(() => {
    if (session !== undefined) {
      if (error) {
        console.error("Error fetching session:", error)
      }
      
      if (!session && !isLoading) {
        router.push("/auth/signin")
      }
    }
  }, [session, error, router, isLoading])

  return (
    <>
      <BackButton />
      {session === undefined || isLoading ? (
        <div className="flex justify-center mt-8">
          <Loader2 className="animate-spin text-muted-foreground h-8 w-8" />
        </div>
      ) : (
        <CompleteProfileForm />
      )}
    </>
  )
}