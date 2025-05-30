export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function ProfilePage() {
  // Get the current user session
  let session = null;

  try {
    session = await auth.api.getSession({
      headers: await headers(),
    });
  } catch (err) {
    console.error("Error fetching session:", err);
  }

  // Redirect unauthenticated users to sign in
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  // Redirect to the user's profile
  redirect(`/forum/profile/${session.user.id}`);
}