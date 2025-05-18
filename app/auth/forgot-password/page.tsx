"use client"

import { Suspense } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { BackButton } from "@/components/BackButton"
import React from "react"
import { ForgotPassword } from "@/components/ForgotPassword"

function ForgotPasswordContent() {
  const router = useRouter()

  const handleForgotComplete = () => {
    // Redirect to sign in page after password reset
    router.push("/auth/signin")
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
      <Suspense fallback={<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}>
        <ForgotPasswordContent />
      </Suspense>
    </main>
  )
}
