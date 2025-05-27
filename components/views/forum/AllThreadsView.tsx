"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  MessageSquare,
  Search,
  Bell,
  User,
  LogOut,
  Settings,
  Menu,
  X,
  Home,
  Users,
  Tag,
  LogIn,
  UserPlus,
  Pin,
  Lock,
  Eye,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  SortAsc,
  Calendar,
  MoreVertical,
  Edit,
  Trash2,
  Bookmark,
  Star,
  Clock,
  Grid3X3,
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
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Session } from "@/lib/auth"
import { formatDistanceToNow } from "date-fns"
import { authClient } from "@/lib/auth-client"
import { CategoryIcon } from "@/components/forum/CategoryIcon"

interface Category {
  id: string
  name: string
  slug: string
  color: string | null
  iconClass: string | null
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
  lastPostAt: Date
  author: {
    id: string
    name: string | null
    image: string | null
  }
  category: {
    id: string
    name: string
    slug: string
    color: string | null
    iconClass: string | null
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

interface AllThreadsViewProps {
  session: Session | null
  threads: Thread[]
  categories: Category[]
  pagination: Pagination
  currentSort?: string
  currentCategory?: string
  currentSearch?: string
  currentFilter?: string
}

export function AllThreadsView({
  session,
  threads,
  categories,
  pagination,
  currentSort = "lastPost",
  currentCategory,
  currentSearch,
  currentFilter,
}: AllThreadsViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState(currentSearch || "")

  const isAuthenticated = !!session
  const isAdmin = isAuthenticated && session.user.role === "admin"

  const updateSearchParams = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString())

    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })

    // Reset to page 1 when changing filters
    if (Object.keys(updates).some((key) => key !== "page")) {
      params.set("page", "1")
    }

    router.push(`/forum/threads?${params.toString()}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateSearchParams({ search: searchQuery.trim() || undefined })
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

  const getSortLabel = (sort: string) => {
    switch (sort) {
      case "title":
        return "Title"
      case "replies":
        return "Replies"
      case "views":
        return "Views"
      case "created":
        return "Created"
      case "lastPost":
        return "Last Post"
      default:
        return "Last Post"
    }
  }

  const getFilterLabel = (filter?: string) => {
    switch (filter) {
      case "pinned":
        return "Pinned"
      case "locked":
        return "Locked"
      default:
        return "All"
    }
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
                    href="/forum/threads"
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium bg-muted text-foreground"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Grid3X3 className="h-4 w-4" />
                    Threads
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
              <Link
                href="/forum"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Home
              </Link>
              <Link
                href="/forum/categories"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Categories
              </Link>
              <Link
                href="/forum/threads"
                className="text-sm font-medium text-foreground transition-colors hover:text-primary"
              >
                All Threads
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
                placeholder="Search threads..."
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
        <div className="grid gap-6 md:grid-cols-[1fr_300px]">
          {/* Main Column */}
          <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">All Threads</h1>
                  <p className="text-muted-foreground">Browse all discussions across the forum</p>
                </div>
              </div>

              {/* Breadcrumb */}
              <nav className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link href="/forum" className="hover:text-foreground">
                  Forum
                </Link>
                <span>/</span>
                <span className="text-foreground">All Threads</span>
              </nav>
            </div>

            {/* Filters and Search */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                {/* Sort Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <SortAsc className="mr-2 h-4 w-4" />
                      Sort: {getSortLabel(currentSort)}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => updateSearchParams({ sort: "lastPost" })}>
                      <Calendar className="mr-2 h-4 w-4" />
                      Last Post
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => updateSearchParams({ sort: "created" })}>
                      <Clock className="mr-2 h-4 w-4" />
                      Created
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => updateSearchParams({ sort: "title" })}>
                      <SortAsc className="mr-2 h-4 w-4" />
                      Title
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => updateSearchParams({ sort: "replies" })}>
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Replies
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => updateSearchParams({ sort: "views" })}>
                      <Eye className="mr-2 h-4 w-4" />
                      Views
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Category Filter */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Filter className="mr-2 h-4 w-4" />
                      Category:{" "}
                      {currentCategory ? categories.find((c) => c.slug === currentCategory)?.name || "Unknown" : "All"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="max-h-[300px] overflow-y-auto">
                    <DropdownMenuItem onClick={() => updateSearchParams({ category: undefined })}>
                      All Categories
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {categories.map((category) => (
                      <DropdownMenuItem
                        key={category.id}
                        onClick={() => updateSearchParams({ category: category.slug })}
                      >
                        <div className="flex items-center gap-2">
                          <CategoryIcon
                            iconName={category.iconClass}
                            color={category.color}
                            size="sm"
                            className="h-4 w-4"
                          />
                          {category.name}
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Thread Type Filter */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Star className="mr-2 h-4 w-4" />
                      Type: {getFilterLabel(currentFilter)}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => updateSearchParams({ filter: undefined })}>
                      All Threads
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => updateSearchParams({ filter: "pinned" })}>
                      <Pin className="mr-2 h-4 w-4" />
                      Pinned Only
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => updateSearchParams({ filter: "locked" })}>
                      <Lock className="mr-2 h-4 w-4" />
                      Locked Only
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Clear Filters */}
                {(currentCategory || currentSearch || currentFilter || currentSort !== "lastPost") && (
                  <Button variant="ghost" size="sm" onClick={() => router.push("/forum/threads")}>
                    Clear Filters
                  </Button>
                )}
              </div>

              <div className="text-sm text-muted-foreground">
                {pagination.total} thread{pagination.total !== 1 ? "s" : ""}
              </div>
            </div>

            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="md:hidden">
              <div className="relative">
                <Input
                  type="search"
                  placeholder="Search threads..."
                  className="pr-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button
                  type="submit"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  aria-label="Search"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </form>

            {/* Threads List */}
            <div className="space-y-4">
              {threads.length > 0 ? (
                threads.map((thread) => (
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
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                {thread.isPinned && <Pin className="h-4 w-4 text-primary" />}
                                {thread.isLocked && <Lock className="h-4 w-4 text-muted-foreground" />}
                                <Link
                                  href={`/forum/categories/${thread.category.slug}/threads/${thread.slug}`}
                                  className="font-medium hover:text-primary transition-colors line-clamp-1"
                                >
                                  {thread.title}
                                </Link>
                              </div>

                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <Link
                                  href={`/forum/categories/${thread.category.slug}`}
                                  className="inline-flex items-center gap-1 text-xs bg-muted/50 hover:bg-muted px-2 py-1 rounded-full transition-colors"
                                >
                                  <CategoryIcon
                                    iconName={thread.category.iconClass}
                                    color={thread.category.color}
                                    size="sm"
                                    className="h-3 w-3"
                                  />
                                  {thread.category.name}
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
                                    <Link
                                      href={`/forum/categories/${thread.category.slug}/threads/${thread.slug}/edit`}
                                    >
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
                                <span className="hidden sm:inline">Last reply by</span>
                                <Avatar className="h-5 w-5">
                                  <AvatarImage
                                    src={thread.lastPost.author.image || ""}
                                    alt={thread.lastPost.author.name || "User"}
                                  />
                                  <AvatarFallback className="text-xs">
                                    {thread.lastPost.author.name?.charAt(0) || "U"}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{thread.lastPost.author.name}</span>
                                <span className="hidden sm:inline">•</span>
                                <span className="hidden sm:inline">
                                  {formatDistanceToNow(new Date(thread.lastPost.createdAt), { addSuffix: true })}
                                </span>
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
                    <h3 className="text-lg font-medium mb-2">No threads found</h3>
                    <p className="text-muted-foreground mb-4">
                      {currentSearch || currentCategory || currentFilter
                        ? "Try adjusting your filters or search terms."
                        : "No threads have been created yet."}
                    </p>
                    {!currentSearch && !currentCategory && !currentFilter && (
                      <Button asChild>
                        <Link href="/forum/categories">Browse Categories</Link>
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
                  onClick={() => updateSearchParams({ page: String(pagination.page - 1) })}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const pageNum = i + 1
                    return (
                      <Button
                        key={pageNum}
                        variant={pagination.page === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateSearchParams({ page: String(pageNum) })}
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => updateSearchParams({ page: String(pagination.page + 1) })}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-3">Forum Overview</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Threads:</span>
                    <span className="font-medium">{pagination.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Categories:</span>
                    <span className="font-medium">{categories.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Active Filters */}
            {(currentCategory || currentSearch || currentFilter) && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-medium mb-3">Active Filters</h3>
                  <div className="space-y-2">
                    {currentCategory && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Category:</span>
                        <Badge variant="secondary">
                          {categories.find((c) => c.slug === currentCategory)?.name || "Unknown"}
                        </Badge>
                      </div>
                    )}
                    {currentSearch && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Search:</span>
                        <Badge variant="secondary" className="max-w-[120px] truncate">
                          {currentSearch}
                        </Badge>
                      </div>
                    )}
                    {currentFilter && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Type:</span>
                        <Badge variant="secondary">{getFilterLabel(currentFilter)}</Badge>
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => router.push("/forum/threads")}
                    >
                      Clear All Filters
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Links */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-3">Quick Links</h3>
                <div className="space-y-2">
                  <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
                    <Link href="/forum">
                      <Home className="mr-2 h-4 w-4" />
                      Forum Home
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
                    <Link href="/forum/categories">
                      <Tag className="mr-2 h-4 w-4" />
                      Browse Categories
                    </Link>
                  </Button>
                  {isAuthenticated && (
                    <>
                      <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
                        <Link href="/forum/bookmarks">
                          <Bookmark className="mr-2 h-4 w-4" />
                          My Bookmarks
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
                        <Link href="/forum/participated">
                          <User className="mr-2 h-4 w-4" />
                          My Threads
                        </Link>
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Popular Categories */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-3">Popular Categories</h3>
                <div className="space-y-2">
                  {categories.slice(0, 5).map((category) => (
                    <Link
                      key={category.id}
                      href={`/forum/categories/${category.slug}`}
                      className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors text-sm"
                    >
                      <CategoryIcon
                        iconName={category.iconClass}
                        color={category.color}
                        size="sm"
                        className="h-4 w-4"
                      />
                      <span className="truncate">{category.name}</span>
                    </Link>
                  ))}
                  {categories.length > 5 && (
                    <Button variant="ghost" size="sm" className="w-full mt-2" asChild>
                      <Link href="/forum/categories">View All Categories</Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  )
}
