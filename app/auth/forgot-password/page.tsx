import { ForgotPasswordView } from "@/components/views/auth/ForgotPasswordView"
import { Suspense } from "react"
import { Loader2 } from "lucide-react"

// Enable static generation for forgot password page
export const revalidate = 3600 // Revalidate every hour
export const dynamic = 'force-static' // Can be static since no session dependency

// Generate static metadata
export async function generateMetadata() {
  return {
    title: "Forgot Password - OpenForum",
    description: "Reset your OpenForum account password to regain access to your account.",
    openGraph: {
      title: "Forgot Password - OpenForum",
      description: "Reset your OpenForum account password to regain access to your account.",
      type: "website",
    },
    robots: {
      index: false, // Don't index auth pages
      follow: false,
    },
  }
}

export default async function Page() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center p-4 w-full">
      <Suspense fallback={<Loader2 className="animate-spin text-muted-foreground" />}>
        <ForgotPasswordView />
      </Suspense>
    </main>
  );
}