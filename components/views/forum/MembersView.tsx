import React from "react";
import Link from "next/link";
import { Session } from "@/lib/auth";
import { format } from "date-fns";
import { Search, Users, ArrowDownAZ, Clock, Award } from "lucide-react";
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
  const isAdmin = session?.user?.role === "admin";
  
  // Function to build search URL with current parameters
  const buildSearchUrl = (params: { page?: number; search?: string; sort?: string }) => {
    const url = new URL("/forum/members", window.location.origin);
    
    if (params.page && params.page > 1) {
      url.searchParams.set("page", params.page.toString());
    }
    
    if (params.search) {
      url.searchParams.set("search", params.search);
    }
    
    if (params.sort && params.sort !== "newest") {
      url.searchParams.set("sort", params.sort);
    }
    
    return url.pathname + url.search;
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
    <main className="container py-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold flex items-center">
            <Users className="mr-2 h-6 w-6" />
            Forum Members
          </h1>
          <p className="text-sm text-muted-foreground">
            Browse our community of {pagination.totalItems} members
          </p>
        </div>
      </div>
      
      {/* Search and filter bar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <form className="relative flex-1" action="/forum/members" method="get">
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {members.map((member) => (
            <Link key={member.id} href={`/forum/profile/${member.id}`}>
              <Card className="h-full overflow-hidden transition-colors hover:bg-muted/50">
                <CardHeader className="pb-2 pt-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.image || ""} alt={member.name} />
                      <AvatarFallback>
                        {member.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">
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
                  <div className="flex items-end justify-between">
                    <div>
                      {member.bio && (
                        <p className="line-clamp-2 text-xs text-muted-foreground">
                          {member.bio}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
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
  );
}