"use client"
import { BackButton } from "@/components/BackButton"
import { CompleteProfileForm } from "@/components/CompleteProfileForm"
import { RegisterForm } from "@/components/RegisterForm"
import { VerifyEmail } from "@/components/VerifyEmail"
import { useSession } from "@/lib/auth-client"
import { Loader2 } from "lucide-react"
import { redirect, useSearchParams } from "next/navigation"
import React, { Suspense } from "react"

function SignupContent() {
  const searchParams = useSearchParams()

  const showCompleteProfile = searchParams.get("complete-profile") !== null
  const showVerifyEmail = searchParams.get("verify-email") !== null

  let content
  if (showCompleteProfile) {
    content = <CompleteProfileForm />
  } else if (showVerifyEmail) {
    content = <VerifyEmail email={"example@domain.com"} />
  } else {
    content = <RegisterForm />
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <BackButton />
      {content}
    </div>
  )
}

export default function Page() {
  const { data: session, error } = useSession()

  // Handle error
  if (error) {
    console.error("Error fetching session:", error)
  }

  // Check if the session is loading
  if (session === undefined) {
    return (
      <main className="flex min-h-[100dvh] flex-col items-center justify-center p-4">
        <Loader2 className="animate-spin text-muted-foreground" />
      </main>
    )
  }

  if (session) {
    redirect("/")
  }

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center p-4">
      <Suspense fallback={<Loader2 className="animate-spin text-muted-foreground" />}>
        <SignupContent />
      </Suspense>
    </main>
  )
}