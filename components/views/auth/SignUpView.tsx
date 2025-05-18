"use client"

import { BackButton } from "@/components/BackButton"
import { RegisterForm } from "@/components/RegisterForm"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Session } from "@/lib/auth"

interface SignUpViewProps {
  session: Session | null;
  isLoading: boolean;
  error?: Error | null;
}

export function SignUpView({ session, isLoading, error }: SignUpViewProps) {
  const router = useRouter()

  useEffect(() => {
    if (session) {
      router.push("/auth/callback")
    }
  }, [session, router])

  if (error) {
    console.error("Error fetching session:", error)
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
    <>
      <BackButton />
      <RegisterForm />
    </>
  )
}