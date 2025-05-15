import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from "@/lib/auth"
import { headers } from 'next/headers'
import { prisma } from './prisma'

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
    // Get the pathname
    const path = request.nextUrl.pathname

    // Skip middleware for auth paths and api routes
    if (
        path.startsWith('/auth') || 
        path.startsWith('/api') ||
        path.includes('_next') ||
        path.includes('favicon.ico') ||
        path.includes('.svg') ||
        path.includes('.jpg') ||
        path.includes('.png')
    ) {
        return NextResponse.next()
    }

    // Check if user is authenticated
    const session = await auth.api.getSession({
      headers: await headers()
    })
  
    // If user is not logged in, no need to check profile completion
    if (!session) {
        return NextResponse.next()
    }
  
    try {
        // Query the database to check if user has seen the profile setup
        // This is a simpler approach than using the server action
        const user = await prisma.user.findUnique({
        where: {
            id: session.user?.id,
        },
        select: {
            metadata: true,
            bio: true,
            image: true,
        }
        })
        
        // Parse metadata if it exists
        const metadata = user?.metadata ? JSON.parse(user.metadata as string) : {}
        
        // Check if user has seen the profile setup page
        const hasSeenProfileSetup = Boolean(metadata.profileSetupSeen)
        const hasProfileInfo = Boolean(user?.bio || user?.image)
        
        // If user hasn't seen profile setup and doesn't already have profile info,
        // redirect to complete profile page
        if (!hasSeenProfileSetup && !hasProfileInfo) {
        const url = new URL('/auth/complete-profile', request.url)
        url.searchParams.set('redirect', path)
        return NextResponse.redirect(url)
        }
    } catch (error) {
        console.error('Error checking profile completion:', error)
    }
    
    return NextResponse.next()
}