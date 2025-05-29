import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import CacheAdminDashboard from "@/components/forum/admin/CacheAdminDashboard"

export const metadata = {
  title: "Cache Management | Admin",
  description: "Manage application cache settings and monitoring"
}

export default async function CacheAdminPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.user || session.user.role !== 'admin') {
    redirect('/auth/signin')
  }

  return <CacheAdminDashboard />
}
