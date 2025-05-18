"use client"

import { BackButton } from "@/components/BackButton"
import { LoginForm } from "@/components/LoginForm"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Session } from "@/lib/auth"

interface SignInViewProps {
  session: Session | null;
  isLoading: boolean;
  error?: Error | null;
}

export function SignInView({ session, isLoading, error }: SignInViewProps) {
  const router = useRouter()

  useEffect(() => {
    if (session) {
      router.push("/auth/callback")
    }
  }, [session, router])

  if (error) {
    console.error("Error with session:", error)
    return null
  }

  if (isLoading || session) {
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