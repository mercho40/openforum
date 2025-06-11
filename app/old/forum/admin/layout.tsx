import type { ReactNode } from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { LayoutDashboard, FolderTree, MessageSquare, Users, Flag, Settings, Shield } from "lucide-react"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { MobileNav } from "@/components/(olds)/forum/admin/MobileNav"

interface AdminLayoutProps {
  children: ReactNode
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  // Verify admin access on the server side
  const session = await auth.api.getSession({
    headers: await headers(),
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
    <div className="flex min-h-[100dvh] bg-background w-full">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 border-r border-border/10 bg-card/30 backdrop-blur-sm">
        <div className="flex h-14 items-center border-b border-border/10 px-4">
          <Link href="/forum/admin" className="flex items-center gap-2 font-semibold">
            <Shield className="h-5 w-5 text-primary" />
            <span>Admin Panel</span>
          </Link>
        </div>
        <nav className="p-3">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-primary/10"
                >
                  {item.icon}
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Mobile header and content */}
      <div className="flex flex-1 flex-col">
        {/* Mobile Header */}
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border/10 bg-card/80 backdrop-blur-sm px-4 md:hidden">
          <Link href="/forum/admin" className="flex items-center gap-2 font-semibold">
            <Shield className="h-5 w-5 text-primary" />
            <span>Admin Panel</span>
          </Link>
          <MobileNav items={navItems} />
        </header>

        {/* Main content */}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
