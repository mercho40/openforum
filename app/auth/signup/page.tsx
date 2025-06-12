import { auth } from "@/lib/auth"
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from 'react'
import LoadingSpinner from "@/components/new/LoadingSpinner";
import { BackButton } from "@/components/new/BackButton";
import { SignUpForm } from "@/components/new/auth/SignUpForm";

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

    return (
        <main className="flex min-h-[100dvh] w-full flex-col items-center justify-center p-4">
            <BackButton />
            <Suspense fallback={<LoadingSpinner />}>
                <SignUpForm />
            </Suspense>
        </main>
    )
}
