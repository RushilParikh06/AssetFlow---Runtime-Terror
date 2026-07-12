import { NextRequest, NextResponse } from "next/server"
import { BookingService } from "@/services/booking.service"
import { checkRole, rbacResponse } from "@/lib/rbac"
import { Role, BookingStatus } from "@prisma/client"

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
    const resourceId = searchParams.get("resourceId") || undefined
    const bookedById = searchParams.get("bookedById") || undefined
    const statusParam = searchParams.get("status") as BookingStatus | null
    const status = statusParam && Object.values(BookingStatus).includes(statusParam) ? statusParam : undefined
    
    const fromParam = searchParams.get("from")
    const toParam = searchParams.get("to")
    const from = fromParam ? new Date(fromParam) : undefined
    const to = toParam ? new Date(toParam) : undefined

    const bookings = await BookingService.getBookings({
      resourceId,
      bookedById,
      status,
      from,
      to
    })

    return NextResponse.json(bookings)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  // Gated to all logged in roles
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
    const body = await req.json()
    const { resourceId, startTime, endTime, purpose } = body

    if (!resourceId || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Missing required fields: resourceId, startTime, endTime" },
        { status: 400 }
      )
    }

    if (!rbac.user.employeeId) {
      return NextResponse.json({ error: "Your user account is not linked to an employee profile" }, { status: 400 })
    }

    const booking = await BookingService.createBooking({
      resourceId,
      bookedById: rbac.user.employeeId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      purpose
    })

    return NextResponse.json(booking, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Bad Request" },
      { status: 400 } // Emits 400/409 error on booking overlaps
    )
  }
}
export const runtime = "nodejs"
