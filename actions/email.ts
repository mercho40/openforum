"use server"

import { Resend } from 'resend'
import { EmailTemplate } from '@/components/email/verification-template'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

// Initialize Resend with API key
const resend = new Resend(process.env.AUTH_RESEND_KEY || '')


type VerificationEmailProps = {
  email: string
  otp: string
  type: string
}

/**
 * Sends verification email with OTP
 */
export async function sendVerificationEmail({ email, otp, type }: VerificationEmailProps) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })
    const username = session?.user?.name || email.split('@')[0]
    
    await resend.emails.send({
      from: `${process.env.APP_NAME || 'OpenForum'} <noreply@${process.env.APP_DOMAIN || 'restoman.tech'}>`,
      to: email,
      subject: 'Verify your email address',
      react: await EmailTemplate({ 
        username,
        otp,
        productName: 'OpenForum' 
      }),
    })
    
    return { success: true }
  } catch (error) {
    console.error('Error sending verification email:', error)
    return { 
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send verification email'
    }
  }
}

/**
 * Sends forgot password email with OTP
 */
export async function sendForgotPassEmail({ email, otp, type }: VerificationEmailProps) {
  try {
    await resend.emails.send({
      from: `${process.env.APP_NAME || 'OpenForum'} <noreply@${process.env.APP_DOMAIN || 'restoman.tech'}>`,
      to: email,
      subject: 'Reset your password',
      react: await EmailTemplate({ 
        username: email.split('@')[0],
        otp,
        productName: 'OpenForum',
        isPasswordReset: true
      }),
    })
    
    return { success: true }
  } catch (error) {
    console.error('Error sending password reset email:', error)
    return { 
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send password reset email'
    }
  }
}