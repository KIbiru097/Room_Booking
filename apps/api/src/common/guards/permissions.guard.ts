import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CacheService } from '../cache/cache.service';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { ResourceScopeHelper } from './resource-scope.helper';
import { PrismaService } from '../../prisma/prisma.service';

interface PermissionRequest {
  user?: { sub: string; role: string };
  params?: { hotelId?: string; id?: string };
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly db: PrismaService,
    private readonly cache: CacheService,
    private readonly scope: ResourceScopeHelper,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required?.length) return true;

    const request = context.switchToHttp().getRequest<PermissionRequest>();
    const user = request.user;
    if (!user) return false;
    // Managers already have full authority over their own hotel. Custom
    // permissions refine STAFF access without creating a bootstrap deadlock
    // where a manager needs a role assignment to create role assignments.
    if (user.role === 'ADMIN' || user.role === 'MANAGER') return true;

    const hotelIds = await this.scope.getAccessibleHotelIds(user);
    const requestedHotelId = request.params?.hotelId;
    const scopedHotelIds = requestedHotelId
      ? hotelIds.filter((id) => id === requestedHotelId)
      : hotelIds;
    if (!scopedHotelIds.length) return false;

    const permissions = await this.getEffectivePermissions(
      user.sub,
      scopedHotelIds,
    );
    return required.every((permission) => permissions.has(permission));
  }

  private async getEffectivePermissions(
    userId: string,
    hotelIds: string[],
  ): Promise<Set<string>> {
    const normalizedHotelIds = [...hotelIds].sort();
    const cacheKey = `permissions:${userId}:${normalizedHotelIds.join(',')}`;
    const cached = await this.cache.get<string[]>(cacheKey);
    if (cached) return new Set(cached);

    const assignments = await this.db.staffRoleAssignment.findMany({
      where: {
        staffId: userId,
        hotelId: { in: normalizedHotelIds },
        startAt: { lte: new Date() },
        OR: [{ endAt: null }, { endAt: { gt: new Date() } }],
        role: { isActive: true },
      },
      select: {
        role: {
          select: {
            permissions: { select: { permission: { select: { key: true } } } },
          },
        },
      },
    });

    const result = new Set<string>();
    for (const assignment of assignments) {
      for (const rolePermission of assignment.role.permissions) {
        result.add(rolePermission.permission.key);
      }
    }
    // Existing installations may have StaffHotel rows created before
    // hotel-scoped roles were introduced. Keep those staff operational with
    // the least-privilege legacy front-desk set until a custom role is saved.
    if (!assignments.length) {
      const legacyAssignment = await this.db.staffHotel.findFirst({
        where: { staffId: userId, hotelId: { in: normalizedHotelIds } },
        select: { staffId: true },
      });
      if (legacyAssignment) {
        for (const permission of [
          'booking.view',
          'booking.create',
          'booking.checkin',
          'booking.checkout',
          'guest.view',
          'guest.create',
          'guest.edit',
          'room.view',
          'payment.view',
        ]) {
          result.add(permission);
        }
      }
    }
    await this.cache.set(cacheKey, [...result], 300);
    return result;
  }
}
