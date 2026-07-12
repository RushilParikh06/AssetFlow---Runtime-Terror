import { NextRequest, NextResponse } from "next/server"
import { BookingService } from "@/services/booking.service"
import { checkRole, rbacResponse } from "@/lib/rbac"
import prisma from "@/lib/db"
import { Role } from "@prisma/client"

export async function PUT(
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
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    if (
      rbac.user.role !== Role.ADMIN &&
      rbac.user.role !== Role.ASSET_MANAGER &&
      booking.bookedById !== rbac.user.employeeId
    ) {
      return NextResponse.json({ error: "Forbidden: You do not own this booking" }, { status: 403 })
    }

    const body = await req.json()
    const { startTime, endTime } = body

    if (!startTime || !endTime) {
      return NextResponse.json({ error: "startTime and endTime are required" }, { status: 400 })
    }

    const rescheduled = await BookingService.rescheduleBooking(id, {
      startTime: new Date(startTime),
      endTime: new Date(endTime)
    })

    return NextResponse.json(rescheduled)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Bad Request" },
      { status: 400 }
    )
  }
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
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    if (
      rbac.user.role !== Role.ADMIN &&
      rbac.user.role !== Role.ASSET_MANAGER &&
      booking.bookedById !== rbac.user.employeeId
    ) {
      return NextResponse.json({ error: "Forbidden: You do not own this booking" }, { status: 403 })
    }

    const cancelled = await BookingService.cancelBooking(id)
    return NextResponse.json({
      success: true,
      message: "Booking cancelled successfully",
      booking: cancelled
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Bad Request" },
      { status: 400 }
    )
  }
}
export const runtime = "nodejs"
