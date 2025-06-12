"use server";
import { auth } from "@/lib/auth"
import { Suspense } from "react"
import { headers } from "next/headers"
import { redirect } from "next/navigation";
import LoadingSpinner from "@/components/new/LoadingSpinner";
import { BackButton } from "@/components/new/BackButton";
import { CompleteProfileForm } from "@/components/new/auth/CompleteProfileForm";

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
        redirect("/auth/callback");
    } finally {
        // Handle redirects based on user data

        // If user has completed profile setup, redirect to forum
        const metadata = session?.user.metadata ? JSON.parse(session.user.metadata as string) : {};
        const hasSeenSetup = Boolean(metadata.profileSetupSeen);

        // If user there no user or user has not verified his email
        // or has completed profile setup, redirect to complete profile
        if (!session?.user?.id || !session.user.emailVerified || hasSeenSetup) {
            redirect("/auth/callback");
        }
    }

    return (
        <main className="flex min-h-[100dvh] w-full flex-col items-center justify-center p-4">
            <BackButton />
            <Suspense fallback={<LoadingSpinner />}>
                <CompleteProfileForm session={session} />
            </Suspense>
        </main>
    );
}