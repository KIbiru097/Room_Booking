import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CacheService } from '../../../common/cache/cache.service';
import { ResourceScopeHelper } from '../../../common/guards/resource-scope.helper';
import { AuditService } from '../../../common/services/audit.service';

export interface ManagerRoleActor {
  sub: string;
  role: string;
}

export interface CreateHotelRoleInput {
  name: string;
  description?: string;
  departmentId?: string;
  hotelId?: string;
  permissionKeys?: string[];
}

export interface UpdateHotelRoleInput {
  name?: string;
  description?: string;
  departmentId?: string | null;
  isActive?: boolean;
}

export interface AssignHotelRoleInput {
  roleId: string;
  startAt?: string;
  endAt?: string;
  hotelId?: string;
}

@Injectable()
export class ManagerRolesService {
  constructor(
    private readonly db: PrismaService,
    private readonly scope: ResourceScopeHelper,
    private readonly cache: CacheService,
    private readonly audit: AuditService,
  ) {}

  async listRoles(actor: ManagerRoleActor, hotelId?: string) {
    const scopedHotelId = await this.resolveHotelId(actor, hotelId);
    return this.db.hotelRole.findMany({
      where: { hotelId: scopedHotelId },
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
      include: {
        department: true,
        permissions: { include: { permission: true } },
        _count: { select: { assignments: true } },
      },
    });
  }

  async listPermissions() {
    return this.db.permission.findMany({
      orderBy: [{ module: 'asc' }, { action: 'asc' }],
    });
  }

  async getRole(id: string, actor: ManagerRoleActor, hotelId?: string) {
    const scopedHotelId = await this.resolveHotelId(actor, hotelId);
    const role = await this.db.hotelRole.findFirst({
      where: { id, hotelId: scopedHotelId },
      include: {
        department: true,
        permissions: { include: { permission: true } },
        assignments: {
          where: { OR: [{ endAt: null }, { endAt: { gt: new Date() } }] },
          include: {
            staff: { select: { id: true, fullName: true, email: true } },
          },
        },
      },
    });
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  async createRole(dto: CreateHotelRoleInput, actor: ManagerRoleActor) {
    const hotelId = await this.resolveHotelId(actor, dto.hotelId);
    const name = dto.name.trim();
    if (!name) throw new BadRequestException('Role name is required');
    await this.assertDepartmentBelongsToHotel(dto.departmentId, hotelId);
    const permissions = await this.resolvePermissions(dto.permissionKeys ?? []);

    try {
      const role = await this.db.hotelRole.create({
        data: {
          hotelId,
          name,
          description: dto.description?.trim() || null,
          departmentId: dto.departmentId ?? null,
          createdBy: actor.sub,
          permissions: {
            create: permissions.map((permissionId) => ({ permissionId })),
          },
        },
        include: { permissions: { include: { permission: true } } },
      });
      await this.audit.record(actor.sub, 'ROLE_CREATE', 'HotelRole', role.id, {
        hotelId,
        name,
        permissionKeys: dto.permissionKeys ?? [],
      });
      return role;
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('A role with this name already exists');
      }
      throw error;
    }
  }

  async updateRole(
    id: string,
    dto: UpdateHotelRoleInput,
    actor: ManagerRoleActor,
    hotelId?: string,
  ) {
    const scopedHotelId = await this.resolveHotelId(actor, hotelId);
    const existing = await this.db.hotelRole.findFirst({
      where: { id, hotelId: scopedHotelId },
    });
    if (!existing) throw new NotFoundException('Role not found');
    if (existing.isSystem && dto.name !== undefined) {
      throw new ForbiddenException('System role names cannot be changed');
    }
    await this.assertDepartmentBelongsToHotel(dto.departmentId, scopedHotelId);
    try {
      const updated = await this.db.hotelRole.update({
        where: { id },
        data: {
          ...(dto.name === undefined ? {} : { name: dto.name.trim() }),
          ...(dto.description === undefined
            ? {}
            : { description: dto.description?.trim() || null }),
          ...(dto.departmentId === undefined
            ? {}
            : { departmentId: dto.departmentId }),
          ...(dto.isActive === undefined ? {} : { isActive: dto.isActive }),
        },
      });
      await this.invalidateRoleAssignments(id);
      await this.audit.record(actor.sub, 'ROLE_UPDATE', 'HotelRole', id, {
        ...dto,
      });
      return updated;
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('A role with this name already exists');
      }
      throw error;
    }
  }

  async deleteRole(id: string, actor: ManagerRoleActor, hotelId?: string) {
    const scopedHotelId = await this.resolveHotelId(actor, hotelId);
    const role = await this.db.hotelRole.findFirst({
      where: { id, hotelId: scopedHotelId },
    });
    if (!role) throw new NotFoundException('Role not found');
    if (role.isSystem)
      throw new ForbiddenException('System roles cannot be deleted');
    const assignments = await this.db.staffRoleAssignment.count({
      where: { roleId: id },
    });
    if (assignments > 0) {
      throw new ConflictException(
        'Remove staff assignments before deleting this role',
      );
    }
    await this.db.hotelRole.delete({ where: { id } });
    await this.audit.record(actor.sub, 'ROLE_DELETE', 'HotelRole', id, {
      hotelId: scopedHotelId,
    });
    return { deleted: true };
  }

  async updateRolePermissions(
    id: string,
    permissionKeys: string[],
    actor: ManagerRoleActor,
    hotelId?: string,
  ) {
    const scopedHotelId = await this.resolveHotelId(actor, hotelId);
    const role = await this.db.hotelRole.findFirst({
      where: { id, hotelId: scopedHotelId },
    });
    if (!role) throw new NotFoundException('Role not found');
    const permissionIds = await this.resolvePermissions(permissionKeys);
    await this.db.$transaction(async (tx) => {
      await tx.hotelRolePermission.deleteMany({ where: { roleId: id } });
      if (permissionIds.length) {
        await tx.hotelRolePermission.createMany({
          data: permissionIds.map((permissionId) => ({
            roleId: id,
            permissionId,
          })),
        });
      }
    });
    await this.invalidateRoleAssignments(id);
    await this.audit.record(
      actor.sub,
      'ROLE_PERMISSIONS_UPDATE',
      'HotelRole',
      id,
      {
        hotelId: scopedHotelId,
        permissionKeys,
      },
    );
    return this.getRole(id, actor, scopedHotelId);
  }

  async assignStaffRole(
    staffId: string,
    dto: AssignHotelRoleInput,
    actor: ManagerRoleActor,
  ) {
    const role = await this.db.hotelRole.findUnique({
      where: { id: dto.roleId },
      select: { id: true, hotelId: true, isActive: true },
    });
    if (!role) throw new NotFoundException('Role not found');
    if (!role.isActive)
      throw new ConflictException('Cannot assign an inactive role');
    await this.scope.assertManagerOwnsHotel(
      actor.sub,
      actor.role,
      role.hotelId,
    );
    const staff = await this.db.staffHotel.findUnique({
      where: { staffId_hotelId: { staffId, hotelId: role.hotelId } },
      select: { staffId: true },
    });
    if (!staff)
      throw new ForbiddenException(
        'Staff member is not assigned to this hotel',
      );
    const user = await this.db.user.findUnique({
      where: { id: staffId },
      select: { role: true },
    });
    if (!user || user.role !== 'STAFF')
      throw new BadRequestException('Only STAFF users can receive hotel roles');
    const startAt = dto.startAt ? new Date(dto.startAt) : new Date();
    const endAt = dto.endAt ? new Date(dto.endAt) : null;
    if (
      Number.isNaN(startAt.getTime()) ||
      (endAt && Number.isNaN(endAt.getTime()))
    ) {
      throw new BadRequestException('Role assignment dates are invalid');
    }
    if (endAt && endAt <= startAt) {
      throw new BadRequestException('Role endAt must be after startAt');
    }
    try {
      const assignment = await this.db.staffRoleAssignment.create({
        data: {
          staffId,
          roleId: role.id,
          hotelId: role.hotelId,
          startAt,
          endAt,
          assignedBy: actor.sub,
        },
        include: {
          role: true,
          staff: { select: { id: true, fullName: true, email: true } },
        },
      });
      await this.invalidateUser(staffId);
      await this.audit.record(
        actor.sub,
        'STAFF_ROLE_ASSIGN',
        'StaffRoleAssignment',
        assignment.id,
        {
          staffId,
          roleId: role.id,
          hotelId: role.hotelId,
        },
      );
      return assignment;
    } catch (error) {
      if (this.isUniqueViolation(error))
        throw new ConflictException(
          'This role is already assigned to the staff member',
        );
      throw error;
    }
  }

  async removeStaffRole(
    staffId: string,
    roleId: string,
    actor: ManagerRoleActor,
    hotelId?: string,
  ) {
    const scopedHotelId = await this.resolveHotelId(actor, hotelId);
    const assignment = await this.db.staffRoleAssignment.findFirst({
      where: { staffId, roleId, hotelId: scopedHotelId },
      select: { id: true },
    });
    if (!assignment) throw new NotFoundException('Role assignment not found');
    await this.db.staffRoleAssignment.delete({ where: { id: assignment.id } });
    await this.invalidateUser(staffId);
    await this.audit.record(
      actor.sub,
      'STAFF_ROLE_REMOVE',
      'StaffRoleAssignment',
      assignment.id,
      {
        staffId,
        roleId,
        hotelId: scopedHotelId,
      },
    );
    return { removed: true };
  }

  async staffRoles(staffId: string, actor: ManagerRoleActor, hotelId?: string) {
    const scopedHotelId = await this.resolveHotelId(actor, hotelId);
    const staff = await this.db.staffHotel.findUnique({
      where: { staffId_hotelId: { staffId, hotelId: scopedHotelId } },
      select: { staffId: true },
    });
    if (!staff)
      throw new ForbiddenException(
        'Staff member is not assigned to this hotel',
      );
    return this.db.staffRoleAssignment.findMany({
      where: { staffId, hotelId: scopedHotelId },
      include: {
        role: { include: { permissions: { include: { permission: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async resolveHotelId(
    actor: ManagerRoleActor,
    requestedHotelId?: string,
  ) {
    if (actor.role === 'MANAGER') {
      const ownHotelId = await this.scope.getManagerHotelId(actor.sub);
      if (requestedHotelId && requestedHotelId !== ownHotelId) {
        throw new ForbiddenException('You do not manage this hotel');
      }
      return ownHotelId;
    }
    if (actor.role === 'ADMIN') {
      if (!requestedHotelId)
        throw new BadRequestException(
          'hotelId is required for admin operations',
        );
      const hotel = await this.db.hotel.findUnique({
        where: { id: requestedHotelId },
        select: { id: true },
      });
      if (!hotel) throw new NotFoundException('Hotel not found');
      return hotel.id;
    }
    throw new ForbiddenException(
      'Only managers and admins can manage hotel roles',
    );
  }

  private async resolvePermissions(keys: string[]) {
    const uniqueKeys = [
      ...new Set(keys.map((key) => key.trim()).filter(Boolean)),
    ];
    if (!uniqueKeys.length) return [];
    const records = await this.db.permission.findMany({
      where: { key: { in: uniqueKeys } },
      select: { id: true, key: true },
    });
    if (records.length !== uniqueKeys.length) {
      const known = new Set(records.map((record) => record.key));
      throw new BadRequestException(
        `Unknown permission: ${uniqueKeys.find((key) => !known.has(key))}`,
      );
    }
    return records.map((record) => record.id);
  }

  private async assertDepartmentBelongsToHotel(
    departmentId: string | null | undefined,
    hotelId: string,
  ) {
    if (!departmentId) return;
    const department = await this.db.department.findFirst({
      where: { id: departmentId, hotelId, isActive: true },
      select: { id: true },
    });
    if (!department)
      throw new BadRequestException('Department does not belong to this hotel');
  }

  private async invalidateRoleAssignments(roleId: string) {
    const assignments = await this.db.staffRoleAssignment.findMany({
      where: { roleId },
      select: { staffId: true },
    });
    await Promise.all(
      assignments.map(({ staffId }) => this.invalidateUser(staffId)),
    );
  }

  private invalidateUser(userId: string) {
    return this.cache.delPattern(`permissions:${userId}:*`);
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      error instanceof Error &&
      'code' in error &&
      (error as { code?: string }).code === 'P2002'
    );
  }
}
