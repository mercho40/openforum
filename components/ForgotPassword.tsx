"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Mail, Check, EyeIcon, EyeOffIcon, KeyRound } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"

interface ForgotPasswordProps {
  email?: string
  onForgotComplete?: () => void
}

export function ForgotPassword({ email: initialEmail = "", onForgotComplete }: ForgotPasswordProps) {
  const [email, setEmail] = useState(initialEmail)
  const [isSending, setIsSending] = useState(false)
  const [isCodeSent, setIsCodeSent] = useState(false)
  const [otpInputs, setOtpInputs] = useState(["", "", "", "", "", ""])
  const [resendOtpTimer, setResendOtpTimer] = useState(0)
  const [resendOtpDisabled, setResendOtpDisabled] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  const getOtpCode = () => otpInputs.join("")

  // Password requirements
  const requirements = useMemo(
    () => [
      { id: "length", label: "At least 8 characters", met: password.length >= 8 },
      { id: "uppercase", label: "At least 1 uppercase letter", met: /[A-Z]/.test(password) },
      { id: "lowercase", label: "At least 1 lowercase letter", met: /[a-z]/.test(password) },
      { id: "number", label: "At least 1 number", met: /\d/.test(password) },
      { id: "special", label: "At least 1 special character", met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
    ],
    [password],
  )

  // Check if password meets all requirements
  const passwordMeetsRequirements = useMemo(() => {
    return requirements.every((req) => req.met)
  }, [requirements])

  // Check if passwords match
  const passwordsMatch = useMemo(() => {
    return password && confirmPassword ? password === confirmPassword : false
  }, [password, confirmPassword])

  // Clear repeat password input when password is cleared
  useEffect(() => {
    if (password === "") {
      setConfirmPassword("")
    }
  }, [password])

  const handleSendCode = async () => {
    if (!email) {
      toast.error("Please enter your email address")
      return
    }

    setIsSending(true)

    // Check if the resend timer is active
    if (resendOtpDisabled) {
      toast.error(`Please wait ${resendOtpTimer} seconds before resending the code.`)
      setIsSending(false)
      return
    }

    try {
      // Use auth client to send password reset OTP
      const response = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "forget-password",
      })

      if (response.error) {
        toast.error(response.error.message || "Failed to send reset code")
        throw new Error(response.error.message || "Failed to send reset code")
      }

      // Reset OTP inputs
      setOtpInputs(["", "", "", "", "", ""])

      // Show OTP input after successful send
      setIsCodeSent(true)
      toast.success("Reset code sent to your email!")

      // Start resend timer
      setResendOtpTimer(120)
      setResendOtpDisabled(true)
      const interval = setInterval(() => {
        setResendOtpTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            setResendOtpDisabled(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (error) {
      console.error("Error sending reset code:", error)
      toast.error(error instanceof Error ? error.message : "Failed to send reset code. Please try again.")
    } finally {
      setIsSending(false)
    }
  }

  const handleVerifyCode = async () => {
    const otpCode = getOtpCode()
    if (otpCode.length !== 6) return

    try {
      // Verify the OTP code
      const response = await authClient.emailOtp.resetPassword({
        email,
        otp: otpCode,
        password: "",
      })

      if (response.error) {
        toast.error(response.error.message || "Invalid verification code")
        throw new Error(response.error.message || "Invalid verification code")
      }

      toast.success("Code verified successfully!")
    } catch (error) {
      console.error("Error verifying code:", error)
      toast.error(error instanceof Error ? error.message : "Invalid verification code. Please try again.")
    }
  }

  // This function will now handle both verification and password reset
  const handleResetPassword = async () => {
    if (!passwordMeetsRequirements || !passwordsMatch) return
    const otpCode = getOtpCode()
    
    if (otpCode.length !== 6) {
      toast.error("Please enter the 6-digit verification code")
      return
    }

    setIsResetting(true)

    try {
      // Reset the password
      const response = await authClient.emailOtp.resetPassword({
        email,
        otp: otpCode,
        password,
      })

      if (response.error) {
        toast.error(response.error.message || "Failed to reset password")
        throw new Error(response.error.message || "Failed to reset password")
      }

      toast.success("Password reset successfully!")

      if (onForgotComplete) {
        onForgotComplete()
      }
    } catch (error) {
      console.error("Error resetting password:", error)
      toast.error(error instanceof Error ? error.message : "Failed to reset password. Please try again.")
    } finally {
      setIsResetting(false)
    }
  }
  
  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d+$/.test(value)) return

    // Update the specific input
    const newOtpInputs = [...otpInputs]
    newOtpInputs[index] = value

    // Auto-focus next input if current input is filled
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`)
      if (nextInput) {
        nextInput.focus()
      }
    }

    setOtpInputs(newOtpInputs)
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Move to previous input on backspace if current input is empty
    if (e.key === "Backspace" && !otpInputs[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`)
      if (prevInput) {
        prevInput.focus()
      }
    }
  }

  // Handle paste events for OTP
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, currentIndex: number) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text")

    // Check if pasted content contains only digits
    if (!/^\d+$/.test(pastedData)) return

    // Create new array for OTP inputs
    const newOtpInputs = [...otpInputs]

    // Fill inputs starting from current position
    for (let i = 0; i < pastedData.length && i + currentIndex < 6; i++) {
      newOtpInputs[i + currentIndex] = pastedData[i]
    }

    setOtpInputs(newOtpInputs)

    // Focus the next empty input or the last input if all are filled
    const nextEmptyIndex = newOtpInputs.findIndex((val, idx) => idx >= currentIndex && !val)
    const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : 5

    setTimeout(() => {
      const nextInput = document.getElementById(`otp-input-${focusIndex}`)
      if (nextInput) {
        nextInput.focus()
      }
    }, 0)

    // If all inputs are filled, auto-verify after a short delay
    if (!newOtpInputs.includes("")) {
      setTimeout(handleVerifyCode, 300)
    }
  }

  return (
    <Card className="w-full max-w-[95%] sm:max-w-md shadow-none bg-card/0 border-border/0">
      <CardHeader className="space-y-2 pb-2 sm:pb-4">
        <div className="text-center">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Reset Your Password</h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-xs sm:text-sm">
            {!isCodeSent
              ? "We'll send a verification code to reset your password"
              : "Enter the verification code and create a new password"}
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6 px-3 sm:px-6">
        {/* Email Input - Only shown before code is sent */}
        <div
          className={cn(
            "transition-all duration-500 ease-in-out",
            !isCodeSent
              ? "opacity-100 max-h-40 transform translate-y-0"
              : "opacity-0 max-h-0 transform -translate-y-10 overflow-hidden",
          )}
        >
          <div className="flex flex-col items-center justify-center">
            <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-primary/10 flex items-center justify-center mb-3 sm:mb-4">
              <Mail className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
            <div className="flex flex-col space-y-1 sm:space-y-2 w-full">
              <label className="font-semibold text-foreground text-sm sm:text-base" htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                className="bg-card/30 backdrop-blur-sm border border-border/10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isCodeSent}
              />
            </div>
          </div>
        </div>

        {/* Combined OTP and Password Fields - Shown after code is sent */}
        <div
          className={cn(
            "transition-all duration-500 ease-in-out space-y-4 sm:space-y-6",
            isCodeSent
              ? "opacity-100 max-h-[800px] transform translate-y-0"
              : "opacity-0 max-h-0 transform -translate-y-10 overflow-hidden",
          )}
        >
          {/* OTP Input Fields */}
          <div className="space-y-3 sm:space-y-4">
            <div className="text-center">
              <p className="font-medium text-sm sm:text-base">Enter the 6-digit code</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">We sent a code to {email}</p>
            </div>

            <div className="flex justify-center gap-1 sm:gap-2">
              {otpInputs.map((digit, index) => (
                <Input
                  key={index}
                  id={`otp-input-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={(e) => handlePaste(e, index)}
                  className={cn(
                    "w-8 h-10 sm:w-10 sm:h-12 text-center text-base sm:text-lg font-medium bg-card/30 backdrop-blur-sm border border-border/10 px-0",
                  )}
                />
              ))}
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={handleSendCode}
                className="text-xs sm:text-sm text-primary hover:underline"
                disabled={isSending || resendOtpDisabled}
              >
                {resendOtpDisabled ? `Resend in ${resendOtpTimer}s` : "Didn't receive a code?"}
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/30"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">New Password</span>
            </div>
          </div>

          {/* Password Fields */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col items-center justify-center">
              <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-primary/10 flex items-center justify-center mb-3 sm:mb-4">
                <KeyRound className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col space-y-1 sm:space-y-2">
              <label className="font-semibold text-foreground text-sm sm:text-base" htmlFor="password">
                New Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
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

              {/* Password requirements */}
              <div
                className={cn(
                  "mt-1 sm:mt-2 space-y-1 sm:space-y-2 text-xs sm:text-sm overflow-hidden transition-all duration-500 ease-in-out",
                  password.length > 0
                    ? "max-h-24 opacity-100 transform translate-y-0"
                    : "max-h-0 opacity-0 transform -translate-y-4",
                )}
              >
                {/* Progress bar */}
                <div className="flex w-full gap-1">
                  {Array(requirements.filter((req) => req.met).length)
                    .fill(0)
                    .map((_, i) => (
                      <div key={`met-${i}`} className="flex-1">
                        <div className="h-1.5 sm:h-2 rounded-md transition-colors duration-300 bg-green-500" />
                      </div>
                    ))}
                  {Array(requirements.filter((req) => !req.met).length)
                    .fill(0)
                    .map((_, i) => (
                      <div key={`unmet-${i}`} className="flex-1">
                        <div className="h-1.5 sm:h-2 rounded-md transition-colors duration-300 bg-red-500/30" />
                      </div>
                    ))}
                </div>

                {/* Single requirement text */}
                <div className="font-medium text-xs sm:text-sm">
                  {(() => {
                    const firstNotMet = requirements.find((req) => !req.met)
                    const reqToShow = firstNotMet || requirements[requirements.length - 1]

                    if (reqToShow.met) {
                      return <span className={"text-green-500"}>Password meets requirements</span>
                    }
                    return <span className={"text-muted-foreground"}>{reqToShow.label}</span>
                  })()}
                </div>
              </div>
            </div>

            {/* Confirm Password - only shows when password meets requirements */}
            <div
              className={cn(
                "flex flex-col space-y-1 sm:space-y-2 overflow-hidden transition-all duration-500 ease-in-out",
                passwordMeetsRequirements
                  ? "max-h-24 opacity-100 transform translate-y-0"
                  : "max-h-0 opacity-0 transform -translate-y-4",
              )}
            >
              <label className="font-semibold text-foreground text-sm sm:text-base" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  className={cn(
                    "bg-card/30 backdrop-blur-sm border border-border/10 pr-10",
                    confirmPassword && (passwordsMatch ? "border-green-500" : "border-red-500"),
                  )}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground cursor-pointer"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </button>
              </div>
              {confirmPassword && !passwordsMatch && <p className="text-xs sm:text-sm text-red-500">Passwords do not match</p>}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center pt-2 px-3 sm:px-6">
        <Button
          onClick={!isCodeSent ? handleSendCode : handleResetPassword}
          className="w-full bg-primary text-background hover:bg-primary/60"
          disabled={
            isSending || isResetting || 
            (isCodeSent && (!passwordMeetsRequirements || !passwordsMatch || getOtpCode().length !== 6)) ||
            (!isCodeSent && !email)
          }
          size="default"
        >
          <div className="relative flex items-center justify-center h-5">
            {/* Send Code State */}
            <span 
              className={cn(
                "absolute inset-0 flex items-center justify-center transition-all duration-300",
                !isCodeSent 
                  ? "transform translate-y-0 opacity-100" 
                  : "transform -translate-y-8 opacity-0"
              )}
            >
              {isSending ? "Sending..." : "Send Reset Code"}
            </span>
            
            {/* Reset Password State */}
            <span 
              className={cn(
                "absolute inset-0 flex items-center justify-center transition-all duration-300",
                isCodeSent 
                  ? "transform translate-y-0 opacity-100" 
                  : "transform translate-y-8 opacity-0"
              )}
            >
              {isResetting ? "Resetting..." : "Reset Password"}
              {!isResetting && <Check className="ml-2 h-4 w-4" />}
            </span>
          </div>
        </Button>
      </CardFooter>
    </Card>
  )
}
