"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { EyeIcon, EyeOffIcon } from "lucide-react"
import { signIn } from "@/lib/auth-client"
import { toast } from "sonner"

export function LoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSignIn = async (callbackURL: string) => {
        try {
            setLoading(true)
            setError(null)
            
            await signIn.email(
                {
                    email,
                    password,
                    callbackURL,
                },
                {
                    onRequest: () => {
                        setLoading(true)
                    },
                    onResponse: () => {
                        setLoading(false)
                    },
                    onError: (ctx: { error: { message: string } }) => {
                        console.error("Sign-in error:", ctx.error.message);
                        setError(ctx.error.message);
                        toast.error(error || "Failed to sign in");
                        setLoading(false);
                    },
                    onSuccess: () => {
                        setLoading(false)
                        toast.success("Authentication successful")
                    }
                }
            )
        } catch (error) {
            console.error("Error during sign-in:", error)
            const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred"
            setError(errorMessage)
            toast.error(errorMessage)
            setLoading(false)
        } finally {
            setLoading(false)
        }
    }

    const handleSocialSignIn = async (provider: "github" | "google") => {
        try {
            setLoading(true);
            
            // Clear any previous errors
            setError(null);
            
            await signIn.social(
                {
                    provider,
                    // Use a consistent callback URL format
                    callbackURL: `/auth/callback?provider=${provider}`
                },
                {
                    onError: (ctx: { error: { message: string } }) => {
                        console.error("Social sign-in error:", ctx.error.message);
                        setError(ctx.error.message);
                        toast.error(ctx.error.message || "Failed to sign in");
                        setLoading(false);
                    }
                }
            );
        } catch (error: unknown) {
            console.error("Exception during social sign-in:", error);
            const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
            setError(errorMessage);
            toast.error(errorMessage);
            setLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-md shadow-none bg-card/0 border-border/0">
            <CardHeader className="space-y-6 pb-4">
                <div className="text-center">
                <h1 className="text-3xl font-bold tracking-tight">OpenForum</h1>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-col space-y-2">
                <label className="font-semibold text-foreground" htmlFor="email">
                    Email
                </label>
                <div className="relative">
                    <Input
                    id="email"
                    placeholder="email@domain.com"
                    type="email"
                    className="bg-card/30 backdrop-blur-sm border border-border/10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                </div>
                <div className="flex flex-col space-y-2">
                <label className="font-semibold text-foreground" htmlFor="password">
                    Password
                </label>
                <div className="relative">
                    <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Type your password"
                    className="bg-card/30 backdrop-blur-sm border border-border/10 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                    {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                    </button>
                </div>
                <div className="text-right">
                    <Link href="/auth/forgot-password" className="text-xs text-muted-foreground hover:text-foreground">
                    Forgot your password?
                    </Link>
                </div>
                </div>
                <Button 
                    className="w-full bg-primary text-background hover:bg-primary/60 cursor-pointer" 
                    size={"lg"}
                    onClick={
                        async () => await handleSignIn("/auth/callback?provider=email")
                    }
                    disabled={loading}
                >
                    {loading ? "Signing in..." : "Login"}
                </Button>
                <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border/20"></span>
                </div>
                <div className="relative flex justify-center text-xs">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
                </div>
                <div className="grid gap-2">
                    <Button
                        variant="outline" 
                        size={"lg"} 
                        className="bg-card/30 backdrop-blur-sm border-2 border-border/10 hover:bg-card/50 cursor-pointer"
                        onClick={() => handleSocialSignIn("google")}
                        disabled={loading}
                    >
                        <svg className="mr-1 h-4 w-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                            <path d="M1 1h22v22H1z" fill="none" />
                        </svg>
                        Continue with Google
                    </Button>
                    <Button
                        variant="outline" 
                        size={"lg"} 
                        className="bg-card/30 backdrop-blur-sm border-2 border-border/10 hover:bg-card/50 cursor-pointer"
                        onClick={() => handleSocialSignIn("github")}
                        disabled={loading}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="1em"
                            height="1em"
                            viewBox="0 0 24 24"
                            className="mr-1 h-4 w-4"
                        >
                            <path
                                fill="currentColor"
                                d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33c.85 0 1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"
                            />
                        </svg>
                        Continue with Github
                    </Button>
                </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 pt-0">
                <div className="text-center text-sm">
                <span className="text-muted-foreground">Don&apos;t have an account? </span>
                <Link href="/auth/signup" className="font-medium text-foreground hover:underline">
                    Sign Up
                </Link>
                </div>
                <div className="text-center text-xs text-muted-foreground">
                <p>
                    By continuing, you agree to OpenForum&apos;s{" "}
                    <Link href="#" className="underline hover:text-foreground">
                    Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="#" className="underline hover:text-foreground">
                    Privacy Policy
                    </Link>
                </p>
                </div>
            </CardFooter>
        </Card>
    )
}