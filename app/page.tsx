"use client"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "@/lib/auth-client";
import { SearchIcon } from "lucide-react";
import Link from "next/link";

export default function Page() {
  const { data: session } = useSession()

  return (
    <>
      <header className="w-full py-4 px-6 flex items-center justify-between border-b-2 border-b-muted-foreground/20">
        <div className="flex items-center justify-start w-full">
          <h1 className="text-2xl font-bold">OpenForum</h1>
        </div>
        <div className="relative w-full h-full">
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
          <Button variant="default" className="rounded-full font-semibold" asChild >
            <Link href="/auth/signin">
              Sign In
            </Link>
          </Button>
        </div>
      </header>
      <main className="h-full w-full">
        {/* Displays session info */}
        <div className="flex flex-col items-center justify-center h-full">
          {session ? (
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Welcome, {session.user.name}</h2>
              <p className="text-muted-foreground">You are logged in as {session.user.email}</p>
            </div>
          ) : (
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Welcome to OpenForum</h2>
              <p className="text-muted-foreground">Please sign in to continue</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
