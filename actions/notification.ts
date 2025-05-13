"use server";

import { prisma } from "@/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { EntityType, NotificationType } from "@/generated/prisma";

type CreateNotificationParams = {
  type: NotificationType;
  userId: string;
  actorId?: string;
  entityId: string;
  entityType: EntityType;
  title?: string;
  message?: string;
  link?: string;
};

export async function createNotification(params: CreateNotificationParams) {
  try {
    await prisma.notification.create({
      data: {
        type: params.type,
        userId: params.userId,
        actorId: params.actorId,
        entityId: params.entityId,
        entityType: params.entityType,
        title: params.title,
        message: params.message,
        link: params.link,
      }
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to create notification:", error);
    return { success: false, error: "Failed to create notification" };
  }
}

export async function getUserNotifications(page = 1, limit = 20) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    const skip = (page - 1) * limit;

    const [notifications, totalCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: session.user.id },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.notification.count({ where: { userId: session.user.id } })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      success: true,
      data: {
        notifications,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages
        }
      }
    };
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return { success: false, error: "Failed to load notifications" };
  }
}

export async function getUnreadNotificationsCount() {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    const count = await prisma.notification.count({
      where: {
        userId: session.user.id,
        isRead: false
      }
    });

    return { success: true, data: count };
  } catch (error) {
    console.error("Failed to count unread notifications:", error);
    return { success: false, error: "Failed to count notifications" };
  }
}

export async function markNotificationAsRead(notificationId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId }
    });

    if (!notification || notification.userId !== session.user.id) {
      return { success: false, error: "Notification not found" };
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true }
    });

    revalidatePath("/notifications");
    return { success: true };
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
    return { success: false, error: "Failed to update notification" };
  }
}

export async function markAllNotificationsAsRead() {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.notification.updateMany({
      where: {
        userId: session.user.id,
        isRead: false
      },
      data: { isRead: true }
    });

    revalidatePath("/notifications");
    return { success: true };
  } catch (error) {
    console.error("Failed to mark all notifications as read:", error);
    return { success: false, error: "Failed to update notifications" };
  }
}
