import React from "react";
import Link from "next/link";
import { Session } from "@/lib/auth";
import { format } from "date-fns";
import { CalendarDays, Edit, Flag, Globe, Mail, MapPin, MessageCircle } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
}

interface UserProfileViewProps {
  session: Session | null;
  userData: UserData;
}

export function UserProfileView({ session, userData }: UserProfileViewProps) {
  const isOwnProfile = session?.user?.id === userData.id;
  const isAdmin = session?.user?.role === "admin";
  const isModerator = session?.user?.role === "moderator" || isAdmin;
  const displayName = userData.displayUsername || userData.username || userData.name;
  const isStaff = userData.role === "admin" || userData.role === "moderator";
  
  return (
    <main className="container max-w-5xl py-6">
      <div className="mb-6 flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold">
          {displayName}&apos;s Profile
        </h1>
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
            <Button variant="outline" size="sm">
              <MessageCircle className="mr-2 h-4 w-4" />
              Send Message
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
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* User Info Card */}
        <div className="md:col-span-1">
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-24" />
            <div className="relative px-4">
              <Avatar className="absolute -top-12 h-24 w-24 border-4 border-background">
                <AvatarImage src={userData.image || ""} alt={userData.name} />
                <AvatarFallback className="text-xl">
                  {userData.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {isStaff && (
                <div className="absolute -top-6 left-24">
                  <Badge variant={userData.role === "admin" ? "default" : "secondary"} className="capitalize">
                    {userData.role}
                  </Badge>
                </div>
              )}
            </div>
            <CardHeader className="mt-12 pt-0">
              <CardTitle>{displayName}</CardTitle>
              <CardDescription>{userData.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {userData.bio && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Bio</h3>
                  <p className="text-sm text-muted-foreground">{userData.bio}</p>
                </div>
              )}
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Info</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    Joined {format(new Date(userData.createdAt), "MMMM yyyy")}
                  </div>
                  {userData.location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {userData.location}
                    </div>
                  )}
                  {userData.website && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Globe className="h-4 w-4" />
                      <a 
                        href={userData.website.startsWith('http') ? userData.website : `https://${userData.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {userData.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                  {(isOwnProfile || isModerator) && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      {userData.email}
                    </div>
                  )}
                </div>
              </div>
              
              {userData.signature && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Signature</h3>
                    <p className="text-sm text-muted-foreground italic">{userData.signature}</p>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter>
              <div className="flex w-full justify-between">
                <div className="text-center">
                  <p className="text-2xl font-bold">{userData.reputation}</p>
                  <p className="text-xs text-muted-foreground">Reputation</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{userData.threadCount}</p>
                  <p className="text-xs text-muted-foreground">Threads</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{userData.postCount}</p>
                  <p className="text-xs text-muted-foreground">Posts</p>
                </div>
              </div>
            </CardFooter>
          </Card>
        </div>
        
        {/* Activity Tabs */}
        <div className="md:col-span-2">
          <Tabs defaultValue="threads">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="threads">Threads</TabsTrigger>
              <TabsTrigger value="posts">Recent Posts</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>
            <TabsContent value="threads" className="mt-4 space-y-4">
              {userData.threadCount === 0 ? (
                <Card>
                  <CardContent className="py-6 text-center text-muted-foreground">
                    No threads created yet.
                  </CardContent>
                </Card>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Thread listing will be implemented here.
                </p>
              )}
            </TabsContent>
            <TabsContent value="posts" className="mt-4 space-y-4">
              {userData.postCount === 0 ? (
                <Card>
                  <CardContent className="py-6 text-center text-muted-foreground">
                    No posts created yet.
                  </CardContent>
                </Card>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Recent posts will be displayed here.
                </p>
              )}
            </TabsContent>
            <TabsContent value="activity" className="mt-4 space-y-4">
              <Card>
                <CardContent className="py-6 text-center text-muted-foreground">
                  User activity feed will be displayed here.
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  );
}