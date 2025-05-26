"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { 
  MessageSquare, PlusCircle, Search, Bell, User, LogOut, 
  Settings, Menu, X, Home, Users, Tag, 
  Pin, Lock, Eye, MessageCircle, ChevronLeft, 
  ChevronRight, Filter, SortAsc, Calendar,
  MoreVertical, Edit, Trash2, 
  LogIn,
  UserPlus
} from 'lucide-react'
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
import { Card, CardContent } from "@/components/ui/card"
import type { Session } from "@/lib/auth"
import { formatDistanceToNow } from "date-fns"
import { authClient } from "@/lib/auth-client"
import { CategoryIcon } from "@/components/forum/CategoryIcon"

interface Category {
  id: string
  name: string
  description: string | null
  slug: string
  iconClass: string | null
  color: string | null
}

interface Thread {
  id: string
  title: string
  slug: string
  createdAt: Date
  viewCount: number
  replyCount: number
  isPinned: boolean
  isLocked: boolean
  author: {
    id: string
    name: string | null
    image: string | null
  }
  lastPost?: {
    createdAt: Date
    author: {
      id: string
      name: string | null
      image: string | null
    }
  } | null
}

interface Pagination {
  total: number
  page: number
  perPage: number
  totalPages: number
}

interface CategoryViewProps {
  session: Session | null
  category: Category
  threads: Thread[]
  pagination: Pagination
}

export function CategoryView({ session, category, threads, pagination }: CategoryViewProps) {
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("lastPost")

  const isAuthenticated = !!session
  const isAdmin = isAuthenticated && session.user.role === "admin"

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/forum/search?q=${encodeURIComponent(searchQuery.trim())}&category=${category.slug}`)
    }
  }

  const handleLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/auth/signin")
        },
      },
    })
  }

  const sortedThreads = [...threads].sort((a, b) => {
    // Pinned threads always come first
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1

    switch (sortBy) {
      case "title":
        return a.title.localeCompare(b.title)
      case "replies":
        return b.replyCount - a.replyCount
      case "views":
        return b.viewCount - a.viewCount
      case "created":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case "lastPost":
      default:
        const aLastPost = a.lastPost?.createdAt || a.createdAt
        const bLastPost = b.lastPost?.createdAt || b.createdAt
        return new Date(bLastPost).getTime() - new Date(aLastPost).getTime()
    }
  })

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
                </nav>
              </SheetContent>
            </Sheet>

            <Link href="/" className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <span className="hidden font-bold sm:inline-block">OpenForum</span>
            </Link>

            <nav className="hidden md:flex md:gap-4 lg:gap-6">
              <Link href="/forum" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                Home
              </Link>
              <Link
                href="/forum/categories"
                className="text-sm font-medium text-foreground transition-colors hover:text-primary"
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
                placeholder="Search in category..."
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
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container py-6 px-4">
        {/* Category Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: category.color ? `${category.color}20` : "var(--primary-10)" }}
            >
              <CategoryIcon
                iconName={category.iconClass}
                color={category.color}
                size="lg"
                className="h-6 w-6"
              />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold tracking-tight">{category.name}</h1>
              {category.description && (
                <p className="text-muted-foreground mt-1">{category.description}</p>
              )}
            </div>
            {isAuthenticated && (
              <Button asChild>
                <Link href={`/forum/categories/${category.slug}/new-thread`}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Thread
                </Link>
              </Button>
            )}
          </div>

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Link href="/forum" className="hover:text-foreground">Forum</Link>
            <span>/</span>
            <Link href="/forum/categories" className="hover:text-foreground">Categories</Link>
            <span>/</span>
            <span className="text-foreground">{category.name}</span>
          </nav>

          {/* Controls */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    Sort by: {sortBy === "lastPost" ? "Last Post" : sortBy === "title" ? "Title" : sortBy === "replies" ? "Replies" : sortBy === "views" ? "Views" : "Created"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setSortBy("lastPost")}>
                    <Calendar className="mr-2 h-4 w-4" />
                    Last Post
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("title")}>
                    <SortAsc className="mr-2 h-4 w-4" />
                    Title
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("replies")}>
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Replies
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("views")}>
                    <Eye className="mr-2 h-4 w-4" />
                    Views
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("created")}>
                    <Calendar className="mr-2 h-4 w-4" />
                    Created
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="text-sm text-muted-foreground">
              {pagination.total} threads
            </div>
          </div>
        </div>

        {/* Threads List */}
        <div className="space-y-4">
          {sortedThreads.length > 0 ? (
            sortedThreads.map((thread) => (
              <Card key={thread.id} className="hover:bg-muted/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={thread.author.image || ""} alt={thread.author.name || "User"} />
                      <AvatarFallback>{thread.author.name?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {thread.isPinned && (
                              <Pin className="h-4 w-4 text-primary" />
                            )}
                            {thread.isLocked && (
                              <Lock className="h-4 w-4 text-muted-foreground" />
                            )}
                            <Link
                              href={`/forum/categories/${category.slug}/threads/${thread.slug}`}
                              className="font-medium hover:text-primary transition-colors line-clamp-1"
                            >
                              {thread.title}
                            </Link>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>by {thread.author.name}</span>
                            <span>•</span>
                            <span>{formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}</span>
                          </div>
                        </div>

                        {isAuthenticated && (session.user.id === thread.author.id || isAdmin) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/forum/categories/${category.slug}/threads/${thread.slug}/edit`}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              {isAdmin && (
                                <DropdownMenuItem className="text-destructive">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MessageCircle className="h-4 w-4" />
                            <span>{thread.replyCount}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            <span>{thread.viewCount}</span>
                          </div>
                        </div>

                        {thread.lastPost && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Last reply by</span>
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={thread.lastPost.author.image || ""} alt={thread.lastPost.author.name || "User"} />
                              <AvatarFallback className="text-xs">{thread.lastPost.author.name?.charAt(0) || "U"}</AvatarFallback>
                            </Avatar>
                            <span>{thread.lastPost.author.name}</span>
                            <span>•</span>
                            <span>{formatDistanceToNow(new Date(thread.lastPost.createdAt), { addSuffix: true })}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No threads yet</h3>
                <p className="text-muted-foreground mb-4">
                  Be the first to start a discussion in this category.
                </p>
                {isAuthenticated && (
                  <Button asChild>
                    <Link href={`/forum/categories/${category.slug}/new-thread`}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Create First Thread
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              asChild={pagination.page > 1}
            >
              {pagination.page > 1 ? (
                <Link href={`/forum/categories/${category.slug}?page=${pagination.page - 1}`}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Link>
              ) : (
                <>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </>
              )}
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const pageNum = i + 1
                return (
                  <Button
                    key={pageNum}
                    variant={pagination.page === pageNum ? "default" : "outline"}
                    size="sm"
                    asChild={pagination.page !== pageNum}
                  >
                    {pagination.page !== pageNum ? (
                      <Link href={`/forum/categories/${category.slug}?page=${pageNum}`}>
                        {pageNum}
                      </Link>
                    ) : (
                      <span>{pageNum}</span>
                    )}
                  </Button>
                )
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              asChild={pagination.page < pagination.totalPages}
            >
              {pagination.page < pagination.totalPages ? (
                <Link href={`/forum/categories/${category.slug}?page=${pagination.page + 1}`}>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        )}
      </main>
    </>
  )
}
