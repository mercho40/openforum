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
  Pin,
  Lock,
  Eye,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Edit,
  Trash2,
  Reply,
  Share,
  Bookmark,
  Flag,
  ChevronUp,
  ChevronDown,
  Calendar,
  Clock,
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
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import type { Session } from "@/lib/auth"
import { formatDistanceToNow } from "date-fns"
import { authClient } from "@/lib/auth-client"
import { CategoryIcon } from "@/components/forum/CategoryIcon"
import { createPost, votePost, updatePost, deletePost } from "@/actions/post"
import { toast } from "sonner"

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
    reputation?: number
    bio?: string | null
  }
  category: {
    id: string
    name: string
    slug: string
    iconClass: string | null
    color: string | null
  }
  tags?: Array<{
    tag: {
      id: string
      name: string
      slug: string
      color: string
    }
  }>
}

interface Post {
  id: string
  content: string
  createdAt: Date
  isEdited: boolean
  editedAt: Date | null
  isDeleted: boolean
  author: {
    id: string
    name: string | null
    image: string | null
    reputation?: number
    bio?: string | null
    signature?: string | null
  }
  votes: Array<{
    userId: string
    value: number
  }>
}

interface Pagination {
  total: number
  page: number
  perPage: number
  totalPages: number
}

interface ThreadViewProps {
  session: Session | null
  thread: Thread
  posts: Post[]
  pagination: Pagination
  categorySlug: string
}

export function ThreadView({ session, thread, posts, pagination, categorySlug }: ThreadViewProps) {
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [replyContent, setReplyContent] = useState("")
  const [isSubmittingReply, setIsSubmittingReply] = useState(false)
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [votingPostId, setVotingPostId] = useState<string | null>(null)

  const isAuthenticated = !!session
  const isAdmin = isAuthenticated && session.user.role === "admin"
  const isThreadAuthor = isAuthenticated && thread.author.id === session.user.id

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

  const handleReply = async () => {
    if (!replyContent.trim() || !isAuthenticated) return

    setIsSubmittingReply(true)
    try {
      const result = await createPost({
        content: replyContent,
        threadId: thread.id,
      })

      if (result.success) {
        setReplyContent("")
        toast.success("Reply posted successfully")
        router.refresh()
      } else {
        toast.error('error' in result ? result.error : "Failed to post reply")
      }
    } catch (error) {
      console.error(error)
      toast.error("An unexpected error occurred")
    } finally {
      setIsSubmittingReply(false)
    }
  }

  const handleVote = async (postId: string, value: 1 | 0 | -1) => {
    if (!isAuthenticated) {
      toast.error("Please sign in to vote")
      return
    }

    setVotingPostId(postId)
    try {
      const result = await votePost(postId, value)
      if (result.success) {
        router.refresh()
      } else {
        toast.error('error' in result ? result.error : "Failed to vote")
      }
    } catch (error) {
      console.error(error)
      toast.error("An unexpected error occurred")
    } finally {
      setVotingPostId(null)
    }
  }

  const handleEditPost = async (postId: string) => {
    if (!editContent.trim()) return

    try {
      const result = await updatePost(postId, { content: editContent })
      if (result.success) {
        setEditingPostId(null)
        setEditContent("")
        toast.success("Post updated successfully")
        router.refresh()
      } else {
        toast.error(result.error || "Failed to update post")
      }
    } catch (error) {
      console.error(error)
      toast.error("An unexpected error occurred")
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return

    try {
      const result = await deletePost(postId)
      if (result.success) {
        toast.success("Post deleted successfully")
        router.refresh()
      } else {
        toast.error(result.error || "Failed to delete post")
      }
    } catch (error) {
      console.error(error)
      toast.error("An unexpected error occurred")
    }
  }

  const getPostScore = (post: Post) => {
    return post.votes.reduce((sum, vote) => sum + vote.value, 0)
  }

  const getUserVote = (post: Post) => {
    if (!isAuthenticated) return 0
    const userVote = post.votes.find((vote) => vote.userId === session.user.id)
    return userVote?.value || 0
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
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/forum" className="hover:text-foreground">
            Forum
          </Link>
          <span>/</span>
          <Link href="/forum/categories" className="hover:text-foreground">
            Categories
          </Link>
          <span>/</span>
          <Link href={`/forum/categories/${categorySlug}`} className="hover:text-foreground">
            {thread.category.name}
          </Link>
          <span>/</span>
          <span className="text-foreground truncate">{thread.title}</span>
        </nav>

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          {/* Main Column */}
          <div className="space-y-6">
            {/* Thread Header */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {thread.isPinned && <Pin className="h-4 w-4 text-primary" />}
                      {thread.isLocked && <Lock className="h-4 w-4 text-muted-foreground" />}
                      <h1 className="text-2xl font-bold tracking-tight line-clamp-2">{thread.title}</h1>
                    </div>

                    {/* Thread Tags */}
                    {thread.tags && thread.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {thread.tags.map(({ tag }) => (
                          <Badge
                            key={tag.id}
                            variant="secondary"
                            className="text-xs"
                            style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                          >
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={thread.author.image || ""} alt={thread.author.name || "User"} />
                          <AvatarFallback className="text-xs">{thread.author.name?.charAt(0) || "U"}</AvatarFallback>
                        </Avatar>
                        <span>by {thread.author.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span>{thread.viewCount} views</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4" />
                        <span>{thread.replyCount} replies</span>
                      </div>
                    </div>
                  </div>

                  {/* Thread Actions */}
                  {isAuthenticated && (isThreadAuthor || isAdmin) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/forum/categories/${categorySlug}/threads/${thread.slug}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Thread
                          </Link>
                        </DropdownMenuItem>
                        {isAdmin && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Pin className="mr-2 h-4 w-4" />
                              {thread.isPinned ? "Unpin" : "Pin"} Thread
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Lock className="mr-2 h-4 w-4" />
                              {thread.isLocked ? "Unlock" : "Lock"} Thread
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Thread
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardHeader>
            </Card>

            {/* Posts */}
            <div className="space-y-4">
              {posts.map((post, index) => (
                <Card key={post.id} className={`${index === 0 ? "border-primary/20" : ""}`}>
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      {/* Vote Column */}
                      <div className="flex flex-col items-center gap-1 min-w-[40px]">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 ${getUserVote(post) === 1 ? "text-primary" : ""}`}
                          onClick={() => handleVote(post.id, getUserVote(post) === 1 ? 0 : 1)}
                          disabled={!isAuthenticated || votingPostId === post.id}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-medium">{getPostScore(post)}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 ${getUserVote(post) === -1 ? "text-destructive" : ""}`}
                          onClick={() => handleVote(post.id, getUserVote(post) === -1 ? 0 : -1)}
                          disabled={!isAuthenticated || votingPostId === post.id}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Author Info */}
                      <div className="flex flex-col items-center gap-2 min-w-[120px] text-center">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={post.author.image || ""} alt={post.author.name || "User"} />
                          <AvatarFallback>{post.author.name?.charAt(0) || "U"}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{post.author.name}</p>
                          {post.author.reputation !== undefined && (
                            <p className="text-xs text-muted-foreground">{post.author.reputation} rep</p>
                          )}
                        </div>
                      </div>

                      {/* Post Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                            {post.isEdited && post.editedAt && (
                              <>
                                <span>•</span>
                                <span>edited {formatDistanceToNow(new Date(post.editedAt), { addSuffix: true })}</span>
                              </>
                            )}
                          </div>

                          {/* Post Actions */}
                          {isAuthenticated && (
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Reply className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Share className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Bookmark className="h-4 w-4" />
                              </Button>
                              {(post.author.id === session.user.id || isAdmin) && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setEditingPostId(post.id)
                                        setEditContent(post.content)
                                      }}
                                    >
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleDeletePost(post.id)}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Flag className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Post Content */}
                        {editingPostId === post.id ? (
                          <div className="space-y-3">
                            <Textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="min-h-[100px]"
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleEditPost(post.id)}>
                                Save
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingPostId(null)
                                  setEditContent("")
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="prose prose-sm max-w-none">
                            {post.isDeleted ? (
                              <p className="text-muted-foreground italic">[This post has been deleted]</p>
                            ) : (
                              <p className="whitespace-pre-wrap">{post.content}</p>
                            )}
                          </div>
                        )}

                        {/* Author Signature */}
                        {post.author.signature && !post.isDeleted && (
                          <>
                            <Separator className="my-4" />
                            <div className="text-xs text-muted-foreground italic">
                              <p>{post.author.signature}</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button variant="outline" size="sm" disabled={pagination.page <= 1} asChild={pagination.page > 1}>
                  {pagination.page > 1 ? (
                    <Link href={`/forum/categories/${categorySlug}/threads/${thread.slug}?page=${pagination.page - 1}`}>
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
                          <Link href={`/forum/categories/${categorySlug}/threads/${thread.slug}?page=${pageNum}`}>
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
                    <Link href={`/forum/categories/${categorySlug}/threads/${thread.slug}?page=${pagination.page + 1}`}>
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

            {/* Reply Form */}
            {isAuthenticated && !thread.isLocked && (
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Post a Reply</h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Write your reply here..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    className="min-h-[120px]"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setReplyContent("")}
                      disabled={isSubmittingReply || !replyContent.trim()}
                    >
                      Clear
                    </Button>
                    <Button onClick={handleReply} disabled={isSubmittingReply || !replyContent.trim()}>
                      {isSubmittingReply ? "Posting..." : "Post Reply"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Locked Message */}
            {thread.isLocked && (
              <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-500">
                    <Lock className="h-5 w-5" />
                    <p className="font-medium">This thread is locked</p>
                  </div>
                  <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                    No new replies can be posted to this thread.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Thread Actions */}
            {isAuthenticated && (
              <Card>
                <CardHeader>
                  <h3 className="text-base font-semibold">Thread Actions</h3>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Bell className="mr-2 h-4 w-4" />
                    Subscribe
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Bookmark className="mr-2 h-4 w-4" />
                    Bookmark
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Share className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Flag className="mr-2 h-4 w-4" />
                    Report
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Category Info */}
            <Card>
              <CardHeader>
                <h3 className="text-base font-semibold">Category</h3>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/forum/categories/${categorySlug}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div
                    className="h-10 w-10 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: thread.category.color ? `${thread.category.color}20` : "var(--primary-10)",
                    }}
                  >
                    <CategoryIcon
                      iconName={thread.category.iconClass}
                      color={thread.category.color}
                      size="md"
                      className="h-5 w-5"
                    />
                  </div>
                  <div>
                    <p className="font-medium">{thread.category.name}</p>
                    <p className="text-sm text-muted-foreground">View all threads</p>
                  </div>
                </Link>
              </CardContent>
            </Card>

            {/* Thread Stats */}
            <Card>
              <CardHeader>
                <h3 className="text-base font-semibold">Thread Statistics</h3>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Created:</span>
                  <span>{new Date(thread.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Replies:</span>
                  <span>{thread.replyCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Views:</span>
                  <span>{thread.viewCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Participants:</span>
                  <span>{new Set([thread.author.id, ...posts.map((p) => p.author.id)]).size}</span>
                </div>
              </CardContent>
            </Card>

            {/* Similar Threads */}
            <Card>
              <CardHeader>
                <h3 className="text-base font-semibold">Similar Threads</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    No similar threads found
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  )
}
