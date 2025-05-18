"use client"

import { Suspense } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { BackButton } from "@/components/BackButton"
import React from "react"
import { ForgotPassword } from "@/components/ForgotPassword"
import { authClient } from "@/lib/auth-client"

function ForgotPasswordContent() {
  const router = useRouter()

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

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center p-4 w-full">
      <Suspense fallback={<Loader2 className="animate-spin text-muted-foreground" />}>
        <ForgotPasswordContent />
      </Suspense>
    </main>
  )
}
