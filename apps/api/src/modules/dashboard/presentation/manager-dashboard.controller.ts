import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { Role } from '../../../generated/prisma/client';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import {
  CreateDashboardLayoutInput,
  DashboardService,
  UpdateDashboardLayoutInput,
} from '../application/dashboard.service';

const widgetSchema = z.object({
  key: z.string().trim().min(1).max(80),
  title: z.string().trim().max(120).nullable().optional(),
  config: z.unknown().optional(),
  position: z.number().int().nonnegative().optional(),
  isVisible: z.boolean().optional(),
});
const createLayoutSchema = z.object({
  name: z.string().trim().min(2).max(80),
  layout: z.enum(['compact', 'standard', 'spacious']).optional(),
  isDefault: z.boolean().optional(),
  widgets: z.array(widgetSchema).max(50).optional(),
});
const updateLayoutSchema = createLayoutSchema.partial();

class CreateLayoutDto extends createZodDto(createLayoutSchema) {}
class UpdateLayoutDto extends createZodDto(updateLayoutSchema) {}

interface AuthedRequest {
  user: { sub: string };
}

@ApiTags('manager dashboard configuration')
@ApiBearerAuth()
@Roles(Role.MANAGER)
@Controller('manager/dashboard')
export class ManagerDashboardController {
  constructor(private readonly dashboards: DashboardService) {}

  @Get('layouts')
  @ApiOperation({ summary: 'List dashboard layouts for the manager hotel' })
  list(@Req() req: AuthedRequest) {
    return this.dashboards.listLayouts(req.user);
  }

  @Get('layouts/:id')
  @ApiOperation({ summary: 'Get a dashboard layout for the manager hotel' })
  get(@Param('id') id: string, @Req() req: AuthedRequest) {
    return this.dashboards.getLayout(id, req.user);
  }

  @Post('layouts')
  @Permissions('dashboard.customize')
  @ApiOperation({ summary: 'Create a dashboard layout for the manager hotel' })
  create(@Body() dto: CreateLayoutDto, @Req() req: AuthedRequest) {
    return this.dashboards.createLayout(dto, req.user);
  }

  @Patch('layouts/:id')
  @Permissions('dashboard.customize')
  @ApiOperation({ summary: 'Update a dashboard layout for the manager hotel' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateLayoutDto,
    @Req() req: AuthedRequest,
  ) {
    return this.dashboards.updateLayout(id, dto, req.user);
  }

  @Delete('layouts/:id')
  @Permissions('dashboard.customize')
  @ApiOperation({ summary: 'Delete a dashboard layout for the manager hotel' })
  remove(@Param('id') id: string, @Req() req: AuthedRequest) {
    return this.dashboards.deleteLayout(id, req.user);
  }
}
