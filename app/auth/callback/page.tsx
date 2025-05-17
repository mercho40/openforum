"use client"

import { useState, useEffect } from "react";
import { checkProfileCompletion } from "@/actions/user";
import { authClient } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function CallbackPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function verifySession() {
            try {
                // Obtener la sesión
                const result = await authClient.getSession();
                const { data: session, error } = result;

                if (error) {
                    console.error("Error fetching session:", error);
                    router.push("/auth/signin");
                    return;
                }

                if (!session) {
                    router.push("/auth/signin");
                    return;
                }

                const emailVerified = session?.user?.emailVerified;

                // Verificar si el perfil está completo
                const hasCompletedProfile = await checkProfileCompletion();

                if (!emailVerified) {
                    router.push("/auth/verify-email");
                    return;
                }

                if (!hasCompletedProfile.hasSeenSetup) {
                    router.push("/auth/complete-profile");
                    return;
                }

                router.push("/");
            } catch (err) {
                console.error("Error checking profile:", err);
                setError("Ocurrió un error al verificar tu sesión");
            }
        }

        verifySession();
    }, [router]);

    if (error) {
        toast.error(error);
        return router.push("/auth/signin");
    }

    return (
        <main className="flex min-h-[100dvh] flex-col items-center justify-center p-4">
            <Loader2 className="animate-spin text-muted-foreground" />
        </main>
    );
}