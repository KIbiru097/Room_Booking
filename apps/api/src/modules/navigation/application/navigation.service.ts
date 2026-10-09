import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { ResourceScopeHelper } from '../../../common/guards/resource-scope.helper';
import { AuditService } from '../../../common/services/audit.service';

export interface NavigationActor {
  sub: string;
  role: string;
}
export interface NavigationItemInput {
  label: string;
  icon?: string | null;
  route: string;
  position?: number;
  enabled?: boolean;
  requiredPermission?: string | null;
  departmentId?: string | null;
}

const SAFE_ROUTES = new Set([
  '/manager',
  '/manager/roles',
  '/manager/dashboard',
  '/manager/coupons',
  '/manager/settings/navigation',
  ...[
    'Hotels',
    'Rooms',
    'Pricing',
    'Availability',
    'Policies',
    'Staff',
    'Reports',
    'Bookings',
    'Reviews',
  ].map((tab) => `/manager?tab=${tab}`),
]);
const DEFAULT_ITEMS = [
  {
    label: 'Dashboard',
    icon: 'LayoutDashboard',
    route: '/manager',
    position: 0,
  },
  {
    label: 'Roles & permissions',
    icon: 'ShieldCheck',
    route: '/manager/roles',
    position: 1,
  },
  {
    label: 'Dashboard layouts',
    icon: 'LayoutDashboard',
    route: '/manager/dashboard',
    position: 2,
  },
  {
    label: 'Hotel coupons',
    icon: 'Tag',
    route: '/manager/coupons',
    position: 3,
  },
  {
    label: 'Navigation builder',
    icon: 'Menu',
    route: '/manager/settings/navigation',
    position: 4,
  },
] as const;

@Injectable()
export class NavigationService {
  constructor(
    private readonly db: PrismaService,
    private readonly scope: ResourceScopeHelper,
    private readonly audit: AuditService,
  ) {}

  async list(actor: NavigationActor) {
    const hotelId = await this.hotelId(actor);
    await this.ensureDefaults(hotelId);
    return this.db.navigationItem.findMany({
      where: { hotelId },
      include: { department: true },
      orderBy: [{ position: 'asc' }, { label: 'asc' }],
    });
  }

  async create(dto: NavigationItemInput, actor: NavigationActor) {
    const hotelId = await this.hotelId(actor);
    const data = await this.normalize(dto, hotelId);
    const position = dto.position ?? (await this.nextPosition(hotelId));
    try {
      const item = await this.db.navigationItem.create({
        data: {
          ...data,
          hotelId,
          position,
          isSystem: false,
        } as Prisma.NavigationItemUncheckedCreateInput,
        include: { department: true },
      });
      this.audit.record(
        actor.sub,
        'NAVIGATION_ITEM_CREATE',
        'NavigationItem',
        item.id,
        { hotelId, route: item.route },
      );
      return item;
    } catch (error) {
      if (this.isUnique(error))
        throw new ConflictException(
          'A navigation item for this route already exists',
        );
      throw error;
    }
  }

  async update(
    id: string,
    dto: Partial<NavigationItemInput>,
    actor: NavigationActor,
  ) {
    const hotelId = await this.hotelId(actor);
    const existing = await this.find(id, hotelId);
    if (
      existing.isSystem &&
      (dto.route !== undefined || dto.departmentId !== undefined)
    )
      throw new ForbiddenException(
        'System navigation routes cannot be changed',
      );
    const data = await this.normalize(dto, hotelId, true);
    try {
      const item = await this.db.navigationItem.update({
        where: { id },
        data: {
          ...data,
          ...(dto.position === undefined ? {} : { position: dto.position }),
          ...(dto.enabled === undefined ? {} : { enabled: dto.enabled }),
        },
        include: { department: true },
      });
      this.audit.record(
        actor.sub,
        'NAVIGATION_ITEM_UPDATE',
        'NavigationItem',
        id,
        { hotelId, changed: Object.keys(dto) },
      );
      return item;
    } catch (error) {
      if (this.isUnique(error))
        throw new ConflictException(
          'A navigation item for this route already exists',
        );
      throw error;
    }
  }

  async remove(id: string, actor: NavigationActor) {
    const hotelId = await this.hotelId(actor);
    const existing = await this.find(id, hotelId);
    if (existing.isSystem)
      throw new ForbiddenException('System navigation items cannot be deleted');
    await this.db.navigationItem.delete({ where: { id } });
    this.audit.record(
      actor.sub,
      'NAVIGATION_ITEM_DELETE',
      'NavigationItem',
      id,
      { hotelId },
    );
    return { deleted: true };
  }

  async reset(actor: NavigationActor) {
    const hotelId = await this.hotelId(actor);
    await this.db.$transaction(async (tx) => {
      await tx.navigationItem.deleteMany({
        where: { hotelId, isSystem: false },
      });
      for (const item of DEFAULT_ITEMS) {
        await tx.navigationItem.upsert({
          where: { hotelId_route: { hotelId, route: item.route } },
          create: { ...item, hotelId, isSystem: true },
          update: { ...item, enabled: true, isSystem: true },
        });
      }
    });
    this.audit.record(
      actor.sub,
      'NAVIGATION_ITEM_RESET',
      'NavigationItem',
      hotelId,
      { hotelId },
    );
    return this.list(actor);
  }

  private async hotelId(actor: NavigationActor) {
    if (actor.role !== 'MANAGER')
      throw new ForbiddenException(
        'Only hotel managers can configure navigation',
      );
    return this.scope.getManagerHotelId(actor.sub);
  }

  private async ensureDefaults(hotelId: string) {
    // One lightweight read instead of an upsert per default row: a hot GET
    // must not turn into five writes on every sidebar load.
    const existing = await this.db.navigationItem.findMany({
      where: { hotelId },
      select: { route: true },
    });
    const present = new Set(existing.map((item) => item.route));
    const missing = DEFAULT_ITEMS.filter((item) => !present.has(item.route));
    if (!missing.length) return;
    await this.db.navigationItem.createMany({
      data: missing.map((item) => ({ ...item, hotelId, isSystem: true })),
      skipDuplicates: true,
    });
  }

  private async nextPosition(hotelId: string) {
    const last = await this.db.navigationItem.findFirst({
      where: { hotelId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });
    return (last?.position ?? -1) + 1;
  }

  private async find(id: string, hotelId: string) {
    const item = await this.db.navigationItem.findFirst({
      where: { id, hotelId },
    });
    if (!item) throw new NotFoundException('Navigation item not found');
    return item;
  }

  private async normalize(
    dto: Partial<NavigationItemInput>,
    hotelId: string,
    partial = false,
  ) {
    if (!partial && (!dto.label?.trim() || !dto.route))
      throw new BadRequestException('Navigation label and route are required');
    if (
      dto.label !== undefined &&
      (!dto.label.trim() || dto.label.trim().length > 80)
    )
      throw new BadRequestException('Navigation label must be 1-80 characters');
    if (dto.route !== undefined && !SAFE_ROUTES.has(dto.route))
      throw new BadRequestException(
        'That route is not allowed in manager navigation',
      );
    if (dto.icon !== undefined && dto.icon !== null && dto.icon.length > 40)
      throw new BadRequestException('Navigation icon is too long');
    if (
      dto.requiredPermission !== undefined &&
      dto.requiredPermission !== null
    ) {
      if (!/^[a-z][a-z0-9_.-]{1,79}$/.test(dto.requiredPermission))
        throw new BadRequestException('Invalid required permission');
      const permission = await this.db.permission.findUnique({
        where: { key: dto.requiredPermission },
        select: { key: true },
      });
      if (!permission)
        throw new BadRequestException('Required permission does not exist');
    }
    if (dto.departmentId !== undefined && dto.departmentId !== null) {
      const department = await this.db.department.findFirst({
        where: { id: dto.departmentId, hotelId },
        select: { id: true },
      });
      if (!department)
        throw new BadRequestException(
          'Department does not belong to this hotel',
        );
    }
    return {
      ...(dto.label === undefined ? {} : { label: dto.label.trim() }),
      ...(dto.icon === undefined ? {} : { icon: dto.icon?.trim() || null }),
      ...(dto.route === undefined ? {} : { route: dto.route }),
      ...(dto.requiredPermission === undefined
        ? {}
        : { requiredPermission: dto.requiredPermission?.trim() || null }),
      ...(dto.departmentId === undefined
        ? {}
        : { departmentId: dto.departmentId }),
    };
  }

  private isUnique(error: unknown) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }
}
