import { NextRequest, NextResponse } from "next/server"

/**
 * Standardized API Response Helpers
 * 
 * Supports both signatures for backward and forward compatibility.
 */

// ─── Success Responses ───────────────────────────────────────────

export function apiSuccess<T>(data: T, param2?: string | number, param3?: string | number) {
  let status = 200
  let message: string | undefined = undefined

  if (typeof param2 === "number") {
    status = param2
    if (typeof param3 === "string") {
      message = param3
    }
  } else if (typeof param2 === "string") {
    message = param2
    if (typeof param3 === "number") {
      status = param3
    }
  }

  return NextResponse.json(
    { success: true, data, ...(message ? { message } : {}) },
    { status }
  )
}

export function apiCreated<T>(data: T, message = "Created successfully") {
  return NextResponse.json(
    { success: true, message, data },
    { status: 201 }
  )
}

// ─── Error Responses ─────────────────────────────────────────────

export function apiError(
  message: string,
  param2?: string | number,
  param3?: number,
  field?: string
) {
  let code = "BAD_REQUEST"
  let status = 400

  if (typeof param2 === "string") {
    code = param2
    if (typeof param3 === "number") {
      status = param3
    }
  } else if (typeof param2 === "number") {
    status = param2
  }

  return NextResponse.json(
    { success: false, error: message, code, ...(field ? { field } : {}) },
    { status }
  )
}

export function apiNotFound(messageOrEntity = "Resource not found") {
  const isEntity = 
    !messageOrEntity.toLowerCase().includes("not found") && 
    !messageOrEntity.toLowerCase().includes("resource")
  const msg = isEntity ? `${messageOrEntity} not found` : messageOrEntity
  return NextResponse.json(
    { success: false, error: msg, code: "NOT_FOUND" },
    { status: 404 }
  )
}

export function apiUnauthorized(message = "Unauthorized") {
  return NextResponse.json(
    { success: false, error: message, code: "UNAUTHORIZED" },
    { status: 401 }
  )
}

export function apiForbidden(message = "Forbidden") {
  return NextResponse.json(
    { success: false, error: message, code: "FORBIDDEN" },
    { status: 403 }
  )
}

export function apiValidationError(message: string, field?: string) {
  return NextResponse.json(
    { success: false, error: message, code: "VALIDATION_ERROR", field },
    { status: 422 }
  )
}

export function apiConflict(message: string) {
  return NextResponse.json(
    { success: false, error: message, code: "CONFLICT" },
    { status: 409 }
  )
}

export function apiServerError(message = "Internal Server Error") {
  return NextResponse.json(
    { success: false, error: message, code: "SERVER_ERROR" },
    { status: 500 }
  )
}

// ─── Pagination Helpers ──────────────────────────────────────────

export function apiPaginated<T>(
  data: T[],
  total: number,
  page: number,
  pageSizeOrLimit: number,
  message?: string
) {
  const limit = pageSizeOrLimit
  const pageSize = pageSizeOrLimit
  const totalPages = Math.ceil(total / limit)

  return NextResponse.json({
    success: true,
    message,
    data,
    total,
    page,
    pageSize,
    totalPages,
    pagination: {
      total,
      page,
      limit,
      totalPages,
    }
  })
}

export function parsePagination(reqOrSearchParams: any) {
  let searchParams: URLSearchParams
  if (reqOrSearchParams && "nextUrl" in reqOrSearchParams) {
    searchParams = reqOrSearchParams.nextUrl.searchParams
  } else {
    searchParams = reqOrSearchParams
  }

  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10))
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("limit") || searchParams.get("pageSize") || "20", 10))
  )
  const pageSize = limit
  const skip = (page - 1) * limit

  return { page, limit, pageSize, skip, take: limit }
}
