import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { Role } from '../../../generated/prisma/client';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import {
  AssignHotelRoleInput,
  CreateHotelRoleInput,
  ManagerRoleActor,
  ManagerRolesService,
  UpdateHotelRoleInput,
} from '../application/manager-roles.service';

const roleQuerySchema = z.object({ hotelId: z.string().min(1).optional() });
const createRoleSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(500).optional(),
  departmentId: z.string().min(1).optional(),
  hotelId: z.string().min(1).optional(),
  permissionKeys: z.array(z.string().min(1)).max(100).optional(),
});
const updateRoleSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  description: z.string().trim().max(500).nullable().optional(),
  departmentId: z.string().min(1).nullable().optional(),
  isActive: z.boolean().optional(),
});
const permissionsSchema = z.object({
  permissionKeys: z.array(z.string().min(1)).max(100),
});
const assignRoleSchema = z.object({
  roleId: z.string().min(1),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  hotelId: z.string().min(1).optional(),
});

class RoleQueryDto extends createZodDto(roleQuerySchema) {}
class CreateRoleDto extends createZodDto(createRoleSchema) {}
class UpdateRoleDto extends createZodDto(updateRoleSchema) {}
class UpdateRolePermissionsDto extends createZodDto(permissionsSchema) {}
class AssignRoleDto extends createZodDto(assignRoleSchema) {}

interface AuthedRequest {
  user: ManagerRoleActor;
}

@ApiTags('manager roles and permissions')
@ApiBearerAuth()
@Roles(Role.MANAGER, Role.ADMIN)
@Controller('manager')
export class ManagerRolesController {
  constructor(private readonly roles: ManagerRolesService) {}

  @Get('roles')
  @ApiOperation({ summary: 'List hotel-scoped roles' })
  listRoles(@Query() query: RoleQueryDto, @Req() req: AuthedRequest) {
    return this.roles.listRoles(req.user, query.hotelId);
  }

  @Get('roles/permissions')
  @ApiOperation({ summary: 'List the system permission catalog' })
  listPermissions() {
    return this.roles.listPermissions();
  }

  @Post('roles')
  @Permissions('role.manage')
  @ApiOperation({ summary: 'Create a hotel role' })
  createRole(@Body() dto: CreateRoleDto, @Req() req: AuthedRequest) {
    return this.roles.createRole(dto, req.user);
  }

  @Get('roles/:id')
  @ApiOperation({ summary: 'Get a hotel role and assignments' })
  getRole(
    @Param('id') id: string,
    @Query() query: RoleQueryDto,
    @Req() req: AuthedRequest,
  ) {
    return this.roles.getRole(id, req.user, query.hotelId);
  }

  @Patch('roles/:id')
  @Permissions('role.manage')
  @ApiOperation({ summary: 'Update a hotel role' })
  updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
    @Query() query: RoleQueryDto,
    @Req() req: AuthedRequest,
  ) {
    return this.roles.updateRole(
      id,
      dto as UpdateHotelRoleInput,
      req.user,
      query.hotelId,
    );
  }

  @Delete('roles/:id')
  @Permissions('role.manage')
  @ApiOperation({ summary: 'Delete an unassigned custom role' })
  deleteRole(
    @Param('id') id: string,
    @Query() query: RoleQueryDto,
    @Req() req: AuthedRequest,
  ) {
    return this.roles.deleteRole(id, req.user, query.hotelId);
  }

  @Put('roles/:id/permissions')
  @Permissions('role.manage')
  @ApiOperation({ summary: 'Replace a role permission set' })
  updateRolePermissions(
    @Param('id') id: string,
    @Body() dto: UpdateRolePermissionsDto,
    @Query() query: RoleQueryDto,
    @Req() req: AuthedRequest,
  ) {
    return this.roles.updateRolePermissions(
      id,
      dto.permissionKeys,
      req.user,
      query.hotelId,
    );
  }

  @Get('staff/:staffId/roles')
  @ApiOperation({
    summary: 'List active and historical staff role assignments',
  })
  staffRoles(
    @Param('staffId') staffId: string,
    @Query() query: RoleQueryDto,
    @Req() req: AuthedRequest,
  ) {
    return this.roles.staffRoles(staffId, req.user, query.hotelId);
  }

  @Post('staff/:staffId/roles')
  @Permissions('staff.assign_role')
  @ApiOperation({ summary: 'Assign a hotel role to staff' })
  assignStaffRole(
    @Param('staffId') staffId: string,
    @Body() dto: AssignRoleDto,
    @Req() req: AuthedRequest,
  ) {
    return this.roles.assignStaffRole(staffId, dto, req.user);
  }

  @Delete('staff/:staffId/roles/:roleId')
  @Permissions('staff.assign_role')
  @ApiOperation({ summary: 'Remove a hotel role from staff' })
  removeStaffRole(
    @Param('staffId') staffId: string,
    @Param('roleId') roleId: string,
    @Query() query: RoleQueryDto,
    @Req() req: AuthedRequest,
  ) {
    return this.roles.removeStaffRole(staffId, roleId, req.user, query.hotelId);
  }
}
