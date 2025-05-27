"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { ArrowRight, ArrowLeft, Upload, User, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Label } from "../ui/label"
import { updateUserProfile, markProfileSetupSeen } from "@/actions/user"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Image from "next/image"
import { Session } from "@/lib/auth"

type Step = "bio" | "avatar" | "welcome"

export function CompleteProfileForm({ session }: { session: Session }) {
  const [currentStep, setCurrentStep] = useState<Step>("bio")
  const [bio, setBio] = useState("")
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

      // Skip sending data if both bio and avatar are empty
      if (!bio.trim() && !avatarPreview) {
        setCurrentStep("welcome")
        setLoading(false)
        return
      }
      
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
    <Card className="w-full max-w-[95%] sm:max-w-md shadow-none bg-card/0 border-border/0">
      <CardHeader className="space-y-3 sm:space-y-6 pb-2 sm:pb-4">
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Complete Your Profile</h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
            {currentStep === "bio" && "Tell us a bit about yourself"}
            {currentStep === "avatar" && "Add a profile picture"}
            {currentStep === "welcome" && "Welcome to OpenForum!"}
          </p>
        </div>

        {/* Progress indicator */}
        {currentStep !== "welcome" && (
          <div className="flex justify-center gap-2 pt-2 sm:pt-4">
            <div className={cn("h-1.5 sm:h-2 w-12 sm:w-16 rounded-full", currentStep === "bio" ? "bg-primary" : "bg-primary/30")} />
            <div className={cn("h-1.5 sm:h-2 w-12 sm:w-16 rounded-full", currentStep === "avatar" ? "bg-primary" : "bg-primary/30")} />
          </div>
        )}
      </CardHeader>

      <CardContent className="relative overflow-hidden px-3 sm:px-6" style={{ minHeight: "240px" }}>
        <div className="flex flex-nowrap w-[300%] transition-all duration-500 ease-in-out" style={{ transform: `translateX(${getStepIndex(currentStep) * -33.333}%)` }}>
          {/* Bio Step */}
          <div 
            className={`w-1/3 px-0.5 transition-all duration-500 ease-in-out ${currentStep !== "bio" ? "opacity-0 pointer-events-none" : "opacity-100"}`}
            tabIndex={currentStep !== "bio" ? -1 : undefined}
            inert={currentStep !== "bio" ? true : undefined}
          >
            <div className="flex flex-col space-y-1 sm:space-y-2">
              <label className="font-semibold text-foreground text-sm sm:text-base" htmlFor="bio">
                Biography
              </label>
              <Textarea
                id="bio"
                placeholder="Tell us about yourself..."
                className="bg-card/30 backdrop-blur-sm border border-border/10 min-h-24 sm:min-h-32 resize-none text-sm sm:text-base"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">This will be displayed on your profile. You can change this later.</p>
            </div>
          </div>

          {/* Avatar Step */}
          <div 
            className={`w-1/3 px-0.5 transition-all duration-500 ease-in-out ${currentStep !== "avatar" ? "opacity-0 pointer-events-none" : "opacity-100"}`}
            tabIndex={currentStep !== "avatar" ? -1 : undefined}
            inert={currentStep !== "avatar" ? true : undefined}
            >
            <div className="flex flex-col items-center space-y-4 sm:space-y-6">
              <div className="relative">
                {avatarPreview ? (
                  <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full overflow-hidden border-2 border-primary">
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
                    <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full bg-card/50 border-2 border-dashed border-border flex items-center justify-center">
                      <User className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground" />
                    </div>
                  </Label>
                )}
                
                <div className="absolute bottom-0 right-0 h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-primary flex items-center justify-center cursor-pointer">
                  {avatarPreview ? (
                    <button 
                      onClick={handleRemoveAvatar} 
                      className="w-full h-full flex items-center justify-center"
                      aria-label="Remove avatar"
                    >
                      <X className="h-3 w-3 sm:h-4 sm:w-4 text-primary-foreground" />
                    </button>
                  ) : (
                    <Label htmlFor="avatar-upload" className="w-full h-full flex items-center justify-center cursor-pointer">
                      <Upload className="h-3 w-3 sm:h-4 sm:w-4 text-primary-foreground" />
                    </Label>
                  )}
                </div>
                <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </div>

              <div className="text-center">
                <p className="font-medium text-sm sm:text-base">Upload a profile picture</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">Choose a square image for best results</p>
              </div>
            </div>
          </div>

          {/* Welcome Step */}
          <div 
            className={`w-1/3 px-0.5 transition-all duration-500 ease-in-out text-center ${currentStep !== "welcome" ? "opacity-0 pointer-events-none" : "opacity-100"}`}
            tabIndex={currentStep !== "welcome" ? -1 : undefined}
            inert={currentStep !== "welcome" ? true : undefined}
            >
            <div className="flex flex-col items-center space-y-4 sm:space-y-6">
              <div className="h-16 w-16 sm:h-24 sm:w-24 rounded-full bg-primary/10 flex items-center justify-center">
                <Check className="h-8 w-8 sm:h-12 sm:w-12 text-primary" />
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-bold">Welcome to OpenForum!</h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                  Your account has been successfully created and your profile is complete. You&apos;re all set to start
                  exploring our community.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between pt-3 sm:pt-6 px-3 sm:px-6">
        {currentStep !== "welcome" ? (
          <>
            {currentStep === "bio" ? (
              <div />
            ) : (
              <Button variant="outline" onClick={handleBack} className="flex items-center p-2 h-auto" disabled={loading}>
                <ArrowLeft className="h-4 w-4" />
                <span className="ml-1 sm:ml-2 text-sm">Back</span>
              </Button>
            )}
            <Button 
              onClick={handleNext} 
              className="bg-primary text-background hover:bg-primary/60 p-2 h-auto" 
              disabled={loading}>
              {loading ? "Saving..." : (
                currentStep === "bio" 
                  ? (bio.trim() ? "Next" : "Skip") 
                  : (avatarPreview ? "Finish" : "Skip")
              )}
              {!loading && <ArrowRight className="ml-1 sm:ml-2 h-4 w-4" />}
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