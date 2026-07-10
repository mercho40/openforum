import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { EnhancedUserSettingsView } from "@/components/views/forum/EnhancedUserSettingsView"

export default async function EnhancedSettingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect("/auth/signin")
  }

  return <EnhancedUserSettingsView user={session.user} />
}
