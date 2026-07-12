import { NextRequest } from "next/server"
import prisma from "@/lib/db"
import bcrypt from "bcryptjs"
import { signupSchema } from "@/lib/validators/auth.schema"
import { apiCreated, apiValidationError, apiServerError } from "@/lib/api-response"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validation = signupSchema.safeParse(body)
    
    if (!validation.success) {
      return apiValidationError("Validation error", "validation")
    }
    
    const { name, email, password, phone } = validation.data
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })
    
    if (existingUser) {
      return apiValidationError("An account with this email already exists", "email")
    }
    
    // Auto-generate employeeId (e.g. AF-EMP-1001)
    const lastEmployee = await prisma.employee.findFirst({
      where: { employeeId: { startsWith: "AF-EMP-" } },
      orderBy: { employeeId: "desc" }
    })
    
    let nextIdNumber = 1001
    if (lastEmployee) {
      const match = lastEmployee.employeeId.match(/AF-EMP-(\d+)/)
      if (match && match[1]) {
        nextIdNumber = parseInt(match[1], 10) + 1
      }
    }
    const employeeId = `AF-EMP-${nextIdNumber}`
    
    const passwordHash = await bcrypt.hash(password, 12)
    
    // Create both User and Employee inside a transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          role: "EMPLOYEE",
          status: true
        }
      })
      
      const employee = await tx.employee.create({
        data: {
          employeeId,
          name,
          email,
          phone,
          status: true,
          userId: user.id
        }
      })
      
      return { user, employee }
    })
    
    // Create an ActivityLog entry
    await prisma.activityLog.create({
      data: {
        action: "USER_SIGNUP",
        userId: result.user.id,
        newValue: { email: result.user.email, employeeId: result.employee.employeeId }
      }
    })
    
    return apiCreated({
      id: result.employee.id,
      employeeId: result.employee.employeeId,
      name: result.employee.name,
      email: result.employee.email
    }, "Account created successfully")
    
  } catch (error: any) {
    console.error("Signup error:", error)
    return apiServerError("Internal server error")
  }
}
