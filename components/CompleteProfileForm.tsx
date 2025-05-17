"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { ArrowRight, ArrowLeft, Upload, User, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Label } from "./ui/label"
import { updateUserProfile, markProfileSetupSeen } from "@/actions/user"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useSession } from "@/lib/auth-client"
import Image from "next/image"

type Step = "bio" | "avatar" | "welcome"

export function CompleteProfileForm() {
  const { data: session } = useSession()
  const [currentStep, setCurrentStep] = useState<Step>("bio")
  const [bio, setBio] = useState("")
  const [avatar, setAvatar] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Load user's existing avatar if available
  useEffect(() => {
    if (session?.user?.image) {
      setAvatarPreview(session.user.image)
    }
  }, [session])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setAvatar(file)

      // Create a preview
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setAvatarPreview(event.target.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleNext = async () => {
    if (currentStep === "bio") {
      setCurrentStep("avatar")
    } else if (currentStep === "avatar") {
      setLoading(true)
      
      try {
        // Update the user profile with bio and avatar
        const result = await updateUserProfile({ 
          bio: bio.trim() || undefined,
          image: avatarPreview ? avatarPreview : undefined
        })
        
        if (!result.success) {
          throw new Error(result.error || "Failed to update profile")
        }
        
        setCurrentStep("welcome")
      } catch (err) {
        console.error("Error saving profile:", err)
        toast.error("Failed to save profile. Please try again.")
      } finally {
        setLoading(false)
      }
    }
  }

  const handleBack = () => {
    if (currentStep === "avatar") {
      setCurrentStep("bio")
    }
  }

  const handleFinish = async () => {
    setLoading(true)
    try {
      // Mark that the user has seen the profile setup
      await markProfileSetupSeen()
      router.push("/")
    } catch (error) {
      console.error("Error completing profile setup:", error)
      toast.error("Failed to complete profile setup.")
      router.push("/")
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveAvatar = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setAvatar(null)
    setAvatarPreview(null)
  }

  // Helper function to determine step index for transitions
  const getStepIndex = (step: Step): number => {
    switch (step) {
      case "bio": return 0;
      case "avatar": return 1;
      case "welcome": return 2;
      default: return 0;
    }
  }

  return (
    <Card className="w-full max-w-md shadow-none backdrop-blur-sm bg-card/0 border-border/0">
      <CardHeader className="space-y-6 pb-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Complete Your Profile</h1>
          <p className="text-muted-foreground mt-2">
            {currentStep === "bio" && "Tell us a bit about yourself"}
            {currentStep === "avatar" && "Add a profile picture"}
            {currentStep === "welcome" && "Welcome to OpenForum!"}
          </p>
        </div>

        {/* Progress indicator */}
        {currentStep !== "welcome" && (
          <div className="flex justify-center gap-2 pt-4">
            <div className={cn("h-2 w-16 rounded-full", currentStep === "bio" ? "bg-primary" : "bg-primary/30")} />
            <div className={cn("h-2 w-16 rounded-full", currentStep === "avatar" ? "bg-primary" : "bg-primary/30")} />
          </div>
        )}
      </CardHeader>

      <CardContent className="relative overflow-hidden" style={{ minHeight: "280px" }}>
        <div className="flex flex-nowrap w-[300%]" style={{ transform: `translateX(${getStepIndex(currentStep) * -33.333}%)` }}>
          {/* Bio Step */}
          <div className={`w-1/3 px-0.5 transition-all duration-500 ease-in-out ${currentStep !== "bio" ? "opacity-0" : "opacity-100"}`}>
            <div className="flex flex-col space-y-2">
              <label className="font-semibold text-foreground" htmlFor="bio">
                Biography
              </label>
              <Textarea
                id="bio"
                placeholder="Tell us about yourself..."
                className="bg-card/30 backdrop-blur-sm border border-border/10 min-h-32 resize-none"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">This will be displayed on your public profile. You can change this later</p>
            </div>
          </div>

          {/* Avatar Step */}
          <div className={`w-1/3 px-0.5 transition-all duration-500 ease-in-out ${currentStep !== "avatar" ? "opacity-0" : "opacity-100"}`}>
            <div className="flex flex-col items-center space-y-6">
              <div className="relative">
                {avatarPreview ? (
                  <div className="h-32 w-32 rounded-full overflow-hidden border-2 border-primary">
                    <Image
                      width={128}
                      height={128}
                      src={avatarPreview || "/placeholder.svg"}
                      alt="Profile preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <Label 
                    className="cursor-pointer"
                    htmlFor="avatar-upload"
                  >
                    <div className="h-32 w-32 rounded-full bg-card/50 border-2 border-dashed border-border flex items-center justify-center">
                      <User className="h-16 w-16 text-muted-foreground" />
                    </div>
                  </Label>
                )}
                
                <div className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary flex items-center justify-center cursor-pointer">
                  {avatarPreview ? (
                    <button 
                      onClick={handleRemoveAvatar} 
                      className="w-full h-full flex items-center justify-center"
                      aria-label="Remove avatar"
                    >
                      <X className="h-4 w-4 text-primary-foreground" />
                    </button>
                  ) : (
                    <Label htmlFor="avatar-upload" className="w-full h-full flex items-center justify-center cursor-pointer">
                      <Upload className="h-4 w-4 text-primary-foreground" />
                    </Label>
                  )}
                </div>
                <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </div>

              <div className="text-center">
                <p className="font-medium">Upload a profile picture</p>
                <p className="text-sm text-muted-foreground mt-1">Choose a square image for best results.<br />You can change this later</p>
              </div>
            </div>
          </div>

          {/* Welcome Step */}
          <div className={`w-1/3 px-0.5 transition-all duration-500 ease-in-out text-center ${currentStep !== "welcome" ? "opacity-0" : "opacity-100"}`}>
            <div className="flex flex-col items-center space-y-6">
              <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
                <Check className="h-12 w-12 text-primary" />
              </div>

              <div>
                <h2 className="text-2xl font-bold">Welcome to OpenForum!</h2>
                <p className="text-muted-foreground mt-2">
                  Your account has been successfully created and your profile is complete. You&apos;re all set to start
                  exploring and connecting with our community.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between pt-6">
        {currentStep !== "welcome" ? (
          <>
            {currentStep === "bio" ? (
              <div />
            ) : (
              <Button variant="outline" onClick={handleBack} className="flex items-center" disabled={loading}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            )}
            <Button 
              onClick={handleNext} 
              className="bg-primary text-background hover:bg-primary/60" 
              disabled={loading}>
              {loading ? "Saving..." : (
                currentStep === "bio" 
                  ? (bio.trim() ? "Next" : "Skip") 
                  : (avatar ? "Finish" : "Skip")
              )}
              {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </>
        ) : (
          <Button 
            onClick={handleFinish} 
            className="w-full bg-primary text-background hover:bg-primary/60"
            disabled={loading}
          >
            {loading ? "Redirecting..." : "Get Started"}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}