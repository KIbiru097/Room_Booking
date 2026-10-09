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
  NavigationItemInput,
  NavigationService,
} from '../application/navigation.service';

const itemSchema = z.object({
  label: z.string().trim().min(1).max(80),
  icon: z.string().trim().max(40).nullable().optional(),
  route: z.string().trim().min(1).max(200),
  position: z.number().int().nonnegative().optional(),
  enabled: z.boolean().optional(),
  requiredPermission: z.string().trim().max(80).nullable().optional(),
  departmentId: z.string().min(1).nullable().optional(),
});
const updateSchema = itemSchema.partial();
class CreateNavigationItemDto extends createZodDto(itemSchema) {}
class UpdateNavigationItemDto extends createZodDto(updateSchema) {}
interface AuthedRequest {
  user: { sub: string; role: string };
}

@ApiTags('manager navigation')
@ApiBearerAuth()
@Roles(Role.MANAGER)
@Controller('manager/navigation')
export class ManagerNavigationController {
  constructor(private readonly navigation: NavigationService) {}
  @Get() @ApiOperation({ summary: 'List hotel navigation items' }) list(
    @Req() req: AuthedRequest,
  ) {
    return this.navigation.list(req.user);
  }
  @Post()
  @Permissions('navigation.customize')
  @ApiOperation({ summary: 'Add a hotel navigation item' })
  create(@Body() dto: CreateNavigationItemDto, @Req() req: AuthedRequest) {
    return this.navigation.create(dto, req.user);
  }
  @Patch(':id')
  @Permissions('navigation.customize')
  @ApiOperation({ summary: 'Update a hotel navigation item' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateNavigationItemDto,
    @Req() req: AuthedRequest,
  ) {
    return this.navigation.update(id, dto, req.user);
  }
  @Delete(':id')
  @Permissions('navigation.customize')
  @ApiOperation({ summary: 'Delete a custom navigation item' })
  remove(@Param('id') id: string, @Req() req: AuthedRequest) {
    return this.navigation.remove(id, req.user);
  }
  @Post('reset')
  @Permissions('navigation.customize')
  @ApiOperation({ summary: 'Reset hotel navigation to defaults' })
  reset(@Req() req: AuthedRequest) {
    return this.navigation.reset(req.user);
  }
}
