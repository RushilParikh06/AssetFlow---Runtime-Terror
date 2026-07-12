import { NextResponse } from "next/server"

/**
 * Standardized API Response Helpers
 * 
 * All API route handlers MUST use these helpers to ensure
 * the frontend receives consistent response shapes:
 * 
 * Success:  { success: true, data: T, message?: string }
 * List:     { success: true, data: T[], total, page, pageSize, totalPages }
 * Error:    { success: false, error: string, code: string, field?: string }
 */

// ─── Success Responses ───────────────────────────────────────────

export function apiSuccess<T>(data: T, status = 200, message?: string) {
  return NextResponse.json(
    { success: true, data, ...(message ? { message } : {}) },
    { status }
  )
}

export function apiCreated<T>(data: T, message?: string) {
  return apiSuccess(data, 201, message)
}

export function apiPaginated<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number
) {
  return NextResponse.json({
    success: true,
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  })
}

// ─── Error Responses ─────────────────────────────────────────────

export function apiError(
  error: string,
  code: string,
  status = 400,
  field?: string
) {
  return NextResponse.json(
    { success: false, error, code, ...(field ? { field } : {}) },
    { status }
  )
}

export function apiNotFound(entity: string) {
  return apiError(`${entity} not found`, "NOT_FOUND", 404)
}

export function apiUnauthorized(message = "Unauthorized") {
  return apiError(message, "UNAUTHORIZED", 401)
}

export function apiForbidden(message = "Forbidden") {
  return apiError(message, "FORBIDDEN", 403)
}

export function apiValidationError(message: string, field?: string) {
  return apiError(message, "VALIDATION_ERROR", 400, field)
}

export function apiConflict(message: string) {
  return apiError(message, "CONFLICT", 409)
}

export function apiServerError(message = "Internal Server Error") {
  return apiError(message, "SERVER_ERROR", 500)
}

// ─── Pagination Helpers ──────────────────────────────────────────

export function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10))
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "25", 10)))
  const skip = (page - 1) * pageSize
  return { page, pageSize, skip, take: pageSize }
}
