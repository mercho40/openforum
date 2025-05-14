"use client"
import { BackButton } from "@/components/BackButton"
import { LoginForm } from "@/components/LoginForm"
import { useSession } from "@/lib/auth-client"
import { Loader2 } from "lucide-react"
import { redirect } from "next/navigation"

export default function Page() {
  const { data: session, error } = useSession()
  // Check if the session is loading
  if (session === undefined) {
    return (
      <main className="flex min-h-[100dvh] flex-col items-center justify-center p-4">
        <Loader2 className="animate-spin text-muted-foreground" />
      </main>
    )
  }

  if (error) {
    console.error("Error fetching session:", error)
  }

  if (session) {
    redirect("/")
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
    