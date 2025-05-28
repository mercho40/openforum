"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"
import { createPost, updatePost, deletePost, votePost } from "@/actions/post"
import { subscribeToThreadAction, unsubscribeFromThreadAction, checkThreadSubscription } from "@/actions/subscription"
import { updateThread, deleteThread } from "@/actions/thread"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import {
  MessageSquare, Menu, Home, Tag, Grid3X3, Users, Search, Bell, User, Settings, LogOut,
  LogIn, UserPlus, X, ChevronUp, ChevronDown, Minus, MoreHorizontal, Edit3, Trash2,
  Flag, Share2, Lock, Pin, Eye, Calendar, Clock, Hash, Star, BookmarkPlus, BookmarkCheck,
  ChevronLeft, ChevronRight
} from "lucide-react"
import { Session } from "@/lib/auth"
import { CategoryIcon } from "@/components/forum/CategoryIcon"

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
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [threadTitle, setThreadTitle] = useState(thread.title)
  const [isEditingTitle, setIsEditingTitle] = useState(false)

  const isAuthenticated = !!session
  const isAdmin = isAuthenticated && session.user.role === "admin"
  const isThreadAuthor = isAuthenticated && thread.author.id === session.user.id

  // Check subscription status on component mount
  React.useEffect(() => {
    if (isAuthenticated) {
      checkSubscriptionStatus()
    }
  }, [isAuthenticated, thread.id])

  const checkSubscriptionStatus = async () => {
    setIsCheckingSubscription(true)
    try {
      const result = await checkThreadSubscription(thread.id)
      if (result.success) {
        setIsSubscribed(result.isSubscribed)
      }
    } catch (error) {
      console.error("Error checking subscription:", error)
    } finally {
      setIsCheckingSubscription(false)
    }
  }

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

  const handleSubscriptionToggle = async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to subscribe")
      return
    }

    try {
      const result = isSubscribed 
        ? await unsubscribeFromThreadAction(thread.id)
        : await subscribeToThreadAction(thread.id)

      if (result.success) {
        setIsSubscribed(!isSubscribed)
        toast.success(isSubscribed ? "Unsubscribed from thread" : "Subscribed to thread")
      } else {
        toast.error(result.error || "Failed to update subscription")
      }
    } catch (error) {
      console.error(error)
      toast.error("An unexpected error occurred")
    }
  }

  const handleBookmarkToggle = () => {
    // For now, just toggle the state. In a real app, you'd save to localStorage or database
    setIsBookmarked(!isBookmarked)
    toast.success(isBookmarked ? "Removed from bookmarks" : "Added to bookmarks")
  }

  const handleShareThread = async () => {
    const url = `${window.location.origin}/forum/categories/${categorySlug}/threads/${thread.slug}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: thread.title,
          url: url
        })
      } catch (error) {
        // User cancelled or error occurred
      }
    } else {
      try {
        await navigator.clipboard.writeText(url)
        toast.success("Thread URL copied to clipboard")
      } catch (error) {
        toast.error("Failed to copy URL")
      }
    }
  }

  const handlePinThread = async () => {
    if (!isAdmin) return

    try {
      const result = await updateThread(thread.id, { isPinned: !thread.isPinned })
      if (result.success) {
        toast.success(thread.isPinned ? "Thread unpinned" : "Thread pinned")
        router.refresh()
      } else {
        toast.error(result.error || "Failed to update thread")
      }
    } catch (error) {
      console.error(error)
      toast.error("An unexpected error occurred")
    }
  }

  const handleLockThread = async () => {
    if (!isAdmin) return

    try {
      const result = await updateThread(thread.id, { isLocked: !thread.isLocked })
      if (result.success) {
        toast.success(thread.isLocked ? "Thread unlocked" : "Thread locked")
        router.refresh()
      } else {
        toast.error(result.error || "Failed to update thread")
      }
    } catch (error) {
      console.error(error)
      toast.error("An unexpected error occurred")
    }
  }

  const handleDeleteThread = async () => {
    try {
      const result = await deleteThread(thread.id)
      if (result.success) {
        toast.success("Thread deleted successfully")
        router.push(`/forum/categories/${categorySlug}`)
      } else {
        toast.error(result.error || "Failed to delete thread")
      }
    } catch (error) {
      console.error(error)
      toast.error("An unexpected error occurred")
    }
  }

  const handleEditTitle = async () => {
    if (!threadTitle.trim() || threadTitle === thread.title) {
      setIsEditingTitle(false)
      setThreadTitle(thread.title)
      return
    }

    try {
      const result = await updateThread(thread.id, { title: threadTitle })
      if (result.success) {
        setIsEditingTitle(false)
        toast.success("Thread title updated")
        router.refresh()
      } else {
        toast.error(result.error || "Failed to update title")
        setThreadTitle(thread.title)
      }
    } catch (error) {
      console.error(error)
      toast.error("An unexpected error occurred")
      setThreadTitle(thread.title)
    } finally {
      setIsEditingTitle(false)
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

  const startEditingPost = (post: Post) => {
    setEditingPostId(post.id)
    setEditContent(post.content)
  }

  const cancelEditingPost = () => {
    setEditingPostId(null)
    setEditContent("")
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
                    <Button variant="ghost" size="icon" className="relative">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={session.user.image || ""} alt={session.user.name || ""} />
                        <AvatarFallback>
                          {session.user.name?.charAt(0).toUpperCase() || <User className="h-4 w-4" />}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link href="/forum/profile" className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/forum/settings" className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
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
                      {thread.isPinned && (
                        <Badge variant="secondary" className="text-amber-600">
                          <Pin className="h-3 w-3 mr-1" />
                          Pinned
                        </Badge>
                      )}
                      {thread.isLocked && (
                        <Badge variant="outline" className="text-red-600">
                          <Lock className="h-3 w-3 mr-1" />
                          Locked
                        </Badge>
                      )}
                    </div>

                    {isEditingTitle ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={threadTitle}
                          onChange={(e) => setThreadTitle(e.target.value)}
                          className="text-xl font-bold"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleEditTitle()
                            if (e.key === 'Escape') {
                              setIsEditingTitle(false)
                              setThreadTitle(thread.title)
                            }
                          }}
                          autoFocus
                        />
                        <Button size="sm" onClick={handleEditTitle}>Save</Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => {
                            setIsEditingTitle(false)
                            setThreadTitle(thread.title)
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <h1 
                        className="text-2xl font-bold cursor-pointer hover:text-primary"
                        onClick={() => {
                          if (isThreadAuthor || isAdmin) {
                            setIsEditingTitle(true)
                          }
                        }}
                      >
                        {thread.title}
                        {(isThreadAuthor || isAdmin) && (
                          <Edit3 className="h-4 w-4 ml-2 inline opacity-50" />
                        )}
                      </h1>
                    )}

                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={thread.author.image || ""} alt={thread.author.name || ""} />
                          <AvatarFallback className="text-xs">
                            {thread.author.name?.charAt(0).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span>{thread.author.name}</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(thread.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    {thread.tags && thread.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {thread.tags.map(({ tag }) => (
                          <Badge 
                            key={tag.id} 
                            variant="secondary"
                            style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                          >
                            <Hash className="h-3 w-3 mr-1" />
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Thread Actions Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleShareThread}>
                        <Share2 className="mr-2 h-4 w-4" />
                        Share Thread
                      </DropdownMenuItem>
                      {isAuthenticated && (
                        <>
                          <DropdownMenuItem onClick={handleBookmarkToggle}>
                            {isBookmarked ? (
                              <>
                                <BookmarkCheck className="mr-2 h-4 w-4" />
                                Remove Bookmark
                              </>
                            ) : (
                              <>
                                <BookmarkPlus className="mr-2 h-4 w-4" />
                                Add Bookmark
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Flag className="mr-2 h-4 w-4" />
                            Report Thread
                          </DropdownMenuItem>
                        </>
                      )}
                      {isAdmin && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={handlePinThread}>
                            <Pin className="mr-2 h-4 w-4" />
                            {thread.isPinned ? "Unpin" : "Pin"} Thread
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={handleLockThread}>
                            <Lock className="mr-2 h-4 w-4" />
                            {thread.isLocked ? "Unlock" : "Lock"} Thread
                          </DropdownMenuItem>
                        </>
                      )}
                      {(isThreadAuthor || isAdmin) && (
                        <>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Thread
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Thread</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this thread? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteThread} className="bg-red-600 hover:bg-red-700">
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
            </Card>

            {/* Posts */}
            <div className="space-y-4">
              {posts.map((post, index) => (
                <Card key={post.id} className={`${index === 0 ? "border-primary/20" : ""}`}>
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      {/* Vote Controls */}
                      <div className="flex flex-col items-center gap-1 pt-2">
                        <Button
                          variant={getUserVote(post) === 1 ? "default" : "ghost"}
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleVote(post.id, getUserVote(post) === 1 ? 0 : 1)}
                          disabled={votingPostId === post.id || !isAuthenticated}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-medium px-2 py-1 bg-muted rounded">
                          {getPostScore(post)}
                        </span>
                        <Button
                          variant={getUserVote(post) === -1 ? "destructive" : "ghost"}
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleVote(post.id, getUserVote(post) === -1 ? 0 : -1)}
                          disabled={votingPostId === post.id || !isAuthenticated}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Post Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={post.author.image || ""} alt={post.author.name || ""} />
                              <AvatarFallback className="text-xs">
                                {post.author.name?.charAt(0).toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{post.author.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {post.author.reputation && (
                                  <span className="mr-2">
                                    <Star className="h-3 w-3 inline mr-1" />
                                    {post.author.reputation}
                                  </span>
                                )}
                                <Clock className="h-3 w-3 inline mr-1" />
                                {new Date(post.createdAt).toLocaleString()}
                                {post.isEdited && post.editedAt && (
                                  <span className="ml-2 text-muted-foreground">
                                    (edited {new Date(post.editedAt).toLocaleDateString()})
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Post Actions */}
                          {isAuthenticated && (post.author.id === session.user.id || isAdmin) && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => startEditingPost(post)}>
                                  <Edit3 className="mr-2 h-4 w-4" />
                                  Edit Post
                                </DropdownMenuItem>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete Post
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Post</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete this post? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction 
                                        onClick={() => handleDeletePost(post.id)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>

                        {/* Post Content or Edit Form */}
                        {editingPostId === post.id ? (
                          <div className="space-y-3">
                            <Textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="min-h-[120px]"
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleEditPost(post.id)}>
                                Save Changes
                              </Button>
                              <Button size="sm" variant="outline" onClick={cancelEditingPost}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="prose prose-sm max-w-none">
                            <p className="whitespace-pre-wrap">{post.content}</p>
                          </div>
                        )}

                        {/* Author Signature */}
                        {post.author.signature && !post.isDeleted && (
                          <div className="mt-4 pt-3 border-t text-xs text-muted-foreground">
                            <div className="italic">{post.author.signature}</div>
                          </div>
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
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={pagination.page <= 1}
                  asChild={pagination.page > 1}
                >
                  {pagination.page > 1 ? (
                    <Link href={`?page=${pagination.page - 1}`}>
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Link>
                  ) : (
                    <span>
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </span>
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
                          <Link href={`?page=${pageNum}`}>{pageNum}</Link>
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
                    <Link href={`?page=${pagination.page + 1}`}>
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  ) : (
                    <span>
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </span>
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
                      disabled={!replyContent.trim()}
                    >
                      Clear
                    </Button>
                    <Button 
                      onClick={handleReply} 
                      disabled={isSubmittingReply || !replyContent.trim()}
                    >
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
                    <span className="font-medium">This thread is locked</span>
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
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={handleSubscriptionToggle}
                    disabled={isCheckingSubscription}
                  >
                    <Bell className="mr-2 h-4 w-4" />
                    {isSubscribed ? "Unsubscribe" : "Subscribe"}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={handleBookmarkToggle}
                  >
                    {isBookmarked ? (
                      <>
                        <BookmarkCheck className="mr-2 h-4 w-4" />
                        Bookmarked
                      </>
                    ) : (
                      <>
                        <BookmarkPlus className="mr-2 h-4 w-4" />
                        Bookmark
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={handleShareThread}
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
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
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-medium"
                    style={{ backgroundColor: thread.category.color || "#6b7280" }}
                  >
                    <CategoryIcon
                      iconName={thread.category.iconClass}
                      color="white"
                      size="md"
                    />
                  </div>
                  <div>
                    <div className="font-medium">{thread.category.name}</div>
                    <div className="text-sm text-muted-foreground">View category</div>
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
                  <span className="text-muted-foreground">Views</span>
                  <span className="font-medium">{thread.viewCount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Replies</span>
                  <span className="font-medium">{thread.replyCount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Created</span>
                  <span className="font-medium">{new Date(thread.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Author</span>
                  <span className="font-medium">{thread.author.name}</span>
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
                  <p className="text-sm text-muted-foreground">
                    No similar threads found.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  )
}
