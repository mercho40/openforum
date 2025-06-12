"use server"

import { db } from "@/db/drizzle"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { revalidateTag } from "next/cache"
import { nanoid } from "nanoid"

// Note: This assumes you have a reports table in your schema
// You may need to add this to your db/schema.ts

interface ReportData {
  targetType: 'post' | 'thread' | 'user'
  targetId: string
  reason: string
  description?: string
}

interface ResolveReportData {
  action: 'dismiss' | 'warn' | 'moderate' | 'ban'
  adminNotes?: string
}

// Mock report structure - you'll need to implement the actual schema
interface Report {
  id: string
  targetType: string
  targetId: string
  reporterId: string
  reason: string
  description?: string
  status: 'pending' | 'resolved' | 'dismissed'
  createdAt: Date
  resolvedAt?: Date
  resolvedBy?: string
  adminNotes?: string
}

// In-memory store for demo - replace with actual database table
const reportsStore = new Map<string, Report>()

export async function createReport(data: ReportData) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user?.id) {
      throw new Error("Not authenticated")
    }

    // Check if user already reported this target
    const existingReport = Array.from(reportsStore.values()).find(
      report => 
        report.reporterId === session.user.id && 
        report.targetId === data.targetId &&
        report.status === 'pending'
    )

    if (existingReport) {
      throw new Error("You have already reported this content")
    }

    const reportId = nanoid()
    const report: Report = {
      id: reportId,
      targetType: data.targetType,
      targetId: data.targetId,
      reporterId: session.user.id,
      reason: data.reason,
      description: data.description,
      status: 'pending',
      createdAt: new Date()
    }

    reportsStore.set(reportId, report)

    // Invalidate admin caches
    revalidateTag('admin-reports')
    revalidateTag('pending-reports')

    return { success: true, reportId }
  } catch (error) {
    console.error("Error creating report:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create report"
    }
  }
}

export async function getReports(status?: 'pending' | 'resolved' | 'dismissed') {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user?.id) {
      throw new Error("Not authenticated")
    }

    if (session.user.role !== "admin" && session.user.role !== "moderator") {
      throw new Error("Not authorized")
    }

    const reports = Array.from(reportsStore.values())
      .filter(report => !status || report.status === status)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    return { success: true, reports }
  } catch (error) {
    console.error("Error fetching reports:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch reports",
      reports: []
    }
  }
}

export async function resolveReport(reportId: string, resolution: ResolveReportData) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user?.id) {
      throw new Error("Not authenticated")
    }

    if (session.user.role !== "admin" && session.user.role !== "moderator") {
      throw new Error("Not authorized")
    }

    const report = reportsStore.get(reportId)
    if (!report) {
      throw new Error("Report not found")
    }

    // Update report
    report.status = 'resolved'
    report.resolvedAt = new Date()
    report.resolvedBy = session.user.id
    report.adminNotes = resolution.adminNotes

    reportsStore.set(reportId, report)

    // TODO: Implement actions based on resolution.action
    // - dismiss: just mark as resolved
    // - warn: send warning notification to user
    // - moderate: hide/delete content
    // - ban: ban the user

    // Invalidate caches
    revalidateTag('admin-reports')
    revalidateTag('pending-reports')

    return { success: true }
  } catch (error) {
    console.error("Error resolving report:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to resolve report"
    }
  }
}

export async function getReportStats() {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user?.id) {
      throw new Error("Not authenticated")
    }

    if (session.user.role !== "admin" && session.user.role !== "moderator") {
      throw new Error("Not authorized")
    }

    const reports = Array.from(reportsStore.values())
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const stats = {
      total: reports.length,
      pending: reports.filter(r => r.status === 'pending').length,
      resolvedToday: reports.filter(r => 
        r.status === 'resolved' && 
        r.resolvedAt && 
        r.resolvedAt >= todayStart
      ).length,
      totalThisWeek: reports.filter(r => r.createdAt >= weekStart).length
    }

    return { success: true, stats }
  } catch (error) {
    console.error("Error fetching report stats:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch report stats",
      stats: { total: 0, pending: 0, resolvedToday: 0, totalThisWeek: 0 }
    }
  }
}
