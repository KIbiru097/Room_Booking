import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { ResourceScopeHelper } from '../../../common/guards/resource-scope.helper';
import { AuditService } from '../../../common/services/audit.service';

const ALLOWED_LAYOUTS = ['compact', 'standard', 'spacious'] as const;
type DashboardLayoutMode = (typeof ALLOWED_LAYOUTS)[number];

export interface DashboardWidgetInput {
  key: string;
  title?: string | null;
  config?: unknown;
  position?: number;
  isVisible?: boolean;
}

export interface CreateDashboardLayoutInput {
  name: string;
  layout?: string;
  isDefault?: boolean;
  widgets?: DashboardWidgetInput[];
}

export interface UpdateDashboardLayoutInput {
  name?: string;
  layout?: string;
  isDefault?: boolean;
  widgets?: DashboardWidgetInput[];
}

interface ManagerActor {
  sub: string;
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly db: PrismaService,
    private readonly scope: ResourceScopeHelper,
    private readonly audit: AuditService,
  ) {}

  async listLayouts(actor: ManagerActor) {
    const hotelId = await this.scope.getManagerHotelId(actor.sub);
    return this.db.dashboardLayout.findMany({
      where: { hotelId },
      include: { widgets: { orderBy: { position: 'asc' } } },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  }

  async getLayout(id: string, actor: ManagerActor) {
    const hotelId = await this.scope.getManagerHotelId(actor.sub);
    return this.assertLayout(id, hotelId);
  }

  async createLayout(dto: CreateDashboardLayoutInput, actor: ManagerActor) {
    const hotelId = await this.scope.getManagerHotelId(actor.sub);
    const data = this.normalizeLayout(dto);

    try {
      const layout = await this.db.$transaction(async (tx) => {
        if (data.isDefault) {
          await tx.dashboardLayout.updateMany({
            where: { hotelId },
            data: { isDefault: false },
          });
        }
        return tx.dashboardLayout.create({
          data: {
            hotelId,
            userId: actor.sub,
            name: data.name,
            layout: data.layout,
            isDefault: data.isDefault,
            widgets: {
              create: data.widgets.map((widget) =>
                this.widgetCreateData(widget),
              ),
            },
          },
          include: { widgets: { orderBy: { position: 'asc' } } },
        });
      });
      await this.audit.record(
        actor.sub,
        'DASHBOARD_LAYOUT_CREATE',
        'DashboardLayout',
        layout.id,
        {
          hotelId,
          name: layout.name,
        },
      );
      return layout;
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException(
          'A dashboard layout with this name already exists',
        );
      }
      throw error;
    }
  }

  async updateLayout(
    id: string,
    dto: UpdateDashboardLayoutInput,
    actor: ManagerActor,
  ) {
    const hotelId = await this.scope.getManagerHotelId(actor.sub);
    await this.assertLayout(id, hotelId);
    const data = this.normalizeUpdate(dto);

    try {
      const layout = await this.db.$transaction(async (tx) => {
        if (data.isDefault === true) {
          await tx.dashboardLayout.updateMany({
            where: { hotelId, id: { not: id } },
            data: { isDefault: false },
          });
        }
        if (data.widgets !== undefined) {
          await tx.dashboardWidget.deleteMany({ where: { layoutId: id } });
          for (const widget of data.widgets) {
            await tx.dashboardWidget.create({
              data: { layoutId: id, ...this.widgetCreateData(widget) },
            });
          }
        }
        return tx.dashboardLayout.update({
          where: { id },
          data: {
            ...(data.name === undefined ? {} : { name: data.name }),
            ...(data.layout === undefined ? {} : { layout: data.layout }),
            ...(data.isDefault === undefined
              ? {}
              : { isDefault: data.isDefault }),
          },
          include: { widgets: { orderBy: { position: 'asc' } } },
        });
      });
      await this.audit.record(
        actor.sub,
        'DASHBOARD_LAYOUT_UPDATE',
        'DashboardLayout',
        id,
        {
          hotelId,
          changedWidgets: data.widgets !== undefined,
        },
      );
      return layout;
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException(
          'A dashboard layout with this name already exists',
        );
      }
      throw error;
    }
  }

  async deleteLayout(id: string, actor: ManagerActor) {
    const hotelId = await this.scope.getManagerHotelId(actor.sub);
    const existing = await this.assertLayout(id, hotelId);

    await this.db.$transaction(async (tx) => {
      await tx.dashboardLayout.delete({ where: { id } });
      if (existing.isDefault) {
        const replacement = await tx.dashboardLayout.findFirst({
          where: { hotelId },
          orderBy: { name: 'asc' },
          select: { id: true },
        });
        if (replacement) {
          await tx.dashboardLayout.update({
            where: { id: replacement.id },
            data: { isDefault: true },
          });
        }
      }
    });
    await this.audit.record(
      actor.sub,
      'DASHBOARD_LAYOUT_DELETE',
      'DashboardLayout',
      id,
      { hotelId },
    );
    return { deleted: true };
  }

  private async assertLayout(id: string, hotelId: string) {
    const layout = await this.db.dashboardLayout.findFirst({
      where: { id, hotelId },
      include: { widgets: { orderBy: { position: 'asc' } } },
    });
    if (!layout) throw new NotFoundException('Dashboard layout not found');
    return layout;
  }

  private normalizeLayout(dto: CreateDashboardLayoutInput) {
    const name = dto.name.trim();
    if (!name)
      throw new BadRequestException('Dashboard layout name is required');
    return {
      name,
      layout: this.normalizeMode(dto.layout),
      isDefault: dto.isDefault ?? false,
      widgets: this.normalizeWidgets(dto.widgets),
    };
  }

  private normalizeUpdate(dto: UpdateDashboardLayoutInput) {
    const name = dto.name === undefined ? undefined : dto.name.trim();
    if (name === '')
      throw new BadRequestException('Dashboard layout name is required');
    return {
      name,
      layout:
        dto.layout === undefined ? undefined : this.normalizeMode(dto.layout),
      isDefault: dto.isDefault,
      widgets:
        dto.widgets === undefined
          ? undefined
          : this.normalizeWidgets(dto.widgets),
    };
  }

  private normalizeMode(value?: string): DashboardLayoutMode {
    const mode = value ?? 'standard';
    if (!ALLOWED_LAYOUTS.includes(mode as DashboardLayoutMode)) {
      throw new BadRequestException(
        `Layout must be one of: ${ALLOWED_LAYOUTS.join(', ')}`,
      );
    }
    return mode as DashboardLayoutMode;
  }

  private normalizeWidgets(widgets?: DashboardWidgetInput[]) {
    if (!widgets) return [];
    const seen = new Set<string>();
    return widgets.map((widget, index) => {
      const key = widget.key.trim();
      if (!key || key.length > 80 || seen.has(key)) {
        throw new BadRequestException(
          'Dashboard widget keys must be unique and non-empty',
        );
      }
      seen.add(key);
      if (
        widget.position !== undefined &&
        (!Number.isInteger(widget.position) || widget.position < 0)
      ) {
        throw new BadRequestException(
          'Dashboard widget positions must be non-negative integers',
        );
      }
      return {
        key,
        title: widget.title?.trim() || null,
        config: widget.config,
        position: widget.position ?? index,
        isVisible: widget.isVisible ?? true,
      };
    });
  }

  private widgetCreateData(
    widget: ReturnType<DashboardService['normalizeWidgets']>[number],
  ) {
    return {
      key: widget.key,
      title: widget.title,
      position: widget.position,
      isVisible: widget.isVisible,
      ...(widget.config === undefined
        ? {}
        : { config: this.toJsonValue(widget.config) }),
    };
  }

  private toJsonValue(
    value: unknown,
  ): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
    if (value === null) return Prisma.JsonNull;
    if (typeof value !== 'object') {
      throw new BadRequestException(
        'Dashboard widget config must be a JSON object or array',
      );
    }
    return value;
  }

  private isUniqueViolation(error: unknown) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }
}
