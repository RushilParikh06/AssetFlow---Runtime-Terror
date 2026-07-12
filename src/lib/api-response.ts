import { NextRequest, NextResponse } from "next/server"

export function apiSuccess<T>(data: T, message?: string, status = 200) {
  return NextResponse.json({ success: true, message, data }, { status })
}

export function apiCreated<T>(data: T, message = "Created successfully") {
  return NextResponse.json({ success: true, message, data }, { status: 201 })
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

export function apiValidationError(message: string, field?: string) {
  return NextResponse.json(
    { success: false, error: message, field },
    { status: 422 }
  )
}

export function apiNotFound(message = "Resource not found") {
  return NextResponse.json({ success: false, error: message }, { status: 404 })
}

export function apiUnauthorized(message = "Unauthorized") {
  return NextResponse.json({ success: false, error: message }, { status: 401 })
}

export function apiForbidden(message = "Forbidden") {
  return NextResponse.json({ success: false, error: message }, { status: 403 })
}

export function apiServerError(message = "Internal server error") {
  return NextResponse.json({ success: false, error: message }, { status: 500 })
}

export function apiPaginated<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
  message?: string
) {
  return NextResponse.json({
    success: true,
    message,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  })
}

export function parsePagination(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)))
  const skip = (page - 1) * limit
  return { page, limit, skip }
}
