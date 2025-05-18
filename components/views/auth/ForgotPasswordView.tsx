"use client"

import { useRouter } from "next/navigation"
import { BackButton } from "@/components/BackButton"
import { ForgotPassword } from "@/components/ForgotPassword"
import { authClient } from "@/lib/auth-client"
import { Session } from "@/lib/auth"
import { useEffect } from "react"

interface ForgotPasswordViewProps {
  session: Session | null;
  isLoading: boolean;
  error?: Error | null;
}

export function ForgotPasswordView({ session, error }: ForgotPasswordViewProps) {
  const router = useRouter()

  useEffect(() => {
    if (session) {
      router.push("/")
    }
  }, [session, router])

  if (error) {
    console.error("Error fetching session:", error)
    return null
  }

  const handleForgotComplete = async () => {
    await authClient.revokeSessions({
      fetchOptions: {
        onSuccess: () => {
          router.push("/auth/signin")
        },
        onError: (error) => {
          console.error("Error revoking sessions:", error)
          router.push("/auth/signin")
        },
      },
    })
  }

  return (
    <>
      <BackButton />
      <ForgotPassword onForgotComplete={handleForgotComplete} />
    </>
  )
}