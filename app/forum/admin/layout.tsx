import type { ReactNode } from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { LayoutDashboard, FolderTree, MessageSquare, Users, Flag, Settings, Shield } from 'lucide-react'
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

interface AdminLayoutProps {
  children: ReactNode
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  // Verify admin access on the server side as well
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session || session.user.role !== "admin") {
    redirect("/forum")
  }

  const navItems = [
    { href: "/forum/admin", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    { href: "/forum/admin/categories", label: "Categories", icon: <FolderTree className="h-4 w-4" /> },
    { href: "/forum/admin/threads", label: "Threads", icon: <MessageSquare className="h-4 w-4" /> },
    { href: "/forum/admin/users", label: "Users", icon: <Users className="h-4 w-4" /> },
    { href: "/forum/admin/reports", label: "Reports", icon: <Flag className="h-4 w-4" /> },
    { href: "/forum/admin/settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
  ]

  return (
    <div className="flex h-[100dvh] bg-background w-full">
      {/* Sidebar */}
      <aside className="hidden w-64 border-r bg-card/50 md:block">
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/forum/admin" className="flex items-center gap-2 font-semibold">
            <Shield className="h-5 w-5 text-primary" />
            <span>Admin Panel</span>
          </Link>
        </div>
        <nav className="p-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
                >
                  {item.icon}
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        <div className="flex h-16 items-center gap-4 border-b bg-card/50 px-6 md:hidden">
          <Link href="/forum/admin" className="flex items-center gap-2 font-semibold">
            <Shield className="h-5 w-5 text-primary" />
            <span>Admin Panel</span>
          </Link>
        </div>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
