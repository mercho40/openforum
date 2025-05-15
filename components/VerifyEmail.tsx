"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Mail, ArrowRight } from 'lucide-react'
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface VerifyEmailProps {
  email: string
  onVerificationComplete?: () => void
}

export function VerifyEmail({ email, onVerificationComplete }: VerifyEmailProps) {
  const [isSending, setIsSending] = useState(false)
  const [isCodeSent, setIsCodeSent] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [otpCode, setOtpCode] = useState("")
  const [otpInputs, setOtpInputs] = useState(["", "", "", "", "", ""])

  const handleSendCode = async () => {
    setIsSending(true)
    
    try {
      // Simulate API call to send verification code
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Show OTP input after successful send
      setIsCodeSent(true)
      toast.success("Verification code sent to your email!")
    } catch (error) {
      console.error("Error sending verification code:", error)
      toast.error("Failed to send verification code. Please try again.")
    } finally {
      setIsSending(false)
    }
  }

  const handleVerifyCode = async () => {
    setIsVerifying(true)
    
    try {
      // Simulate API call to verify code
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Call the completion callback
      if (onVerificationComplete) {
        onVerificationComplete()
      }
    } catch (error) {
      console.error("Error verifying code:", error)
    } finally {
      setIsVerifying(false)
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
    setOtpCode(newOtpInputs.join(""))
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

  return (
    <Card className="w-full shadow-none backdrop-blur-sm bg-card/0 border-border/0">
      <CardHeader className="space-y-2 pb-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Verify Your Email</h1>
          <p className="text-muted-foreground mt-2">
            We need to verify your email address to continue
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center justify-center">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <p className="text-center text-muted-foreground">
            We&apos;ll send a verification code to <span className="font-medium text-foreground">{email}</span>
          </p>
        </div>

        {/* OTP Input Fields - Only shown after code is sent */}
        <div 
          className={cn(
            "transition-all duration-500 ease-in-out space-y-4",
            isCodeSent 
              ? "opacity-100 max-h-40 transform translate-y-0" 
              : "opacity-0 max-h-0 transform -translate-y-10 overflow-hidden"
          )}
        >
          <div className="text-center">
            <p className="font-medium">Enter the 6-digit code</p>
            <p className="text-sm text-muted-foreground mt-1">
              We sent a code to your email address
            </p>
          </div>
          
          <div className="flex justify-center gap-2">
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
                className="w-10 h-12 text-center text-lg font-medium bg-card/30 backdrop-blur-sm border border-border/10"
              />
            ))}
          </div>
          
          <div className="text-center">
            <button 
              type="button" 
              onClick={handleSendCode}
              className="text-sm text-primary hover:underline"
              disabled={isSending}
            >
              Didn&apos;t receive a code? Send again
            </button>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center pt-2">
        {/* Send Code Button - Hidden after code is sent */}
        <div 
          className={cn(
            "transition-all duration-500 ease-in-out w-full",
            !isCodeSent 
              ? "opacity-100 max-h-20" 
              : "opacity-0 max-h-0 overflow-hidden absolute"
          )}
        >
          <Button
            onClick={handleSendCode}
            className="w-full bg-primary text-background hover:bg-primary/60"
            disabled={isSending}
            size="lg"
          >
            {isSending ? "Sending..." : "Send Verification Code"}
          </Button>
        </div>
        
        {/* Verify Button - Only shown after code is sent */}
        <div 
          className={cn(
            "transition-all duration-500 ease-in-out w-full",
            isCodeSent 
              ? "opacity-100 max-h-20" 
              : "opacity-0 max-h-0 overflow-hidden absolute"
          )}
        >
          <Button
            onClick={handleVerifyCode}
            className="w-full bg-primary text-background hover:bg-primary/60"
            disabled={isVerifying || otpCode.length !== 6}
            size="lg"
          >
            {isVerifying ? "Verifying..." : "Verify Email"}
            {!isVerifying && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}