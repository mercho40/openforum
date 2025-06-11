"use client"

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Session } from "@/lib/auth";
import { format } from "date-fns";
import { 
  Search, 
  Users, 
  ArrowDownAZ, 
  Clock, 
  Award,
  MessageSquare,
  Bell,
  User,
  LogOut,
  Settings,
  Menu,
  X,
  Home,
  Tag,
  LogIn,
  UserPlus,
  Grid3X3
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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { authClient } from "@/lib/auth-client";

interface Member {
  id: string;
  name: string;
  username?: string | null;
  displayUsername?: string | null;
  image?: string | null;
  bio?: string | null;
  reputation: number;
  createdAt: Date;
  role?: string | null;
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface MembersViewProps {
  session: Session | null;
  members: Member[];
  pagination: PaginationData;
  currentSearch: string;
  currentSort: string;
}

export function MembersView({ 
  session,
  members, 
  pagination, 
  currentSearch, 
  currentSort 
}: MembersViewProps) {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(currentSearch || "");

  const isAuthenticated = !!session;
  
  // Function to build search URL with current parameters
  const buildSearchUrl = (params: { page?: number; search?: string; sort?: string }) => {
    const searchParams = new URLSearchParams();
    
    if (params.page && params.page > 1) {
      searchParams.set("page", params.page.toString());
    }
    
    if (params.search) {
      searchParams.set("search", params.search);
    }
    
    if (params.sort && params.sort !== "newest") {
      searchParams.set("sort", params.sort);
    }
    
    const queryString = searchParams.toString();
    return `/forum/members${queryString ? `?${queryString}` : ''}`;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) {
      params.set("search", searchQuery.trim());
    }
    if (currentSort && currentSort !== "newest") {
      params.set("sort", currentSort);
    }
    router.push(`/forum/members${params.toString() ? `?${params.toString()}` : ''}`);
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
  
  // Get sort icon
  const getSortIcon = () => {
    switch (currentSort) {
      case "oldest":
        return <Clock className="h-4 w-4 rotate-180" />;
      case "name":
        return <ArrowDownAZ className="h-4 w-4" />;
      case "reputation":
        return <Award className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };
  
  // Get sort label
  const getSortLabel = () => {
    switch (currentSort) {
      case "oldest":
        return "Oldest first";
      case "name":
        return "Name (A-Z)";
      case "reputation":
        return "Reputation";
      default:
        return "Newest first";
    }
  };

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
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium bg-muted text-foreground"
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
                className="text-sm font-medium text-foreground transition-colors hover:text-primary"
              >
                Members
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <form onSubmit={handleSearch} className="hidden md:flex relative w-full max-w-[200px] lg:max-w-[300px]">
              <Input
                type="search"
                placeholder="Search members..."
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
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold flex items-center">
              <Users className="mr-2 h-6 w-6" />
              Forum Members
            </h1>
            <p className="text-sm text-muted-foreground">
              Browse our community of {pagination.totalItems} members
            </p>
          </div>

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/forum" className="hover:text-foreground">
              Forum
            </Link>
            <span>/</span>
            <span className="text-foreground">Members</span>
          </nav>
        </div>
        
        {/* Search and filter bar */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row">
          <form onSubmit={handleSearch} className="relative flex-1 md:hidden">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </form>

          <form className="relative flex-1 hidden md:block" action="/forum/members" method="get">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              name="search"
              placeholder="Search members..."
              defaultValue={currentSearch}
              className="pl-8"
            />
            {currentSort !== "newest" && (
              <input type="hidden" name="sort" value={currentSort} />
            )}
          </form>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                {getSortIcon()}
                <span className="ml-2">{getSortLabel()}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link href={buildSearchUrl({ search: currentSearch, sort: "newest" })}>
                  <Clock className="mr-2 h-4 w-4" />
                  Newest first
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={buildSearchUrl({ search: currentSearch, sort: "oldest" })}>
                  <Clock className="mr-2 h-4 w-4 rotate-180" />
                  Oldest first
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={buildSearchUrl({ search: currentSearch, sort: "name" })}>
                  <ArrowDownAZ className="mr-2 h-4 w-4" />
                  Name (A-Z)
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={buildSearchUrl({ search: currentSearch, sort: "reputation" })}>
                  <Award className="mr-2 h-4 w-4" />
                  Reputation
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Members grid */}
        {members.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {members.map((member) => (
              <Link key={member.id} href={`/forum/profile/${member.id}`}>
                <Card className="h-full overflow-hidden transition-colors hover:bg-muted/50">
                  <CardHeader className="pb-2 pt-4 relative">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage src={member.image || ""} alt={member.name} />
                        <AvatarFallback>
                          {member.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-base truncate">
                          {member.displayUsername || member.username || member.name}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Joined {format(new Date(member.createdAt), "MMM yyyy")}
                        </CardDescription>
                      </div>
                    </div>
                    {member.role && (member.role === "admin" || member.role === "moderator") && (
                      <Badge variant={member.role === "admin" ? "default" : "secondary"} className="absolute right-3 top-3 capitalize">
                        {member.role}
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="flex items-end justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        {member.bio && (
                          <p className="line-clamp-2 text-xs text-muted-foreground">
                            {member.bio}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-medium">{member.reputation}</p>
                        <p className="text-xs text-muted-foreground">Reputation</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                {currentSearch
                  ? `No members found matching "${currentSearch}"`
                  : "No members found"}
              </p>
            </CardContent>
          </Card>
        )}
        
        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <Pagination className="mt-6">
            <PaginationContent>
              {pagination.hasPrevPage && (
                <PaginationItem>
                  <PaginationPrevious 
                    href={buildSearchUrl({ 
                      page: pagination.currentPage - 1, 
                      search: currentSearch, 
                      sort: currentSort 
                    })} 
                  />
                </PaginationItem>
              )}
              
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNumber: number;
                
                // Logic to show relevant page numbers centered around current page
                if (pagination.totalPages <= 5) {
                  pageNumber = i + 1;
                } else if (pagination.currentPage <= 3) {
                  pageNumber = i + 1;
                } else if (pagination.currentPage >= pagination.totalPages - 2) {
                  pageNumber = pagination.totalPages - 4 + i;
                } else {
                  pageNumber = pagination.currentPage - 2 + i;
                }
                
                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      href={buildSearchUrl({ 
                        page: pageNumber, 
                        search: currentSearch, 
                        sort: currentSort 
                      })}
                      isActive={pagination.currentPage === pageNumber}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              {pagination.hasNextPage && (
                <PaginationItem>
                  <PaginationNext 
                    href={buildSearchUrl({ 
                      page: pagination.currentPage + 1, 
                      search: currentSearch, 
                      sort: currentSort 
                    })} 
                  />
                </PaginationItem>
              )}
            </PaginationContent>
          </Pagination>
        )}
      </main>
    </>
  );
}