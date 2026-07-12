import { NextRequest, NextResponse } from "next/server"
import { AssetService } from "@/services/asset.service"
import { checkRole, rbacResponse } from "@/lib/rbac"
import { Role, AssetStatus } from "@prisma/client"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params
    const asset = await AssetService.getAssetById(id)
    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 })
    }
    return NextResponse.json(asset)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Gated to Admin and Asset Manager
  const rbac = await checkRole([Role.ADMIN, Role.ASSET_MANAGER])
  if (!rbac.authorized) {
    return rbacResponse(rbac.status, rbac.message)
  }

  try {
    const { id } = await params
    const body = await req.json()
    
    // Parse dates if provided
    const updateData: any = { ...body }
    if (body.acquisitionDate) updateData.acquisitionDate = new Date(body.acquisitionDate)
    if (body.warrantyExpiry) updateData.warrantyExpiry = new Date(body.warrantyExpiry)
    if (body.acquisitionCost) updateData.acquisitionCost = parseFloat(body.acquisitionCost)

    const updated = await AssetService.updateAsset(id, updateData)
    return NextResponse.json(updated)
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
  // Deletions are strictly Admin only
  const rbac = await checkRole([Role.ADMIN])
  if (!rbac.authorized) {
    return rbacResponse(rbac.status, rbac.message)
  }

  try {
    const { id } = await params
    await AssetService.deleteAsset(id)
    return NextResponse.json({ success: true, message: "Asset deleted successfully" })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Bad Request" },
      { status: 400 }
    )
  }
}
export const runtime = "nodejs"
