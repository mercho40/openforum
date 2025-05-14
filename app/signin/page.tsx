import { BackButton } from "@/components/BackButton"
import { LoginForm } from "@/components/LoginForm"

export default function Home() {

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        <BackButton />
        <LoginForm />
      </div>
    </main>
  )
}
    