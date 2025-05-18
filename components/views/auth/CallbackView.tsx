"use client"

import { useState, useEffect } from "react";
import { checkProfileCompletion } from "@/actions/user";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Session } from "@/lib/auth";

interface CallbackViewProps {
  session: Session | null;
  isLoading: boolean;
  error?: Error | null;
}

export function CallbackView({ session, isLoading, error: initialError }: CallbackViewProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(initialError ? initialError.message : null);

  useEffect(() => {
    async function verifySession() {
      try {
        if (!session) {
          router.push("/auth/signin");
          return;
        }

        const emailVerified = session?.user?.emailVerified;

        // Verify if profile is complete
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

    if (!isLoading) {
      verifySession();
    }
  }, [router, session, isLoading]);

  if (error) {
    toast.error(error);
    router.push("/auth/signin");
    return null;
  }

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center p-4">
      <Loader2 className="animate-spin text-muted-foreground" />
    </main>
  );
}