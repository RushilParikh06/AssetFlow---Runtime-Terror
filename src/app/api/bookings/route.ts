import { NextRequest } from "next/server"
import { BookingService } from "@/services/booking.service"
import { checkRole, rbacResponse } from "@/lib/rbac"
import { Role, BookingStatus } from "@prisma/client"
import { apiPaginated, apiCreated, apiServerError, apiValidationError, parsePagination } from "@/lib/api-response"

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
    const resourceId = searchParams.get("resourceId") || undefined
    const bookedById = searchParams.get("bookedById") || undefined
    const statusParam = searchParams.get("status") as BookingStatus | null
    const status = statusParam && Object.values(BookingStatus).includes(statusParam) ? statusParam : undefined
    
    const fromParam = searchParams.get("from")
    const toParam = searchParams.get("to")
    const from = fromParam ? new Date(fromParam) : undefined
    const to = toParam ? new Date(toParam) : undefined

    const { items, total } = await BookingService.getBookings({
      resourceId,
      bookedById,
      status,
      from,
      to,
      skip,
      take
    })

    return apiPaginated(items, total, page, pageSize)
  } catch (error: any) {
    return apiServerError(error.message || "Internal Server Error")
  }
}

export async function POST(req: NextRequest) {
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
      return apiValidationError("Missing required fields: resourceId, startTime, endTime")
    }

    if (!rbac.user.employeeId) {
      return apiValidationError("Your user account is not linked to an employee profile")
    }

    const booking = await BookingService.createBooking({
      resourceId,
      bookedById: rbac.user.employeeId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      purpose
    })

    return apiCreated(booking, "Resource booked successfully")
  } catch (error: any) {
    return apiServerError(error.message || "Bad Request")
  }
}
export const runtime = "nodejs"
