import prisma from "@/lib/db"
import { BookingStatus, AssetStatus } from "@prisma/client"

export class BookingService {
  /**
   * Create a new resource booking with overlap checking
   */
  static async createBooking(data: {
    resourceId: string
    bookedById: string
    startTime: Date
    endTime: Date
    purpose?: string | null
  }) {
    if (data.startTime >= data.endTime) {
      throw new Error("Start time must be before end time")
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Verify resource exists, is bookable
      const resource = await tx.asset.findUnique({
        where: { id: data.resourceId }
      })

      if (!resource) {
        throw new Error("Resource not found")
      }

      if (!resource.sharedBookableFlag) {
        throw new Error("This asset is not registered as a shared bookable resource")
      }

      // Check if retired/lost/disposed
      const invalidStatuses: AssetStatus[] = [AssetStatus.RETIRED, AssetStatus.LOST, AssetStatus.DISPOSED, AssetStatus.UNDER_MAINTENANCE]
      if (invalidStatuses.includes(resource.status)) {
        throw new Error(`Resource is currently unavailable due to status: ${resource.status}`)
      }

      // 2. Business Rule: Overlap Check
      // Overlap occurs if: existing.startTime < data.endTime AND existing.endTime > data.startTime
      const overlappingBooking = await tx.booking.findFirst({
        where: {
          resourceId: data.resourceId,
          status: { in: [BookingStatus.UPCOMING, BookingStatus.ONGOING] },
          startTime: { lt: data.endTime },
          endTime: { gt: data.startTime }
        },
        include: { bookedBy: true }
      })

      if (overlappingBooking) {
        throw new Error(
          `Conflict: This resource is already booked by ${overlappingBooking.bookedBy.name} from ${overlappingBooking.startTime.toLocaleTimeString()} to ${overlappingBooking.endTime.toLocaleTimeString()}`
        )
      }

      // 3. Create Booking
      const booking = await tx.booking.create({
        data: {
          resourceId: data.resourceId,
          bookedById: data.bookedById,
          startTime: data.startTime,
          endTime: data.endTime,
          purpose: data.purpose,
          status: BookingStatus.UPCOMING
        },
        include: { resource: true, bookedBy: true }
      })

      // 4. Log activity
      await tx.activityLog.create({
        data: {
          action: "RESOURCE_BOOK",
          newValue: {
            resourceName: resource.assetName,
            bookedBy: booking.bookedBy.name,
            startTime: data.startTime,
            endTime: data.endTime
          }
        }
      })

      return booking
    })
  }

  /**
   * Reschedule an existing booking with overlap checking
   */
  static async rescheduleBooking(
    id: string,
    data: {
      startTime: Date
      endTime: Date
    }
  ) {
    if (data.startTime >= data.endTime) {
      throw new Error("Start time must be before end time")
    }

    return await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id }
      })

      if (!booking) {
        throw new Error("Booking not found")
      }

      if (booking.status !== BookingStatus.UPCOMING) {
        throw new Error("Only upcoming bookings can be rescheduled")
      }

      // Overlap Check (excluding current booking)
      const overlappingBooking = await tx.booking.findFirst({
        where: {
          id: { not: id },
          resourceId: booking.resourceId,
          status: { in: [BookingStatus.UPCOMING, BookingStatus.ONGOING] },
          startTime: { lt: data.endTime },
          endTime: { gt: data.startTime }
        },
        include: { bookedBy: true }
      })

      if (overlappingBooking) {
        throw new Error(
          `Conflict: This resource is already booked by ${overlappingBooking.bookedBy.name} from ${overlappingBooking.startTime.toLocaleTimeString()} to ${overlappingBooking.endTime.toLocaleTimeString()}`
        )
      }

      return await tx.booking.update({
        where: { id },
        data: {
          startTime: data.startTime,
          endTime: data.endTime
        },
        include: { resource: true, bookedBy: true }
      })
    })
  }

  /**
   * Cancel a booking
   */
  static async cancelBooking(id: string) {
    return await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id },
        include: { resource: true, bookedBy: true }
      })

      if (!booking) {
        throw new Error("Booking not found")
      }

      if (booking.status === BookingStatus.COMPLETED || booking.status === BookingStatus.CANCELLED) {
        throw new Error("Booking is already finalized or cancelled")
      }

      const cancelledBooking = await tx.booking.update({
        where: { id },
        data: { status: BookingStatus.CANCELLED }
      })

      await tx.activityLog.create({
        data: {
          action: "RESOURCE_CANCEL_BOOK",
          newValue: {
            resourceName: booking.resource.assetName,
            bookedBy: booking.bookedBy.name,
            startTime: booking.startTime
          }
        }
      })

      return cancelledBooking
    })
  }

  /**
   * Get all bookings with filtering
   */
  static async getBookings(filters?: {
    resourceId?: string
    bookedById?: string
    status?: BookingStatus
    from?: Date
    to?: Date
    skip?: number
    take?: number
  }) {
    const where: any = {}

    if (filters?.resourceId) {
      where.resourceId = filters.resourceId
    }

    if (filters?.bookedById) {
      where.bookedById = filters.bookedById
    }

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.from || filters?.to) {
      where.startTime = {}
      if (filters.from) {
        where.startTime.gte = filters.from
      }
      if (filters.to) {
        where.startTime.lte = filters.to
      }
    }

    const [items, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          resource: true,
          bookedBy: {
            include: { department: true }
          }
        },
        orderBy: { startTime: "asc" },
        skip: filters?.skip,
        take: filters?.take,
      }),
      prisma.booking.count({ where })
    ])

    return { items, total }
  }
}
