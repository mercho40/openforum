"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/auth-client"
// import { authClient } from "@/lib/auth-client"
import { Loader2 } from "lucide-react"
import { BackButton } from "@/components/BackButton"
import { VerifyEmail } from "@/components/VerifyEmail"
// import { useSearchParams } from "next/navigation"

// const { data: session } = await authClient.getSession()
export default function VerifyEmailContent() {
  // const searchParams = useSearchParams()
  const { data: session } = useSession()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // const nextStep = searchParams.get("next")

  // Use the email from URL params if available (for fresh registrations)
  // useEffect(() => {
  //   const emailParam = searchParams.get("email")
  //   if (emailParam) {
  //     setEmail(emailParam)
  //     setIsLoading(false)
  //   }
  // }, [searchParams])

  // Handle session changes and redirects
  useEffect(() => {
    if (session === undefined) {
      setIsLoading(true)
    }


    if (session?.user?.emailVerified) {
      // router.push(nextStep === "complete-profile" ? "/auth/complete-profile" : "/")
      router.push("/auth/complete-profile")
      return
    }

    if (session) {
      setEmail(session.user.email)
      setIsLoading(false)
    }
  }, [session, router])


  // Reset loading after a timeout (fallback)
  useEffect(() => {
    const timeout = setTimeout(() => {
      router.push("/auth/signin")
    }, 3000)
    return () => clearTimeout(timeout)
  }, [isLoading, router])

  const handleVerificationComplete = () => {
    // if (nextStep === "complete-profile") {
    //   router.push("/auth/complete-profile")
    // } else {
    router.push("/auth/complete-profile")
    // }
  }

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center p-4">
      <BackButton />
      {isLoading && !email ? (
        <Loader2 className="animate-spin text-muted-foreground" />
      ) : (
        <VerifyEmail
          email={email}
          onVerificationComplete={handleVerificationComplete}
        />
      )}
    </main>
  )
}

// export default function VerifyEmailPage() {
//   return (
//     <main className="flex min-h-[100dvh] flex-col items-center justify-center p-4">
//       <Suspense fallback={<Loader2 className="animate-spin text-muted-foreground" />}>
//         <VerifyEmailContent />
//       </Suspense>
//     </main>
//   )
// }
