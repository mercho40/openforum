"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  MessageSquare,
  PlusCircle,
  Search,
  Bell,
  User,
  LogOut,
  Settings,
  TrendingUp,
  Clock,
  Bookmark,
  Menu,
  X,
  Home,
  Users,
  Tag,
  HelpCircle,
  Shield,
  LogIn,
  UserPlus,
  FolderPlus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import type { Session } from "@/lib/auth"
import { formatDistanceToNow } from "date-fns"
import { authClient } from "@/lib/auth-client"
import ThreadCard from "@/components/ThreadCard"
import { CategoryIcon } from "@/components/forum/CategoryIcon"

interface Category {
  id: string
  name: string
  description: string | null
  slug: string
  iconClass: string | null
  color: string | null
  threadCount: number
  postCount: number
  lastThread: {
    id: string
    title: string
    slug: string
    createdAt: Date
    author: {
      id: string
      name: string | null
      image: string | null
    }
  } | null
}

interface Thread {
  id: string
  title: string
  slug: string
  createdAt?: Date
  viewCount: number
  replyCount: number
  isPinned?: boolean
  isLocked?: boolean
  categoryId: string
  categoryName: string
  categorySlug: string
  author?: {
    id: string
    name: string | null
    image: string | null
  }
}

interface ForumHomeViewProps {
  session: Session | null
  categories: Category[]
  recentThreads: Thread[]
  trendingThreads: Thread[]
}

export function ForumHomeView({ session, categories, recentThreads, trendingThreads }: ForumHomeViewProps) {
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const isAuthenticated = !!session
  const isAdmin = isAuthenticated && session.user.role === "admin"

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/forum/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/auth/signin");
        },
      },
    });
  }

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-card/50 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2 md:gap-4">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" aria-label="Menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] p-0">
                <div className="flex h-16 items-center border-b px-4">
                  <Link href="/" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                    <MessageSquare className="h-5 w-5 text-primary" />
                    <span className="font-bold">OpenForum</span>
                  </Link>
                  <SheetClose className="ml-auto">
                    <X className="h-5 w-5" />
                  </SheetClose>
                </div>
                <nav className="grid gap-1 p-4">
                  <Link
                    href="/forum"
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Home className="h-4 w-4" />
                    Home
                  </Link>
                  <Link
                    href="/forum/categories"
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Tag className="h-4 w-4" />
                    Categories
                  </Link>
                  <Link
                    href="/forum/members"
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Users className="h-4 w-4" />
                    Members
                  </Link>

                  {isAuthenticated && (
                    <Link
                      href="/forum/bookmarks"
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Bookmark className="h-4 w-4" />
                      Bookmarks
                    </Link>
                  )}

                  <DropdownMenuSeparator className="my-1" />

                  <Link
                    href="/forum/help"
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <HelpCircle className="h-4 w-4" />
                    Help & FAQ
                  </Link>

                  {isAdmin && (
                    <Link
                      href="/forum/admin"
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Shield className="h-4 w-4" />
                      Admin Panel
                    </Link>
                  )}

                  {!isAuthenticated && (
                    <>
                      <DropdownMenuSeparator className="my-1" />
                      <Link
                        href="/auth/signin"
                        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <LogIn className="h-4 w-4" />
                        Sign In
                      </Link>
                      <Link
                        href="/auth/signup"
                        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <UserPlus className="h-4 w-4" />
                        Sign Up
                      </Link>
                    </>
                  )}
                </nav>
              </SheetContent>
            </Sheet>

            <Link href="/" className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <span className="hidden font-bold sm:inline-block">OpenForum</span>
            </Link>

            <nav className="hidden md:flex md:gap-4 lg:gap-6">
              <Link href="/forum" className="text-sm font-medium text-foreground transition-colors hover:text-primary">
                Home
              </Link>
              <Link
                href="/forum/categories"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Categories
              </Link>
              <Link
                href="/forum/members"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Members
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <form onSubmit={handleSearch} className="hidden md:flex relative w-full max-w-[200px] lg:max-w-[300px]">
              <Input
                type="search"
                placeholder="Search..."
                className="pr-8 h-9 bg-card/30 backdrop-blur-sm border border-border/10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-9 w-9"
                aria-label="Search"
              >
                <Search className="h-4 w-4" />
              </Button>
            </form>

            <Button
              variant="ghost"
              size="icon"
              className="relative md:hidden"
              aria-label="Search"
              onClick={() => router.push("/forum/search")}
            >
              <Search className="h-5 w-5" />
            </Button>

            {isAuthenticated ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                  aria-label="Notifications"
                  onClick={() => router.push("/forum/notifications")}
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary"></span>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={session.user.image || ""} alt={session.user.name || "User"} />
                        <AvatarFallback>{session.user.name?.charAt(0) || "U"}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="flex items-center gap-2 p-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={session.user.image || ""} alt={session.user.name || "User"} />
                        <AvatarFallback>{session.user.name?.charAt(0) || "U"}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{session.user.name}</span>
                        <span className="text-xs text-muted-foreground">{session.user.email}</span>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={`/forum/profile/${session.user.id}`} className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/forum/settings" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
                  <Link href="/auth/signin">
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign In
                  </Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/auth/signup">
                    <UserPlus className="mr-2 h-4 w-4 sm:block hidden" />
                    Sign Up
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" asChild className="sm:hidden">
                  <Link href="/auth/signin">
                    <LogIn className="h-5 w-5" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container py-6 px-4">
        <div className="grid gap-6 md:grid-cols-[1fr_300px] lg:grid-cols-[1fr_350px]">
          {/* Main Column */}
          <div className="space-y-6">
            {/* Welcome Banner */}
            <div className="relative overflow-hidden rounded-lg border bg-card p-6">
              <div className="flex flex-col gap-2">
                {isAuthenticated ? (
                  <>
                    <h1 className="text-2xl font-bold tracking-tight">
                      Welcome back, {session.user.name?.split(" ")[0] || "User"}
                    </h1>
                    <p className="text-muted-foreground">
                      Join the conversation, share your knowledge, and connect with other developers.
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button asChild>
                        <Link href="/forum/threads/new">
                          <PlusCircle className="mr-2 h-4 w-4" />
                          New Thread
                        </Link>
                      </Button>
                      <Button variant="outline" asChild>
                        <Link href="/forum/categories">Browse Categories</Link>
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <h1 className="text-2xl font-bold tracking-tight">Welcome to OpenForum</h1>
                    <p className="text-muted-foreground">
                      Join our community to participate in discussions, share knowledge, and connect with other
                      developers.
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button asChild>
                        <Link href="/auth/signup">
                          <UserPlus className="mr-2 h-4 w-4" />
                          Create Account
                        </Link>
                      </Button>
                      <Button variant="outline" asChild>
                        <Link href="/forum/categories">Browse Categories</Link>
                      </Button>
                    </div>
                  </>
                )}
              </div>
              <div className="absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
            </div>

            {/* Categories */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">Categories</h2>
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/forum/admin/categories/new">
                        <FolderPlus className="mr-2 h-4 w-4" />
                        New Category
                      </Link>
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/forum/categories">View All</Link>
                  </Button>
                </div>
              </div>
              <div className="grid gap-4">
                {categories.map((category) => (
                  <Link key={category.id} href={`/forum/categories/${category.slug}`} className="group">
                    <div className="flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                        style={{ backgroundColor: category.color ? `${category.color}20` : "var(--primary-10)" }}
                      >
                        {category.iconClass ? (
                          <CategoryIcon
                            iconName={category.iconClass}
                            color={category.color || "var(--primary)"}
                            size="md"
                            className="h-5 w-5 text-primary group-hover:text-primary-foreground transition-colors"
                          />
                        ) : (
                          <MessageSquare className="h-5 w-5" style={{ color: category.color || "var(--primary)" }} />
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium group-hover:text-primary transition-colors">{category.name}</h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{category.threadCount} threads</span>
                            <span>•</span>
                            <span>{category.postCount} posts</span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {category.description || `Discussions about ${category.name}`}
                        </p>
                        {category.lastThread && (
                          <div className="mt-2 flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground">Latest:</span>
                            <Link
                              href={`/forum/categories/${category.slug}/threads/${category.lastThread.slug}`}
                              className="font-medium hover:text-primary truncate max-w-[200px]"
                            >
                              {category.lastThread.title}
                            </Link>
                            <span className="text-muted-foreground">
                              {formatDistanceToNow(new Date(category.lastThread.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Threads */}
            <div>
              <Tabs defaultValue="recent">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-bold">Discussions</h2>
                  <TabsList>
                    <TabsTrigger value="recent" className="text-xs sm:text-sm">
                      <Clock className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                      Recent
                    </TabsTrigger>
                    <TabsTrigger value="trending" className="text-xs sm:text-sm">
                      <TrendingUp className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                      Trending
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="recent" className="mt-0">
                  <div className="grid gap-4">
                    {recentThreads.map((thread) => (
                      <ThreadCard key={thread.id} thread={thread} />
                    ))}
                  </div>
                  <div className="mt-4 flex justify-center">
                    <Button variant="outline" asChild>
                      <Link href="/forum/threads">View All Threads</Link>
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="trending" className="mt-0">
                  <div className="grid gap-4">
                    {trendingThreads.map((thread) => (
                      <ThreadCard key={thread.id} thread={thread} />
                    ))}
                  </div>
                  <div className="mt-4 flex justify-center">
                    <Button variant="outline" asChild>
                      <Link href="/forum/trending">View All Trending</Link>
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* User Stats Card - Only for authenticated users */}
            {isAuthenticated && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Your Activity</CardTitle>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col items-center justify-center rounded-lg border bg-card/50 p-3">
                      <span className="text-xl font-bold">0</span>
                      <span className="text-xs text-muted-foreground">Threads</span>
                    </div>
                    <div className="flex flex-col items-center justify-center rounded-lg border bg-card/50 p-3">
                      <span className="text-xl font-bold">0</span>
                      <span className="text-xs text-muted-foreground">Replies</span>
                    </div>
                    <div className="flex flex-col items-center justify-center rounded-lg border bg-card/50 p-3">
                      <span className="text-xl font-bold">0</span>
                      <span className="text-xs text-muted-foreground">Reactions</span>
                    </div>
                    <div className="flex flex-col items-center justify-center rounded-lg border bg-card/50 p-3">
                      <span className="text-xl font-bold">0</span>
                      <span className="text-xs text-muted-foreground">Reputation</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-2">
                  <Button variant="ghost" size="sm" className="w-full" asChild>
                    <Link href={`/forum/profile/${session.user.id}`}>View Profile</Link>
                  </Button>
                </CardFooter>
              </Card>
            )}

            {/* Quick Links - Different for authenticated and unauthenticated users */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2">
                {isAuthenticated ? (
                  <>
                    <Button variant="ghost" size="sm" className="justify-start" asChild>
                      <Link href="/forum/unread">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Unread Threads
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" className="justify-start" asChild>
                      <Link href="/forum/bookmarks">
                        <Bookmark className="mr-2 h-4 w-4" />
                        Bookmarked Threads
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" className="justify-start" asChild>
                      <Link href="/forum/participated">
                        <User className="mr-2 h-4 w-4" />
                        My Participated Threads
                      </Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" size="sm" className="justify-start" asChild>
                      <Link href="/forum/categories">
                        <Tag className="mr-2 h-4 w-4" />
                        Browse Categories
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" className="justify-start" asChild>
                      <Link href="/forum/popular">
                        <TrendingUp className="mr-2 h-4 w-4" />
                        Popular Threads
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" className="justify-start" asChild>
                      <Link href="/forum/help">
                        <HelpCircle className="mr-2 h-4 w-4" />
                        Help & Guidelines
                      </Link>
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Online Users */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Online Now</CardTitle>
                <CardDescription className="text-xs">Members currently browsing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {/* This would be populated with actual online users */}
                  <Avatar className="h-8 w-8 border-2 border-primary">
                    <AvatarImage src="/api/placeholder/32/32" alt="User" />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/api/placeholder/32/32" alt="User" />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/api/placeholder/32/32" alt="User" />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs">+5</div>
                </div>
              </CardContent>
            </Card>

            {/* Forum Stats */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Forum Statistics</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Threads:</span>
                  <span className="font-medium">1,234</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Posts:</span>
                  <span className="font-medium">5,678</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Members:</span>
                  <span className="font-medium">789</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Newest Member:</span>
                  <Link href="#" className="font-medium hover:text-primary">
                    NewUser123
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 md:py-0 w-full px-4">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
          <p className="text-center text-sm text-muted-foreground md:text-left">
            &copy; {new Date().getFullYear()} OpenForum. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link href="/forum/help" className="text-sm text-muted-foreground hover:text-foreground">
              Help
            </Link>
            <Link href="/forum/guidelines" className="text-sm text-muted-foreground hover:text-foreground">
              Guidelines
            </Link>
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </>
  )
}