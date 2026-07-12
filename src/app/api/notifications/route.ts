import { NextRequest, NextResponse } from "next/server"
import { NotificationService } from "@/services/notification.service"
import { checkRole, rbacResponse } from "@/lib/rbac"
import { Role } from "@prisma/client"

export async function GET(req: NextRequest) {
  const rbac = await checkRole([
    Role.ADMIN,
    Role.ASSET_MANAGER,
    Role.DEPARTMENT_HEAD,
    Role.EMPLOYEE,
    Role.AUDITOR
  ])
  if (!rbac.authorized) {
    return rbacResponse(rbac.status, rbac.message)
  }

  try {
    const searchParams = req.nextUrl.searchParams
    const unreadOnly = searchParams.get("unread") === "true"

    const notifications = await NotificationService.getUserNotifications(rbac.user.id, { unreadOnly })
    return NextResponse.json(notifications)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  const rbac = await checkRole([
    Role.ADMIN,
    Role.ASSET_MANAGER,
    Role.DEPARTMENT_HEAD,
    Role.EMPLOYEE,
    Role.AUDITOR
  ])
  if (!rbac.authorized) {
    return rbacResponse(rbac.status, rbac.message)
  }

  try {
    const body = await req.json()
    const { notificationId } = body

    if (notificationId) {
      // Mark a single notification as read
      const notification = await NotificationService.markAsRead(notificationId)
      return NextResponse.json({ success: true, notification })
    } else {
      // Mark all notifications as read for current user
      await NotificationService.markAllAsRead(rbac.user.id)
      return NextResponse.json({ success: true, message: "All notifications marked as read" })
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Bad Request" },
      { status: 400 }
    )
  }
}
export const runtime = "nodejs"
