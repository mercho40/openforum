"use client"
import { fetchUserProfile } from "@/actions/user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient, useSession } from "@/lib/auth-client";
import { SearchIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Page() {
  const { data: session } = useSession();

  const handleSignOut = () => {
    authClient.signOut();
  }

  // Update the type to match what's actually available in the session user object
  const [userProfileData, setUserProfileData] = useState<{
    image?: string | null;
    bio?: string | null;
    name?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  } | null>(null);

  useEffect(() => {
    if (session?.user) {
      // First set basic user data from session
      setUserProfileData(session.user);
      
      // Then fetch complete profile with bio
      const loadUserProfile = async () => {
        try {
          const profileData = await fetchUserProfile();
          if (profileData && profileData.user) {
            setUserProfileData(prev => ({
              ...prev,
              ...profileData.user,
              bio: profileData.user.bio,
              image: profileData.user.image,
            }));
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      };
      
      loadUserProfile();
    }
  }, [session]);

  return (
    <>
      <header className="w-full h-auto py-4 px-6 flex items-center justify-between border-b-2 border-b-muted-foreground/20">
        <div className="flex items-center justify-start w-full">
          <h1 className="text-2xl font-bold">OpenForum</h1>
        </div>
        <div className="relative w-full h-full hidden md:block">
          <Input
            className="peer ps-9 pe-9 rounded-full"
            placeholder="Search..."
            type="search"
          />
          <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
            <SearchIcon size={16} />
          </div>
          <button
            className="text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md transition-[color,box-shadow] outline-none focus:z-10 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Submit search"
            type="submit"
          >
          </button>
        </div>
        <div className="flex items-center justify-end w-full">
          {!session ? (
            <Button variant="default" className="rounded-full font-semibold" asChild>
              <Link href="/auth/signin">
                Sign In
              </Link>
            </Button>
          ) : (
            <Button
              onClick={handleSignOut}
              className="rounded-full font-semibold"
              variant="outline"
              size="sm"
            >
              Sign Out
            </Button>
          )}
        </div>
      </header>
      <main className="flex h-full w-full p-4 items-center justify-center">
        {session ? (
          <div className="max-w-md w-full bg-card rounded-lg shadow-md overflow-hidden border border-border">
            <div className="p-6">
              <div className="flex items-center gap-4">
                {userProfileData?.image ? (
                  <Image
                    width={80}
                    height={80}
                    src={userProfileData.image}
                    alt="User Profile"
                    className="w-20 h-20 rounded-full object-cover border-2 border-primary/20"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-2xl font-medium text-muted-foreground">
                      {session.user.name?.charAt(0) || session.user.email?.charAt(0) || "?"}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <h2 className="text-xl font-semibold">{session.user.name || "User"}</h2>
                  <p className="text-muted-foreground text-sm">{session.user.email}</p>
                  <div className="flex items-center mt-1.5">
                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${session.user.emailVerified ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                    <span className="text-xs font-medium">
                      {session.user.emailVerified ? "Verified Account" : "Verification Pending"}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="font-medium text-sm uppercase text-muted-foreground tracking-wide mb-2">About</h3>
                <div className="bg-muted/40 p-3 rounded-md">
                  {userProfileData?.bio ? (
                    <p className="text-foreground/90">{userProfileData.bio}</p>
                  ) : (
                    <p className="text-muted-foreground italic">No bio available. Complete your profile to add a bio.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-md w-full bg-card rounded-lg shadow-md overflow-hidden border border-border p-6 text-center">
            <h2 className="text-xl font-semibold mb-4">Welcome to OpenForum</h2>
            <p className="text-muted-foreground mb-6">Join the discussion by signing in to your account</p>
            <Button className="rounded-full" asChild>
              <Link href="/auth/signin">Get Started</Link>
            </Button>
          </div>
        )}
      </main>
    </>
  );
}
