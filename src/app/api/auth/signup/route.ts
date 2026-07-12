import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import bcrypt from "bcryptjs"
import { signupSchema } from "@/lib/validators/auth.schema"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validation = signupSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation error", details: validation.error.format() },
        { status: 400 }
      )
    }
    
    const { name, email, password, phone } = validation.data
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })
    
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      )
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
    
    return NextResponse.json({
      success: true,
      message: "Account created successfully",
      employee: {
        id: result.employee.id,
        employeeId: result.employee.employeeId,
        name: result.employee.name,
        email: result.employee.email
      }
    }, { status: 201 })
    
  } catch (error: any) {
    console.error("Signup error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
