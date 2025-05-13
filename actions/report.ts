"use server";

import { prisma } from "@/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ReportStatus, ReportType, UserRole } from "@/generated/prisma";
import { createNotification } from "./notification";

const reportSchema = z.object({
  type: z.nativeEnum(ReportType),
  reason: z.string().min(5).max(100),
  details: z.string().max(1000).optional(),
  threadId: z.string().optional(),
  postId: z.string().optional(),
  reportedId: z.string().optional(),
});

export async function createReport(formData: FormData) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session) {
      return { success: false, error: "You must be signed in to report content" };
    }

    const validatedFields = reportSchema.parse({
      type: formData.get("type"),
      reason: formData.get("reason"),
      details: formData.get("details"),
      threadId: formData.get("threadId") || undefined,
      postId: formData.get("postId") || undefined,
      reportedId: formData.get("reportedId") || undefined,
    });

    // Make sure at least one entity is reported
    if (!validatedFields.threadId && !validatedFields.postId && !validatedFields.reportedId) {
      return { success: false, error: "You must specify what you are reporting" };
    }

    // Create report
    const report = await prisma.report.create({
      data: {
        type: validatedFields.type,
        reason: validatedFields.reason,
        details: validatedFields.details,
        threadId: validatedFields.threadId,
        postId: validatedFields.postId,
        reportedId: validatedFields.reportedId,
        reporterId: session.user.id,
        status: ReportStatus.PENDING
      }
    });

    // Notify admins and moderators about the report
    const admins = await prisma.user.findMany({
      where: { role: UserRole.admin }
    });

    let moderators: { id: string }[] = [];

    if (validatedFields.threadId) {
      const thread = await prisma.thread.findUnique({
        where: { id: validatedFields.threadId },
        select: { categoryId: true }
      });

      if (thread) {
        const categoryModerators = await prisma.categoryModerator.findMany({
          where: { categoryId: thread.categoryId },
          select: { userId: true }
        });

        moderators = categoryModerators.map(m => ({ id: m.userId }));
      }
    } else if (validatedFields.postId) {
      const post = await prisma.post.findUnique({
        where: { id: validatedFields.postId },
        select: { thread: { select: { categoryId: true } } }
      });

      if (post) {
        const categoryModerators = await prisma.categoryModerator.findMany({
          where: { categoryId: post.thread.categoryId },
          select: { userId: true }
        });

        moderators = categoryModerators.map(m => ({ id: m.userId }));
      }
    }

    // Combine unique admin and moderator IDs
    const notifyUsers = [...new Set([
      ...admins.map(a => a.id),
      ...moderators.map(m => m.id)
    ])];

    for (const userId of notifyUsers) {
      if (userId !== session.user.id) {
        await createNotification({
          type: "MODERATION",
          userId,
          actorId: session.user.id,
          entityId: report.id,
          entityType: "SYSTEM",
          title: "New Report",
          message: `A new ${validatedFields.type.toLowerCase()} report has been filed and needs review`,
          link: `/admin/reports/${report.id}`
        });
      }
    }

    return { success: true, data: report };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }

    console.error("Failed to create report:", error);
    return { success: false, error: "Failed to submit report" };
  }
}

export async function updateReportStatus(
  reportId: string,
  status: ReportStatus,
  resolution?: string
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session ||
      (session.user.role !== UserRole.admin && session.user.role !== UserRole.moderator)) {
      return { success: false, error: "Unauthorized" };
    }

    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: {
        reporter: true,
        thread: { include: { category: true } },
        post: { include: { thread: { include: { category: true } } } }
      }
    });

    if (!report) {
      return { success: false, error: "Report not found" };
    }

    // Check if user is moderator of the reported content's category
    if (session.user.role === UserRole.moderator) {
      let categoryId: string | undefined;

      if (report.thread) {
        categoryId = report.thread.categoryId;
      } else if (report.post) {
        categoryId = report.post.thread.categoryId;
      }

      if (categoryId) {
        const isModerator = await prisma.categoryModerator.findFirst({
          where: {
            userId: session.user.id,
            categoryId
          }
        });

        if (!isModerator) {
          return { success: false, error: "You don't have permission to moderate this content" };
        }
      } else {
        // If it's a user report, only admins can handle it
        return { success: false, error: "Only administrators can handle user reports" };
      }
    }

    const updatedReport = await prisma.report.update({
      where: { id: reportId },
      data: {
        status,
        resolution,
        closedById: session.user.id
      }
    });

    // Notify reporter that their report has been handled
    await createNotification({
      type: "MODERATION",
      userId: report.reporterId,
      entityId: report.id,
      entityType: "SYSTEM",
      title: "Report Update",
      message: `Your report has been ${status.toLowerCase()}`,
      link: status === "RESOLVED" ?
        (report.thread ?
          `/categories/${report.thread.category.slug}/${report.thread.slug}` :
          (report.post ?
            `/categories/${report.post.thread.category.slug}/${report.post.thread.slug}#post-${report.post.id}` :
            undefined
          )
        ) :
        undefined
    });

    revalidatePath("/admin/reports");
    return { success: true, data: updatedReport };
  } catch (error) {
    console.error("Failed to update report:", error);
    return { success: false, error: "Failed to update report" };
  }
}

export async function getReports(status?: ReportStatus, page = 1, limit = 20) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session ||
      (session.user.role !== UserRole.admin && session.user.role !== UserRole.moderator)) {
      return { success: false, error: "Unauthorized" };
    }

    const skip = (page - 1) * limit;
    const where: any = status ? { status } : {};

    // If moderator, only show reports for categories they moderate
    if (session.user.role === UserRole.moderator) {
      const moderatedCategories = await prisma.categoryModerator.findMany({
        where: { userId: session.user.id },
        select: { categoryId: true }
      });

      const categoryIds = moderatedCategories.map(m => m.categoryId);

      where.OR = [
        { thread: { categoryId: { in: categoryIds } } },
        { post: { thread: { categoryId: { in: categoryIds } } } }
      ];
    }

    const [reports, totalCount] = await Promise.all([
      prisma.report.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          reporter: { select: { id: true, name: true, image: true } },
          reported: { select: { id: true, name: true, image: true } },
          thread: {
            include: {
              category: true,
              author: true
            }
          },
          post: {
            include: {
              thread: { include: { category: true } },
              author: true
            }
          }
        }
      }),
      prisma.report.count({ where })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      success: true,
      data: {
        reports,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages
        }
      }
    };
  } catch (error) {
    console.error("Failed to fetch reports:", error);
    return { success: false, error: "Failed to load reports" };
  }
}
