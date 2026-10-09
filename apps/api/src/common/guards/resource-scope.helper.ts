import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface ScopedActor {
  sub: string;
  role: string;
}

@Injectable()
export class ResourceScopeHelper {
  constructor(private db: PrismaService) {}

  /**
   * Resolve the single hotel owned by a manager. The database unique
   * constraint is the final guarantee; this helper keeps the invariant in
   * application code as well and gives callers a consistent error.
   */
  async getManagerHotel(userId: string) {
    const hotel = await this.db.hotel.findFirst({
      where: { managerId: userId },
      include: { city: { include: { country: true } } },
    });
    if (!hotel) {
      throw new ForbiddenException('No hotel is assigned to this manager');
    }
    return hotel;
  }

  async getManagerHotelId(userId: string): Promise<string> {
    const hotel = await this.db.hotel.findFirst({
      where: { managerId: userId },
      select: { id: true },
    });
    if (!hotel) {
      throw new ForbiddenException('No hotel is assigned to this manager');
    }
    return hotel.id;
  }

  /** Return only hotel IDs the actor is allowed to operate on. */
  async getAccessibleHotelIds(actor: ScopedActor): Promise<string[]> {
    if (actor.role === 'ADMIN') {
      const hotels = await this.db.hotel.findMany({ select: { id: true } });
      return hotels.map(({ id }) => id);
    }
    if (actor.role === 'MANAGER') {
      return [await this.getManagerHotelId(actor.sub)];
    }
    if (actor.role === 'STAFF') {
      return this.getStaffHotelIds(actor.sub);
    }
    throw new ForbiddenException(
      'Insufficient role permissions for hotel management',
    );
  }

  async assertManagerOwnsHotel(
    userId: string,
    userRole: string,
    hotelId: string,
  ): Promise<void> {
    if (userRole === 'ADMIN') return;
    if (userRole === 'MANAGER') {
      const hotel = await this.db.hotel.findFirst({
        where: { id: hotelId, managerId: userId },
      });
      if (!hotel) {
        throw new ForbiddenException(
          'Access denied: You do not manage this hotel',
        );
      }
      return;
    }
    if (userRole === 'STAFF') {
      await this.assertStaffAssignedToHotel(userId, hotelId);
      return;
    }
    throw new ForbiddenException(
      'Insufficient role permissions for hotel management',
    );
  }

  /** Alias for callers that need an explicit tenant-boundary name. */
  async assertHotelAccess(actor: ScopedActor, hotelId: string): Promise<void> {
    await this.assertManagerOwnsHotel(actor.sub, actor.role, hotelId);
  }

  async assertStaffAssignedToHotel(
    userId: string,
    hotelId: string,
  ): Promise<void> {
    const assignment = await this.db.staffHotel.findUnique({
      where: { staffId_hotelId: { staffId: userId, hotelId } },
    });
    if (!assignment) {
      throw new ForbiddenException(
        'Access denied: You are not assigned to this hotel',
      );
    }
  }

  async getStaffHotelIds(userId: string): Promise<string[]> {
    const assignments = await this.db.staffHotel.findMany({
      where: { staffId: userId },
      select: { hotelId: true },
    });
    return assignments.map((a) => a.hotelId);
  }

  /** Resolve a hotel from a child resource without leaking cross-tenant data. */
  async getRoomHotelId(roomId: string): Promise<string> {
    const room = await this.db.room.findUnique({
      where: { id: roomId },
      select: { hotelId: true },
    });
    if (!room) throw new NotFoundException('Room not found');
    return room.hotelId;
  }
}
