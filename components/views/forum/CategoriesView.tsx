"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
  FolderPlus,
  Grid3X3,
  List,
  SortAsc,
  Filter,
  Eye,
  MessageCircle,
  Clock,
  Plus,
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  displayOrder: number
  isHidden: boolean
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

interface CategoriesViewProps {
  session: Session | null
  categories: Category[]
}

export function CategoriesView({ session, categories }: CategoriesViewProps) {
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState("order")
  const [showHidden, setShowHidden] = useState(false)

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
          router.push("/auth/signin")
        },
      },
    })
  }

  // Filter categories based on search and visibility
  const filteredCategories = categories
    .filter((category) => {
      if (!showHidden && category.isHidden && !isAdmin) return false
      if (searchQuery.trim()) {
        return (
          category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          category.description?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      }
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name)
        case "threads":
          return b.threadCount - a.threadCount
        case "posts":
          return b.postCount - a.postCount
        case "activity":
          if (!a.lastThread && !b.lastThread) return 0
          if (!a.lastThread) return 1
          if (!b.lastThread) return -1
          return new Date(b.lastThread.createdAt).getTime() - new Date(a.lastThread.createdAt).getTime()
        case "order":
        default:
          return a.displayOrder - b.displayOrder
      }
    })

  const totalThreads = categories.reduce((sum, cat) => sum + cat.threadCount, 0)
  const totalPosts = categories.reduce((sum, cat) => sum + cat.postCount, 0)

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
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium bg-muted text-foreground"
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
              <Link
                href="/forum"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
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
                placeholder="Search categories..."
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
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Forum Categories</h1>
                <p className="text-muted-foreground">
                  Browse all discussion categories • {filteredCategories.length} categories
                </p>
              </div>
              {isAdmin && (
                <Button asChild>
                  <Link href="/forum/admin/categories/new">
                    <FolderPlus className="mr-2 h-4 w-4" />
                    New Category
                  </Link>
                </Button>
              )}
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Filter className="mr-2 h-4 w-4" />
                      Sort by:{" "}
                      {sortBy === "order"
                        ? "Order"
                        : sortBy === "name"
                          ? "Name"
                          : sortBy === "threads"
                            ? "Threads"
                            : sortBy === "posts"
                              ? "Posts"
                              : "Activity"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setSortBy("order")}>
                      <SortAsc className="mr-2 h-4 w-4" />
                      Display Order
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("name")}>
                      <Tag className="mr-2 h-4 w-4" />
                      Name
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("threads")}>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Thread Count
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("posts")}>
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Post Count
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("activity")}>
                      <Clock className="mr-2 h-4 w-4" />
                      Recent Activity
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {isAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowHidden(!showHidden)}
                    className={showHidden ? "bg-muted" : ""}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    {showHidden ? "Hide Hidden" : "Show Hidden"}
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Search Results Info */}
            {searchQuery.trim() && (
              <div className="text-sm text-muted-foreground">
                {filteredCategories.length} categories found for &quot;{searchQuery}&quot;
              </div>
            )}

            {/* Categories */}
            <div className={viewMode === "grid" ? "grid gap-4 sm:grid-cols-2" : "space-y-4"}>
              {filteredCategories.length > 0 ? (
                filteredCategories.map((category) => (
                  <Link key={category.id} href={`/forum/categories/${category.slug}`} className="group">
                    <Card className="h-full transition-all hover:bg-muted/30 hover:shadow-md">
                      <CardHeader className="pb-3">
                        <div className="flex items-start gap-3">
                          <div
                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
                            style={{
                              backgroundColor: category.color ? `${category.color}20` : "var(--primary-10)",
                            }}
                          >
                            <CategoryIcon
                              iconName={category.iconClass}
                              color={category.color}
                              size="lg"
                              className="h-6 w-6"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-1">
                                {category.name}
                              </CardTitle>
                              {category.isHidden && isAdmin && <Badge variant="secondary">Hidden</Badge>}
                            </div>
                            <CardDescription className="line-clamp-2">
                              {category.description || `Discussions about ${category.name}`}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-4 text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-4 w-4" />
                              <span>{category.threadCount}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageCircle className="h-4 w-4" />
                              <span>{category.postCount}</span>
                            </div>
                          </div>
                          {category.lastThread && (
                            <div className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(category.lastThread.createdAt), { addSuffix: true })}
                            </div>
                          )}
                        </div>
                        {category.lastThread && (
                          <div className="mt-3 pt-3 border-t border-border/50">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>Latest:</span>
                              <span className="font-medium truncate max-w-[150px]">{category.lastThread.title}</span>
                              <span>by</span>
                              <span className="font-medium">{category.lastThread.author.name}</span>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                ))
              ) : (
                <Card className="col-span-full">
                  <CardContent className="p-8 text-center">
                    <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      {searchQuery.trim() ? "No categories found" : "No categories yet"}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {searchQuery.trim()
                        ? "Try adjusting your search terms."
                        : "Categories will appear here once they are created."}
                    </p>
                    {isAdmin && !searchQuery.trim() && (
                      <Button asChild>
                        <Link href="/forum/admin/categories/new">
                          <Plus className="mr-2 h-4 w-4" />
                          Create First Category
                        </Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Forum Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Forum Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Categories:</span>
                  <span className="font-medium">{categories.filter((c) => !c.isHidden || isAdmin).length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Threads:</span>
                  <span className="font-medium">{totalThreads.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Posts:</span>
                  <span className="font-medium">{totalPosts.toLocaleString()}</span>
                </div>
                {isAdmin && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Hidden Categories:</span>
                      <span className="font-medium">{categories.filter((c) => c.isHidden).length}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Most Active Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Most Active</CardTitle>
                <CardDescription>Categories with recent activity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {categories
                  .filter((c) => !c.isHidden || isAdmin)
                  .sort((a, b) => b.postCount - a.postCount)
                  .slice(0, 5)
                  .map((category) => (
                    <Link
                      key={category.id}
                      href={`/forum/categories/${category.slug}`}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors"
                    >
                      <div
                        className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                          backgroundColor: category.color ? `${category.color}20` : "var(--primary-10)",
                        }}
                      >
                        <CategoryIcon
                          iconName={category.iconClass}
                          color={category.color}
                          size="sm"
                          className="h-4 w-4"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{category.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {category.postCount} posts • {category.threadCount} threads
                        </div>
                      </div>
                    </Link>
                  ))}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            {isAuthenticated && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                    <Link href="/forum">
                      <Home className="mr-2 h-4 w-4" />
                      Back to Forum
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                    <Link href="/forum/search">
                      <Search className="mr-2 h-4 w-4" />
                      Search Forum
                    </Link>
                  </Button>
                  {isAdmin && (
                    <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                      <Link href="/forum/admin/categories">
                        <Settings className="mr-2 h-4 w-4" />
                        Manage Categories
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
