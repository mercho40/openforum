"use server";
import { Suspense } from "react"
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { BackButton } from "@/components/new/BackButton";
import LoadingSpinner from "@/components/new/LoadingSpinner";
import { ForgotPasswordForm } from "@/components/new/auth/ForgotPasswordForm";

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
        if (session?.user?.email) {

        }
    }

    const handleForgotComplete = async () => {
        try {
            await authClient.revokeSessions({
            fetchOptions: {
                onSuccess: () => {
                    redirect("/auth/signin")
                },
                onError: (error) => {
                    console.error("Error revoking sessions:", error)
                    redirect("/auth/signin")
                },
            },
            })
        } catch (err) {
            console.error("Error during forgot password completion:", err);
            redirect("/auth/signin");
        } finally {
            // Any additional cleanup if needed
        }
    }

    return (
        <main className="flex min-h-[100dvh] flex-col items-center justify-center p-4 w-full">
            <BackButton />
            <Suspense fallback={<LoadingSpinner />}>
                <ForgotPasswordForm email={session?.user?.email} onForgotComplete={handleForgotComplete}/>
            </Suspense>
        </main>
    );
}