import { NextRequest } from "next/server"
import { BookingService } from "@/services/booking.service"
import { checkRole, rbacResponse } from "@/lib/rbac"
import prisma from "@/lib/db"
import { Role } from "@prisma/client"
import { apiSuccess, apiNotFound, apiForbidden, apiServerError, apiValidationError } from "@/lib/api-response"

async function handleReschedule(
  req: NextRequest,
  id: string
) {
  const rbac = await checkRole([
    Role.ADMIN,
    Role.ASSET_MANAGER,
    Role.DEPARTMENT_HEAD,
    Role.EMPLOYEE
  ])
  if (!rbac.authorized) {
    return rbacResponse(rbac.status, rbac.message)
  }

  try {
    // Check ownership unless admin/manager
    const booking = await prisma.booking.findUnique({ where: { id } })
    if (!booking) {
      return apiNotFound("Booking")
    }

    if (
      rbac.user.role !== Role.ADMIN &&
      rbac.user.role !== Role.ASSET_MANAGER &&
      booking.bookedById !== rbac.user.employeeId
    ) {
      return apiForbidden("You do not own this booking")
    }

    const body = await req.json()
    const { startTime, endTime } = body

    if (!startTime || !endTime) {
      return apiValidationError("startTime and endTime are required fields")
    }

    const rescheduled = await BookingService.rescheduleBooking(id, {
      startTime: new Date(startTime),
      endTime: new Date(endTime)
    })

    return apiSuccess(rescheduled, 200, "Booking rescheduled successfully")
  } catch (error: any) {
    return apiServerError(error.message || "Bad Request")
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return handleReschedule(req, id)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return handleReschedule(req, id)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rbac = await checkRole([
    Role.ADMIN,
    Role.ASSET_MANAGER,
    Role.DEPARTMENT_HEAD,
    Role.EMPLOYEE
  ])
  if (!rbac.authorized) {
    return rbacResponse(rbac.status, rbac.message)
  }

  try {
    const { id } = await params
    
    // Check ownership unless admin/manager
    const booking = await prisma.booking.findUnique({ where: { id } })
    if (!booking) {
      return apiNotFound("Booking")
    }

    if (
      rbac.user.role !== Role.ADMIN &&
      rbac.user.role !== Role.ASSET_MANAGER &&
      booking.bookedById !== rbac.user.employeeId
    ) {
      return apiForbidden("You do not own this booking")
    }

    const cancelled = await BookingService.cancelBooking(id)
    return apiSuccess(cancelled, 200, "Booking cancelled successfully")
  } catch (error: any) {
    return apiServerError(error.message || "Bad Request")
  }
}
export const runtime = "nodejs"
