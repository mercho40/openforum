import { auth } from "@/lib/auth"
import { headers } from "next/headers";
import { Suspense } from 'react'
// import { SignInView } from "@/components/(olds)/views/auth/SignInView"
import LoadingSpinner from "@/components/new/LoadingSpinner";
import { redirect } from "next/navigation";
import { BackButton } from "@/components/new/BackButton";
import { SignInForm } from "@/components/new/auth/SignInForm";

export default async function Page() {
  // Get session data on the server
  let session = null;
  let error = null;

  try {
    session = await auth.api.getSession({
      headers: await headers()
    })
  } catch (err) {
    error = err as Error;
    console.error("Error fetching session:", error);
  } finally {
        // If session is found, redirect to callback
        if (session?.user?.id) {
            redirect("/auth/callback");
        }
    }

  // Pass session data to the client component
  return (
    <main className="flex min-h-[100dvh] w-full flex-col items-center justify-center p-4">
      <BackButton />
      <Suspense fallback={<LoadingSpinner />}>
        <SignInForm />
      </Suspense>
    </main>
  )
}
