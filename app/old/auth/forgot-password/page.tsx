import { ForgotPasswordView } from "@/components/(olds)/views/auth/ForgotPasswordView"
import { Suspense } from "react"
import { Loader2 } from "lucide-react"

export default async function Page() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center p-4 w-full">
      <Suspense fallback={<Loader2 className="animate-spin text-muted-foreground" />}>
        <ForgotPasswordView />
      </Suspense>
    </main>
  );
}