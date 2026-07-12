import { PrismaClient, Role, AssetStatus, VerificationStatus } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding database...")

  // Clean existing data in dependency order
  await prisma.document.deleteMany()
  await prisma.activityLog.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.auditItem.deleteMany()
  await prisma.audit.deleteMany()
  await prisma.maintenanceRequest.deleteMany()
  await prisma.booking.deleteMany()
  await prisma.transferRequest.deleteMany()
  await prisma.allocation.deleteMany()
  await prisma.asset.deleteMany()
  await prisma.assetCategory.deleteMany()
  
  // Set departmentHeadId to null first to avoid circular dependency on delete
  await prisma.department.updateMany({ data: { departmentHeadId: null } })
  await prisma.employee.deleteMany()
  await prisma.department.deleteMany()
  await prisma.user.deleteMany()

  // Generate Hashed Passwords
  const adminPasswordHash = await bcrypt.hash("Admin123!", 12)
  const managerPasswordHash = await bcrypt.hash("Manager123!", 12)
  const headPasswordHash = await bcrypt.hash("Head123!", 12)
  const employeePasswordHash = await bcrypt.hash("Employee123!", 12)
  const auditorPasswordHash = await bcrypt.hash("Auditor123!", 12)

  // 1. Create Users
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@assetflow.com",
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      status: true
    }
  })

  const managerUser = await prisma.user.create({
    data: {
      email: "manager@assetflow.com",
      passwordHash: managerPasswordHash,
      role: Role.ASSET_MANAGER,
      status: true
    }
  })

  const headUser = await prisma.user.create({
    data: {
      email: "head@assetflow.com",
      passwordHash: headPasswordHash,
      role: Role.DEPARTMENT_HEAD,
      status: true
    }
  })

  const employeeUser = await prisma.user.create({
    data: {
      email: "employee@assetflow.com",
      passwordHash: employeePasswordHash,
      role: Role.EMPLOYEE,
      status: true
    }
  })

  const auditorUser = await prisma.user.create({
    data: {
      email: "auditor@assetflow.com",
      passwordHash: auditorPasswordHash,
      role: Role.AUDITOR,
      status: true
    }
  })

  console.log("Users created.")

  // 2. Create Departments (Temporarily without heads)
  const itDept = await prisma.department.create({
    data: {
      name: "Information Technology",
      code: "DEPT-IT",
      description: "IT Infrastructure, Support, and Software Engineering",
      status: true
    }
  })

  const hrDept = await prisma.department.create({
    data: {
      name: "Human Resources",
      code: "DEPT-HR",
      description: "Recruitment, Operations, and Employee Relations",
      status: true
    }
  })

  const opsDept = await prisma.department.create({
    data: {
      name: "Operations",
      code: "DEPT-OPS",
      description: "Facilities, Logistics, and Fleet Management",
      status: true
    }
  })

  const financeDept = await prisma.department.create({
    data: {
      name: "Finance",
      code: "DEPT-FIN",
      description: "Budgeting, Payroll, and Accounts",
      status: true
    }
  })

  console.log("Departments created.")

  // 3. Create Employees and link to Users and Departments
  const adminEmp = await prisma.employee.create({
    data: {
      employeeId: "AF-EMP-1000",
      name: "System Admin",
      email: adminUser.email,
      phone: "+15550100",
      userId: adminUser.id,
      departmentId: itDept.id,
      status: true
    }
  })

  const managerEmp = await prisma.employee.create({
    data: {
      employeeId: "AF-EMP-1001",
      name: "Sarah Jenkins",
      email: managerUser.email,
      phone: "+15550101",
      userId: managerUser.id,
      departmentId: opsDept.id,
      status: true
    }
  })

  const headEmp = await prisma.employee.create({
    data: {
      employeeId: "AF-EMP-1002",
      name: "Marcus Vance",
      email: headUser.email,
      phone: "+15550102",
      userId: headUser.id,
      departmentId: itDept.id,
      status: true
    }
  })

  const normalEmp = await prisma.employee.create({
    data: {
      employeeId: "AF-EMP-1003",
      name: "John Doe",
      email: employeeUser.email,
      phone: "+15550103",
      userId: employeeUser.id,
      departmentId: itDept.id,
      status: true
    }
  })

  const auditorEmp = await prisma.employee.create({
    data: {
      employeeId: "AF-EMP-1004",
      name: "Jane Audit",
      email: auditorUser.email,
      phone: "+15550104",
      userId: auditorUser.id,
      departmentId: financeDept.id,
      status: true
    }
  })

  console.log("Employees created.")

  // 4. Update Department Heads
  await prisma.department.update({
    where: { id: itDept.id },
    data: { departmentHeadId: headEmp.id }
  })

  await prisma.department.update({
    where: { id: opsDept.id },
    data: { departmentHeadId: managerEmp.id } // Manager is also the head of ops
  })

  console.log("Department heads assigned.")

  // 5. Create Asset Categories with custom field schemas
  const electronicsCat = await prisma.assetCategory.create({
    data: {
      name: "Electronics",
      description: "Laptops, phones, tablets, monitors, and accessories",
      status: true,
      customFields: [
        { name: "Warranty Months", type: "number", required: true },
        { name: "RAM GB", type: "number", required: false },
        { name: "Storage GB", type: "number", required: false }
      ]
    }
  })

  const furnitureCat = await prisma.assetCategory.create({
    data: {
      name: "Furniture",
      description: "Desks, chairs, filing cabinets, and conference tables",
      status: true,
      customFields: [
        { name: "Material", type: "string", required: true },
        { name: "Color", type: "string", required: false }
      ]
    }
  })

  const vehicleCat = await prisma.assetCategory.create({
    data: {
      name: "Vehicles",
      description: "Company cars, delivery vans, and shuttle buses",
      status: true,
      customFields: [
        { name: "License Plate", type: "string", required: true },
        { name: "Model Year", type: "number", required: true },
        { name: "Fuel Type", type: "string", required: false }
      ]
    }
  })

  const itEquipCat = await prisma.assetCategory.create({
    data: {
      name: "IT Infrastructure",
      description: "Servers, network switches, routers, and firewalls",
      status: true,
      customFields: []
    }
  })

  console.log("Categories created.")

  // 6. Create Assets
  const asset1 = await prisma.asset.create({
    data: {
      assetTag: "AF-0001",
      assetName: "MacBook Pro 16 M3 Max",
      serialNumber: "C02XYZ123456",
      acquisitionDate: new Date("2026-01-15"),
      acquisitionCost: 3499.00,
      warrantyExpiry: new Date("2029-01-15"),
      vendor: "Apple Business",
      condition: "Excellent",
      location: "IT Storage Room B",
      sharedBookableFlag: false,
      qrCode: "assetflow:AF-0001",
      status: AssetStatus.AVAILABLE,
      categoryId: electronicsCat.id
    }
  })

  const asset2 = await prisma.asset.create({
    data: {
      assetTag: "AF-0002",
      assetName: "Dell XPS 15 9530",
      serialNumber: "DS-99031-A",
      acquisitionDate: new Date("2026-02-10"),
      acquisitionCost: 1999.00,
      warrantyExpiry: new Date("2028-02-10"),
      vendor: "Dell Direct",
      condition: "Good",
      location: "Office Area 4F",
      sharedBookableFlag: false,
      qrCode: "assetflow:AF-0002",
      status: AssetStatus.ALLOCATED,
      categoryId: electronicsCat.id
    }
  })

  const asset3 = await prisma.asset.create({
    data: {
      assetTag: "AF-0003",
      assetName: "Ergonomic Office Chair Desk-Pro",
      serialNumber: "FUR-88912-CH",
      acquisitionDate: new Date("2026-03-01"),
      acquisitionCost: 450.00,
      vendor: "OfficeDepot",
      condition: "Excellent",
      location: "Office Area 4F",
      sharedBookableFlag: false,
      qrCode: "assetflow:AF-0003",
      status: AssetStatus.AVAILABLE,
      categoryId: furnitureCat.id
    }
  })

  const asset4 = await prisma.asset.create({
    data: {
      assetTag: "AF-0004",
      assetName: "Tesla Model 3 Dual Motor (Red)",
      serialNumber: "5YJ3E1EA5LF123456",
      acquisitionDate: new Date("2025-11-20"),
      acquisitionCost: 42000.00,
      warrantyExpiry: new Date("2029-11-20"),
      vendor: "Tesla Motors",
      condition: "Good",
      location: "Parking Lot B",
      sharedBookableFlag: true, // Bookable!
      qrCode: "assetflow:AF-0004",
      status: AssetStatus.AVAILABLE,
      categoryId: vehicleCat.id
    }
  })

  const asset5 = await prisma.asset.create({
    data: {
      assetTag: "AF-0005",
      assetName: "Epson 4K Projector Pro",
      serialNumber: "EPS-PROJ-771",
      acquisitionDate: new Date("2026-04-18"),
      acquisitionCost: 1200.00,
      vendor: "BestBuy Business",
      condition: "Good",
      location: "Conference Room 3A",
      sharedBookableFlag: true, // Bookable!
      qrCode: "assetflow:AF-0005",
      status: AssetStatus.AVAILABLE,
      categoryId: itEquipCat.id
    }
  })

  console.log("Assets created.")

  // 7. Create an Allocation (For Dell XPS, currently assigned to John Doe)
  const allocation = await prisma.allocation.create({
    data: {
      assetId: asset2.id,
      assignedToId: normalEmp.id,
      departmentId: itDept.id,
      allocationDate: new Date("2026-02-15"),
      expectedReturnDate: new Date("2027-02-15"),
      conditionBefore: "Brand New",
      status: "ACTIVE"
    }
  })

  // 8. Create a TransferRequest
  await prisma.transferRequest.create({
    data: {
      assetId: asset2.id,
      requestedById: managerEmp.id,
      targetEmployeeId: normalEmp.id,
      status: "REQUESTED",
      notes: "Need this unit transferred to John Doe in IT permanently."
    }
  })

  // 9. Create Bookings (Tesla Model 3, Epson Projector)
  await prisma.booking.create({
    data: {
      resourceId: asset4.id,
      bookedById: normalEmp.id,
      startTime: new Date("2026-08-15T09:00:00Z"),
      endTime: new Date("2026-08-15T12:00:00Z"),
      purpose: "Client site visit",
      status: "UPCOMING"
    }
  })

  await prisma.booking.create({
    data: {
      resourceId: asset5.id,
      bookedById: headEmp.id,
      startTime: new Date("2026-08-16T14:00:00Z"),
      endTime: new Date("2026-08-16T16:00:00Z"),
      purpose: "All Hands Presentation",
      status: "UPCOMING"
    }
  })

  // 10. Create Maintenance Requests
  await prisma.maintenanceRequest.create({
    data: {
      assetId: asset3.id,
      requestedById: normalEmp.id,
      issueDescription: "Squeaking base mechanism and loose hydraulic cylinder",
      priority: "MEDIUM",
      status: "PENDING",
      estimatedCost: 80.00
    }
  })

  await prisma.maintenanceRequest.create({
    data: {
      assetId: asset1.id,
      requestedById: headEmp.id,
      issueDescription: "Battery swelling and rapid discharge warning",
      priority: "HIGH",
      status: "APPROVED",
      estimatedCost: 350.00
    }
  })

  // 11. Create Audit Cycle
  const auditCycle = await prisma.audit.create({
    data: {
      name: "Q3 Physical Inventory Count",
      description: "Mandatory compliance physical check for IT equipment and furniture assets.",
      status: "ACTIVE",
      startDate: new Date("2026-07-01"),
      endDate: new Date("2026-07-31")
    }
  })

  // Link assets to the Audit Cycle
  await prisma.auditItem.create({
    data: {
      auditId: auditCycle.id,
      assetId: asset1.id,
      status: VerificationStatus.MISSING
    }
  })

  await prisma.auditItem.create({
    data: {
      auditId: auditCycle.id,
      assetId: asset2.id,
      status: VerificationStatus.VERIFIED,
      verifiedById: auditorEmp.id,
      notes: "Serial match verified, condition matches logs."
    }
  })

  // 12. Create Notifications
  await prisma.notification.create({
    data: {
      userId: normalEmp.userId!,
      title: "Upcoming Return Notice",
      message: `Your allocation for ${asset2.assetName} is due in 3 days.`,
      type: "ALERT",
      read: false
    }
  })

  await prisma.notification.create({
    data: {
      userId: adminEmp.userId!,
      title: "New Maintenance Request",
      message: `A new maintenance ticket has been raised for ${asset3.assetName}.`,
      type: "ALERT",
      read: false
    }
  })

  // 13. Create ActivityLog entry for seeding
  await prisma.activityLog.create({
    data: {
      action: "DB_SEED",
      newValue: { message: "Initial seed data loaded successfully" }
    }
  })

  console.log("Database seeded successfully!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
