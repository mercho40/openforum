"use client"

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Session } from "@/lib/auth";
import { format, formatDistanceToNow } from "date-fns";
import { 
  CalendarDays, 
  Edit, 
  Flag, 
  Globe, 
  Mail, 
  MapPin, 
  MessageSquare, 
  Pin, 
  Lock, 
  Eye, 
  Heart,
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
  Grid3X3,
  Search
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { authClient } from "@/lib/auth-client";

interface Thread {
  id: string;
  title: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
  isPinned: boolean;
  isLocked: boolean;
  viewCount: number;
  replyCount: number;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  _count: {
    posts: number;
    likes: number;
  };
}

interface Post {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  thread: {
    id: string;
    title: string;
    slug: string;
    category: {
      id: string;
      name: string;
      slug: string;
    };
  } | null;
  _count: {
    likes: number;
  };
}

interface UserData {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  username?: string | null;
  displayUsername?: string | null;
  bio?: string | null;
  signature?: string | null;
  website?: string | null;
  location?: string | null;
  reputation: number;
  createdAt: Date;
  role?: string | null;
  threadCount: number;
  postCount: number;
  threads?: Thread[];
  posts?: Post[];
}

interface UserProfileViewProps {
  session: Session | null;
  userData: UserData;
}

export function UserProfileView({ session, userData }: UserProfileViewProps) {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const isAuthenticated = !!session;
  const isOwnProfile = session?.user?.id === userData.id;
  const isAdmin = session?.user?.role === "admin";
  const isModerator = session?.user?.role === "moderator" || isAdmin;
  const displayName = userData.displayUsername || userData.username || userData.name;
  const isStaff = userData.role === "admin" || userData.role === "moderator";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/forum/threads?search=${encodeURIComponent(searchQuery.trim())}&author=${userData.id}`);
    }
  };

  const handleLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/auth/signin");
        },
      },
    });
  };
  
  // Function to truncate content
  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  // Filter out posts with null/undefined threads
  const validPosts = userData.posts?.filter(post => post.thread && post.thread.category) || [];
  
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
      <main className="flex-1 container max-w-6xl py-6 px-4">
        <div className="mb-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {displayName}&apos;s Profile
            </h1>
            
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <Link href="/forum" className="hover:text-foreground">
                Forum
              </Link>
              <span>/</span>
              <Link href="/forum/members" className="hover:text-foreground">
                Members
              </Link>
              <span>/</span>
              <span className="text-foreground">{displayName}</span>
            </nav>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {isOwnProfile && (
              <Button variant="outline" size="sm" asChild>
                <Link href="/forum/settings">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Profile
                </Link>
              </Button>
            )}
            {!isOwnProfile && (
              <Button variant="ghost" size="sm">
                <Flag className="mr-2 h-4 w-4" />
                Report
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Search */}
        <form onSubmit={handleSearch} className="md:hidden mb-6">
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
        
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* User Info Card */}
          <div className="lg:col-span-1">
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-20 sm:h-24" />
              <div className="relative px-4">
                <Avatar className="absolute -top-10 sm:-top-12 h-20 w-20 sm:h-24 sm:w-24 border-4 border-background">
                  <AvatarImage src={userData.image || ""} alt={userData.name} />
                  <AvatarFallback className="text-lg sm:text-xl">
                    {userData.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {isStaff && (
                  <div className="absolute -top-4 sm:-top-6 left-20 sm:left-24">
                    <Badge variant={userData.role === "admin" ? "default" : "secondary"} className="capitalize text-xs">
                      {userData.role}
                    </Badge>
                  </div>
                )}
              </div>
              <CardHeader className="mt-10 sm:mt-12 pt-0">
                <CardTitle className="text-lg sm:text-xl break-words">{displayName}</CardTitle>
                <CardDescription className="break-words">{userData.name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {userData.bio && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Bio</h3>
                    <p className="text-sm text-muted-foreground break-words">{userData.bio}</p>
                  </div>
                )}
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Info</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarDays className="h-4 w-4 shrink-0" />
                      <span>Joined {format(new Date(userData.createdAt), "MMMM yyyy")}</span>
                    </div>
                    {userData.location && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 shrink-0" />
                        <span className="break-words">{userData.location}</span>
                      </div>
                    )}
                    {userData.website && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Globe className="h-4 w-4 shrink-0" />
                        <a 
                          href={userData.website.startsWith('http') ? userData.website : `https://${userData.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline break-all"
                        >
                          {userData.website.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    )}
                    {(isOwnProfile || isModerator) && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4 shrink-0" />
                        <span className="break-all">{userData.email}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {userData.signature && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Signature</h3>
                      <p className="text-sm text-muted-foreground italic break-words">{userData.signature}</p>
                    </div>
                  </>
                )}
              </CardContent>
              <CardFooter>
                <div className="flex w-full justify-between">
                  <div className="text-center">
                    <p className="text-xl sm:text-2xl font-bold">{userData.reputation}</p>
                    <p className="text-xs text-muted-foreground">Reputation</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl sm:text-2xl font-bold">{userData.threadCount}</p>
                    <p className="text-xs text-muted-foreground">Threads</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl sm:text-2xl font-bold">{userData.postCount}</p>
                    <p className="text-xs text-muted-foreground">Posts</p>
                  </div>
                </div>
              </CardFooter>
            </Card>
          </div>
          
          {/* Content Tabs */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="threads">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="threads" className="text-xs sm:text-sm">
                  Threads ({userData.threadCount})
                </TabsTrigger>
                <TabsTrigger value="posts" className="text-xs sm:text-sm">
                  Recent Posts ({validPosts.length > 5 ? "5" : validPosts.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="threads" className="mt-4 space-y-4">
                {userData.threads && userData.threads.length > 0 ? (
                  <div className="space-y-4">
                    {userData.threads.map((thread) => (
                      <Card key={thread.id} className="transition-colors hover:bg-muted/50">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                {thread.isPinned && (
                                  <Pin className="h-4 w-4 text-blue-500 shrink-0" />
                                )}
                                {thread.isLocked && (
                                  <Lock className="h-4 w-4 text-red-500 shrink-0" />
                                )}
                                <Badge variant="secondary" className="text-xs">
                                  {thread.category.name}
                                </Badge>
                              </div>
                              <CardTitle className="text-sm sm:text-base leading-tight">
                                <Link 
                                  href={`/forum/categories/${thread.category.slug}/threads/${thread.slug}`}
                                  className="hover:underline break-words"
                                >
                                  {thread.title}
                                </Link>
                              </CardTitle>
                            </div>
                          </div>
                        </CardHeader>
                        <CardFooter className="pt-0">
                          <div className="flex items-center justify-between w-full text-xs text-muted-foreground flex-wrap gap-2">
                            <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                              <div className="flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" />
                                <span>{thread.replyCount} replies</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                <span>{thread.viewCount} views</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Heart className="h-3 w-3" />
                                <span>{thread._count.likes} likes</span>
                              </div>
                            </div>
                            <time dateTime={thread.createdAt.toISOString()} className="shrink-0">
                              {formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}
                            </time>
                          </div>
                        </CardFooter>
                      </Card>
                    ))}
                    
                    {userData.threadCount > (userData.threads?.length || 0) && (
                      <div className="text-center pt-4">
                        <Button variant="outline" asChild>
                          <Link href={`/forum/threads?author=${userData.id}`}>
                            View All Threads
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      {isOwnProfile ? "You haven't created any threads yet." : `${displayName} hasn't created any threads yet.`}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="posts" className="mt-4 space-y-4">
                {validPosts.length > 0 ? (
                  <div className="space-y-4">
                    {validPosts.map((post) => (
                      <Card key={post.id} className="transition-colors hover:bg-muted/50">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs">
                                  {post.thread?.category?.name || "Unknown Category"}
                                </Badge>
                              </div>
                              <CardTitle className="text-sm leading-tight">
                                <span className="text-muted-foreground">Replied to: </span>
                                {post.thread ? (
                                  <Link 
                                    href={`/forum/categories/${post.thread.category.slug}/threads/${post.thread.slug}#post-${post.id}`}
                                    className="hover:underline break-words"
                                  >
                                    {post.thread.title}
                                  </Link>
                                ) : (
                                  <span className="text-muted-foreground italic">Deleted thread</span>
                                )}
                              </CardTitle>
                            </div>
                          </div>
                          <CardDescription className="text-sm break-words">
                            {truncateContent(post.content)}
                          </CardDescription>
                        </CardHeader>
                        <CardFooter className="pt-0">
                          <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Heart className="h-3 w-3" />
                              <span>{post._count.likes} likes</span>
                            </div>
                            <time dateTime={post.createdAt.toISOString()}>
                              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                            </time>
                          </div>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      {isOwnProfile ? "You haven't made any posts yet." : `${displayName} hasn't made any posts yet.`}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </>
  );
}