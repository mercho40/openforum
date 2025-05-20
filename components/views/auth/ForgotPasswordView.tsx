"use client"

import { useRouter } from "next/navigation"
import { BackButton } from "@/components/BackButton"
import { ForgotPassword } from "@/components/ForgotPassword"
import { authClient } from "@/lib/auth-client"

export function ForgotPasswordView() {
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