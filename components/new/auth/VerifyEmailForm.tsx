"use client"

import { authClient } from "@/lib/auth-client"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { toast } from "sonner"
import { Mail, ArrowRight, Check } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { useTranslation } from "react-i18next"


interface VerifyEmailProps {
    email: string
    onVerificationComplete?: () => void
}

export function VerifyEmailForm({ email, onVerificationComplete }: VerifyEmailProps) {
    const [isSending, setIsSending] = useState(false)
    const [isCodeSent, setIsCodeSent] = useState(false)
    const [isVerifying, setIsVerifying] = useState(false)
    const [isVerified, setIsVerified] = useState(false)
    const [otpInputs, setOtpInputs] = useState(["", "", "", "", "", ""])
    const [resendOtpTimer, setResendOtpTimer] = useState(0)
    const [resendOtpDisabled, setResendOtpDisabled] = useState(false)
    const { t } = useTranslation("common")

    const getOtpCode = () => otpInputs.join("")

    const handleSendCode = async () => {
        setIsSending(true)

        // Check if the email is already verified
        const session = await authClient.getSession()
        if (session?.data?.user?.emailVerified) {
            toast.error(t("auth.verifyEmail.error.alreadyVerified"))
            setIsSending(false)
            setIsVerified(true)
            if (onVerificationComplete) {
                onVerificationComplete()
            }
            return
        }

        // Check if resend timer is active
        if (resendOtpTimer > 0 || resendOtpDisabled) {
            toast.error(`${t("auth.verifyEmail.error.resendWait1")}${resendOtpTimer}${t("auth.verifyEmail.error.resendWait2")}`)
            setIsSending(false)
            return
        }
        
        try {
            // Use Better Auth's emailOTP plugin to send verification code
            const response = await authClient.emailOtp.sendVerificationOtp({
                email,
                type: "email-verification",
            })

            if (response.error) {
                toast.error(response.error.message || t("auth.verifyEmail.error.failedToSend"))
                throw new Error(response.error.message || t("auth.verifyEmail.error.failedToSend"))
            }
            // Reset OTP inputs
            setOtpInputs(["", "", "", "", "", ""])

            // Show OTP input after successful send
            setIsCodeSent(true)
            toast.success(t("auth.verifyEmail.success.codeSent"))
            // Start resend timer
            // Set resend timer to 120 seconds
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
            console.error("Error sending verification code:", error)
            toast.error(error instanceof Error ? error.message : t("auth.verifyEmail.error.failedToSend"))
        } finally {
            setIsSending(false)
        }
    }

    const handleVerifyCode = async () => {
        const otpCode = getOtpCode();
        if (otpCode.length !== 6) return;
        
        setIsVerifying(true)
        
        try {
            await authClient.emailOtp.verifyEmail(
                {
                email,
                otp: otpCode,
                },
                {   
                    onRequest: () => {
                        setIsVerifying(true);
                    },
                    onResponse: () => {
                        setIsVerifying(false);
                    },
                    onError: (ctx: { error: { message: string } }) => {
                        toast.error(ctx.error.message ||t("auth.verifyEmail.error.verificationFailed"));
                        setIsVerifying(false);
                    },
                    onSuccess: async () => {
                        setIsVerifying(false);
                        // Fetch the session again to check if the email is verified
                        const session = await authClient.getSession();
                        if (session?.data?.user?.emailVerified) {
                            toast.success(t("auth.verifyEmail.success.verified.title"));
                            setIsVerified(true);
                            if (onVerificationComplete) {
                                onVerificationComplete();
                            }
                        }
                    },
                }
            )
        } catch (error) {
            console.error("Error verifying code:", error)
            toast.error(error instanceof Error ? error.message : t("auth.verifyEmail.error.invalidCode"))
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

    // Add this function to handle paste events
    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, currentIndex: number) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text');
        
        // Check if pasted content contains only digits
        if (!/^\d+$/.test(pastedData)) return;
        
        // Create new array for OTP inputs
        const newOtpInputs = [...otpInputs];
        
        // Fill inputs starting from current position
        for (let i = 0; i < pastedData.length && i + currentIndex < 6; i++) {
            newOtpInputs[i + currentIndex] = pastedData[i];
        }
        
        setOtpInputs(newOtpInputs);
        
        // Focus the next empty input or the last input if all are filled
        const nextEmptyIndex = newOtpInputs.findIndex((val, idx) => idx >= currentIndex && !val);
        const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : 5;
        
        setTimeout(() => {
            const nextInput = document.getElementById(`otp-input-${focusIndex}`);
            if (nextInput) {
                nextInput.focus();
            }
        }, 0);
        
        // If all inputs are filled, auto-verify after a short delay
        if (!newOtpInputs.includes('')) {
            setTimeout(handleVerifyCode, 300);
        }
    }

    return (
        <Card className="w-full max-w-[95%] sm:max-w-md shadow-none bg-card/0 border-border/0">
            <CardHeader className="space-y-2 pb-2 sm:pb-4">
                <div className="text-center">
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{t("auth.verifyEmail.form.texts.title")}</h1>
                    <p className="text-muted-foreground mt-1 sm:mt-2 text-xs sm:text-sm">
                        {t("auth.verifyEmail.form.texts.subtitle")}
                    </p>
                </div>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 px-3 sm:px-6">
                <div className="flex flex-col items-center justify-center">
                    <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-primary/10 flex items-center justify-center mb-3 sm:mb-4">
                        <Mail className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                    </div>
                    <p className={`text-center text-xs sm:text-sm text-muted-foreground transition-opacity duration-300
                        ${email ? "opacity-100" : "opacity-0"}
                        `}>
                        {t("auth.verifyEmail.form.texts.text1")} <span className="font-medium text-foreground">{email ? email : "youremail@domain.com"}</span>
                    </p>
                </div>
                {/* OTP Input Fields - Only shown after code is sent */}
                <div 
                    className={cn(
                        "transition-all duration-500 ease-in-out space-y-3 sm:space-y-4",
                        isCodeSent 
                        ? "opacity-100 max-h-40 transform translate-y-0" 
                        : "opacity-0 max-h-0 transform -translate-y-10 overflow-hidden"
                    )}
                >
                    <div className="text-center">
                        <p className="font-medium text-sm sm:text-base">{t("auth.verifyEmail.form.texts.text2")}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {t("auth.verifyEmail.form.texts.text3")}
                        </p>
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
                                isVerified && "border-green-500/50 bg-green-50/10"
                                )}
                                disabled={isVerified}
                            />
                        ))}
                    </div>
                    <div className="text-center">
                        {!isVerified && (
                            <button 
                                type="button" 
                                onClick={handleSendCode}
                                className={cn(
                                "text-xs sm:text-sm hover:underline",
                                resendOtpDisabled 
                                    ? "text-muted-foreground cursor-not-allowed opacity-70" 
                                    : "text-primary cursor-pointer"
                                )}
                                disabled={isSending || isVerified || resendOtpDisabled}
                            >
                                {resendOtpDisabled ? `${t("auth.verifyEmail.form.texts.resendIn")} ${resendOtpTimer}s` : t("auth.verifyEmail.form.texts.didntReceiveCode")}
                            </button>
                        )}
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex justify-center pt-2 px-3 sm:px-6 transition-all duration-300">
                <Button
                    onClick={!isCodeSent ? handleSendCode : handleVerifyCode}
                    className={cn(
                        "w-full transition-all duration-300",
                        isVerified 
                        ? "bg-green-600 text-background hover:bg-green-600 cursor-default shadow-md shadow-green-600/20" 
                        : "bg-primary text-background hover:bg-primary/60"
                    )}
                    disabled={isSending || isVerifying || (isCodeSent && getOtpCode().length !== 6) || isVerified}
                    size="default"
                >
                    <div className="relative flex items-center justify-center h-5 transition-all duration-300">
                        {/* Send Code State */}
                        <span 
                            className={cn(
                                "absolute inset-0 flex items-center justify-center transition-all duration-300",
                                !isCodeSent 
                                ? "transform translate-y-0 opacity-100" 
                                : "transform -translate-y-8 opacity-0"
                            )}
                        >
                            {isSending ? t("auth.verifyEmail.form.button.send.loading") : t("auth.verifyEmail.form.button.send.label")}
                        </span>
                        {/* Verify Email State */}
                        <span 
                            className={cn(
                                "absolute inset-0 flex items-center justify-center transition-all duration-300",
                                isCodeSent && !isVerified 
                                ? "transform translate-y-0 opacity-100" 
                                : !isCodeSent 
                                    ? "transform translate-y-8 opacity-0" 
                                    : "transform -translate-y-8 opacity-0"
                            )}
                        >
                        {isVerifying ? t("auth.verifyEmail.form.button.verify.loading") : t("auth.verifyEmail.form.button.verify.label")}
                        {!isVerifying && <ArrowRight className="ml-2 h-4 w-4" />}
                        </span>
                        {/* Verified State */}
                        <span 
                            className={cn(
                                "absolute inset-0 flex items-center justify-center transition-all duration-300",
                                isVerified
                                ? "transform translate-y-0 opacity-100" 
                                : "transform translate-y-8 opacity-0"
                            )}
                        >
                            {t("auth.verifyEmail.form.button.verified.label")}
                            <Check className="ml-2 h-4 w-4 animate-bounce-subtle" />
                        </span>
                    </div>
                </Button>
            </CardFooter>
        </Card>
    )
}