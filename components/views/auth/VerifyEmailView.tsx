"use client"

import { BackButton } from "@/components/BackButton"
import { VerifyEmail } from "@/components/VerifyEmail"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Session } from "@/lib/auth"

interface VerifyEmailViewProps {
  session: Session | null;
  isLoading: boolean;
  error?: Error | null;
}

export function VerifyEmailView({ session, isLoading: initialLoading, error }: VerifyEmailViewProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(initialLoading)
  const [email, setEmail] = useState("")

  useEffect(() => {
    if (session) {
      setEmail(session.user.email)
      
      if (session.user.emailVerified) {
        router.push("/auth/callback")
      }
    } else if (!session && !error) {
      router.push("/auth/signin")
    }
    
    setIsLoading(false)
  }, [session, error, router])

  const handleVerificationComplete = () => {
    router.push("/auth/callback")
  }

  if (error) {
    console.error("Error with session:", error)
    return null
  }

  return (
    <>
      {session === undefined || isLoading || session?.user.emailVerified ? (
        <Loader2 className="animate-spin text-muted-foreground" />
      ) : (
        <>
          <BackButton />
          <VerifyEmail
            email={email}
            onVerificationComplete={handleVerificationComplete}
          />
        </>
      )}
    </>
  )
}