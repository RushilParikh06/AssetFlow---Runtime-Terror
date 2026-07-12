import prisma from "@/lib/db"

export class NotificationService {
  /**
   * Send a notification to a specific user
   */
  static async sendNotification(data: {
    userId: string
    title: string
    message: string
    type: string
  }) {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        read: false
      }
    })

    // Hook: In the future, we will trigger socket.io emission from here
    // e.g. SocketService.emitToUser(data.userId, "notification", notification);

    return notification
  }

  /**
   * Get all notifications for a specific user
   */
  static async getUserNotifications(userId: string, filters?: { unreadOnly?: boolean }) {
    const where: any = { userId }
    if (filters?.unreadOnly) {
      where.read = false
    }

    return await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" }
    })
  }

  /**
   * Mark a single notification as read
   */
  static async markAsRead(id: string) {
    return await prisma.notification.update({
      where: { id },
      data: { read: true }
    })
  }

  /**
   * Mark all notifications for a user as read
   */
  static async markAllAsRead(userId: string) {
    return await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true }
    })
  }

  /**
   * Create an activity log audit trail entry
   */
  static async logActivity(data: {
    action: string
    userId?: string | null
    oldValue?: any
    newValue?: any
    ipAddress?: string | null
  }) {
    return await prisma.activityLog.create({
      data: {
        action: data.action,
        userId: data.userId || null,
        oldValue: data.oldValue || undefined,
        newValue: data.newValue || undefined,
        ipAddress: data.ipAddress || null
      }
    })
  }

  /**
   * Get activity logs for admin review
   */
  static async getActivityLogs(params?: {
    userId?: string
    action?: string
    limit?: number
  }) {
    const where: any = {}
    if (params?.userId) {
      where.userId = params.userId
    }
    if (params?.action) {
      where.action = params.action
    }

    return await prisma.activityLog.findMany({
      where,
      take: params?.limit || 100,
      include: {
        user: {
          select: {
            email: true,
            role: true,
            employee: { select: { name: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })
  }
}
