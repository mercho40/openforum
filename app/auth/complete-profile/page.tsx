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
        redirect("/auth/signin");
    } finally {
        // Handle redirects based on user data

        // If no session or user ID, redirect to sign in
        if (!session?.user?.id) {
            redirect("/auth/signin");
        }

        // If user is not verified, redirect to verify email
        if (!session.user.emailVerified) {
            redirect("/auth/verify-email");
        }

        // If user has completed profile setup, redirect to forum
        const metadata = session.user.metadata ? JSON.parse(session.user.metadata as string) : {};
        const hasSeenSetup = Boolean(metadata.profileSetupSeen);
        if (hasSeenSetup) {
            redirect("/auth/complete-profile");
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