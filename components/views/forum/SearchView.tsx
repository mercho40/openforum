"use client"

import type React from "react"
import { Star } from "lucide-react" // Import Star component

import { useState, useEffect } from "react"
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
  MoreVertical,
  Edit,
  Trash2,
  Grid3X3,
  Clock,
  TrendingUp,
  AlertCircle,
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
    username?: string | null
    displayUsername?: string | null
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

interface SearchViewProps {
  session: Session | null
  threads: Thread[]
  categories: Category[]
  pagination: Pagination
  currentSearch: string
  currentCategory?: string
  currentSort?: string
  currentFilter?: string
}

export function SearchView({
  session,
  threads,
  categories,
  pagination,
  currentSearch,
  currentCategory,
  currentSort = "recent",
  currentFilter,
}: SearchViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState(currentSearch || "")
  const [isSearching, setIsSearching] = useState(false)

  const isAuthenticated = !!session
  const isAdmin = isAuthenticated && session.user.role === "admin"

  // Update search query when currentSearch changes
  useEffect(() => {
    setSearchQuery(currentSearch || "")
  }, [currentSearch])

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

    router.push(`/forum/search?${params.toString()}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSearching(true)
    updateSearchParams({ q: searchQuery.trim() || undefined })
    setTimeout(() => setIsSearching(false), 500)
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
      case "recent":
      default:
        return "Recent"
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

  const getAuthorDisplayName = (
    author:
      | {
          displayUsername?: string | null
          username?: string | null
          name: string | null
        }
      | null
      | undefined,
  ) => {
    if (!author) return "Unknown User"
    return author.displayUsername || author.username || author.name || "Unknown User"
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
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
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
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Threads
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
        <div className="grid gap-6 md:grid-cols-[1fr_300px]">
          {/* Main Column */}
          <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Search Forum</h1>
                  <p className="text-muted-foreground">Find threads, posts, and discussions</p>
                </div>
              </div>

              {/* Breadcrumb */}
              <nav className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link href="/forum" className="hover:text-foreground">
                  Forum
                </Link>
                <span>/</span>
                <span className="text-foreground">Search</span>
                {currentSearch && (
                  <>
                    <span>/</span>
                    <span className="text-foreground truncate max-w-[200px]">&quot;{currentSearch}&quot;</span>
                  </>
                )}
              </nav>
            </div>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="relative">
                <Input
                  type="search"
                  placeholder="Search for threads, topics, or keywords..."
                  className="pr-10 h-12"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button
                  type="submit"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-12"
                  aria-label="Search"
                  disabled={isSearching}
                >
                  <Search className="h-5 w-5" />
                </Button>
              </div>

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
                    <DropdownMenuItem onClick={() => updateSearchParams({ sort: "recent" })}>
                      <Clock className="mr-2 h-4 w-4" />
                      Recent
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => updateSearchParams({ sort: "views" })}>
                      <Eye className="mr-2 h-4 w-4" />
                      Views
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => updateSearchParams({ sort: "replies" })}>
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Replies
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
                {(currentCategory || currentSearch || currentFilter || currentSort !== "recent") && (
                  <Button variant="ghost" size="sm" onClick={() => router.push("/forum/search")}>
                    Clear Filters
                  </Button>
                )}
              </div>
            </form>

            {/* Search Results */}
            <div className="space-y-4">
              {currentSearch ? (
                <>
                  <div className="text-sm text-muted-foreground">
                    {pagination.total} result{pagination.total !== 1 ? "s" : ""} found for &quot;{currentSearch}&quot;
                  </div>

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
                                    <span>by {getAuthorDisplayName(thread.author)}</span>
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
                        <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No results found</h3>
                        <p className="text-muted-foreground mb-4">
                          We couldn&apos;t find any threads matching &quot;{currentSearch}&quot;
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2 justify-center">
                          <Button variant="outline" onClick={() => setSearchQuery("")}>
                            Clear Search
                          </Button>
                          <Button asChild>
                            <Link href="/forum/threads/new">
                              <MessageSquare className="mr-2 h-4 w-4" />
                              Start a New Thread
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Search the forum</h3>
                    <p className="text-muted-foreground mb-4">
                      Enter keywords above to search for threads, topics, or discussions
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      <Button variant="outline" size="sm" onClick={() => updateSearchParams({ q: "help" })}>
                        help
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => updateSearchParams({ q: "tutorial" })}>
                        tutorial
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => updateSearchParams({ q: "question" })}>
                        question
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => updateSearchParams({ q: "issue" })}>
                        issue
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Pagination */}
            {currentSearch && pagination.totalPages > 1 && (
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
            {/* Search Tips */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-3">Search Tips</h3>
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">• Use specific keywords for better results</p>
                  <p className="text-muted-foreground">• Filter by category to narrow down results</p>
                  <p className="text-muted-foreground">• Sort by views or replies to find popular content</p>
                  <p className="text-muted-foreground">• Use quotes for exact phrase matching</p>
                </div>
              </CardContent>
            </Card>

            {/* Active Filters */}
            {(currentCategory || currentSearch || currentFilter) && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-medium mb-3">Active Filters</h3>
                  <div className="space-y-2">
                    {currentSearch && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Search:</span>
                        <Badge variant="secondary" className="max-w-[120px] truncate">
                          {currentSearch}
                        </Badge>
                      </div>
                    )}
                    {currentCategory && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Category:</span>
                        <Badge variant="secondary">
                          {categories.find((c) => c.slug === currentCategory)?.name || "Unknown"}
                        </Badge>
                      </div>
                    )}
                    {currentFilter && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Type:</span>
                        <Badge variant="secondary">{getFilterLabel(currentFilter)}</Badge>
                      </div>
                    )}
                    {currentSort && currentSort !== "recent" && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Sort:</span>
                        <Badge variant="secondary">{getSortLabel(currentSort)}</Badge>
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => router.push("/forum/search")}
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
                  <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
                    <Link href="/forum/threads">
                      <Grid3X3 className="mr-2 h-4 w-4" />
                      All Threads
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
                    <Link href="/forum/threads?sort=views">
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Popular Threads
                    </Link>
                  </Button>
                  {isAuthenticated && (
                    <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
                      <Link href="/forum/threads/new">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        New Thread
                      </Link>
                    </Button>
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
                      href={`/forum/search?category=${category.slug}`}
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
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  )
}
