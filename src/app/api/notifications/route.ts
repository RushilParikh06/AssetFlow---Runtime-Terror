import { NextRequest } from "next/server"
import { NotificationService } from "@/services/notification.service"
import { checkRole, rbacResponse } from "@/lib/rbac"
import { Role } from "@prisma/client"
import { apiPaginated, apiSuccess, apiServerError, parsePagination } from "@/lib/api-response"

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
    const { page, pageSize, skip, take } = parsePagination(searchParams)
    const unreadOnly = searchParams.get("unread") === "true"

    const { items, total } = await NotificationService.getUserNotifications(rbac.user.id, { unreadOnly, skip, take })
    return apiPaginated(items, total, page, pageSize)
  } catch (error: any) {
    return apiServerError(error.message || "Internal Server Error")
  }
}

async function handleMarkRead(req: NextRequest) {
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
      const notification = await NotificationService.markAsRead(notificationId)
      return apiSuccess(notification, 200, "Notification marked as read")
    } else {
      await NotificationService.markAllAsRead(rbac.user.id)
      return apiSuccess(null, 200, "All notifications marked as read")
    }
  } catch (error: any) {
    return apiServerError(error.message || "Bad Request")
  }
}

export async function PUT(req: NextRequest) {
  return handleMarkRead(req)
}

export async function PATCH(req: NextRequest) {
  return handleMarkRead(req)
}
export const runtime = "nodejs"
