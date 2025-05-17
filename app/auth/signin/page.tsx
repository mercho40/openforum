"use client"
import { BackButton } from "@/components/BackButton"
import { LoginForm } from "@/components/LoginForm"
import { useSession } from "@/lib/auth-client"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function Page() {
  const { data: session, error } = useSession()
  const router = useRouter()

  // Move navigation to useEffect
  useEffect(() => {
    if (session) {
      router.push("/auth/callback")
    }
  }, [session, router])

  // Handle error
  if (error) {
    console.error("Error fetching session:", error)
    router.push("/auth/signin")
    return null
  }

  // Check if the session is loading
  if (session === undefined) {
    return (
      <main className="flex min-h-[100dvh] flex-col items-center justify-center p-4">
        <Loader2 className="animate-spin text-muted-foreground" />
      </main>
    )
  }
  
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        <BackButton />
        <LoginForm />
      </div>
    </main>
  )
}
