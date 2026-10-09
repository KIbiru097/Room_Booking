import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '../../../generated/prisma/client';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AdminContentService } from '../application/admin-content.service';
import {
  ContentListDto,
  CreateContentCityDto,
  CreateContentPlaceDto,
  CreateContentSourceDto,
  CreateKnowledgeDocumentDto,
  UpdateContentCityDto,
  UpdateContentPlaceDto,
  UpdateContentPlaceStatusDto,
  UpdateContentSourceDto,
  UpdateKnowledgeDocumentDto,
} from './dto/admin-content.dto';

interface AuthedRequest {
  user: { sub: string };
}

@ApiTags('admin-content')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('admin/content')
export class AdminContentController {
  constructor(private readonly content: AdminContentService) {}

  @Get('countries')
  @ApiOperation({ summary: 'List countries for content onboarding' })
  countries() {
    return this.content.listCountries();
  }

  @Get('cities')
  @ApiOperation({ summary: 'List cities and content counts' })
  cities() {
    return this.content.listCities();
  }

  @Post('cities')
  createCity(@Body() dto: CreateContentCityDto, @Req() req: AuthedRequest) {
    return this.content.createCity(dto, req.user.sub);
  }

  @Patch('cities/:id')
  updateCity(
    @Param('id') id: string,
    @Body() dto: UpdateContentCityDto,
    @Req() req: AuthedRequest,
  ) {
    return this.content.updateCity(id, dto, req.user.sub);
  }

  @Get('sources')
  sources() {
    return this.content.listSources();
  }

  @Post('sources')
  createSource(@Body() dto: CreateContentSourceDto, @Req() req: AuthedRequest) {
    return this.content.createSource(dto, req.user.sub);
  }

  @Patch('sources/:id')
  updateSource(
    @Param('id') id: string,
    @Body() dto: UpdateContentSourceDto,
    @Req() req: AuthedRequest,
  ) {
    return this.content.updateSource(id, dto, req.user.sub);
  }

  @Get('places')
  places(@Query() query: ContentListDto) {
    return this.content.listPlaces(query);
  }

  @Post('places')
  createPlace(@Body() dto: CreateContentPlaceDto, @Req() req: AuthedRequest) {
    return this.content.createPlace({ ...dto }, req.user.sub);
  }

  @Patch('places/:id')
  updatePlace(
    @Param('id') id: string,
    @Body() dto: UpdateContentPlaceDto,
    @Req() req: AuthedRequest,
  ) {
    return this.content.updatePlace(id, { ...dto }, req.user.sub);
  }

  @Post('places/:id/status')
  setPlaceStatus(
    @Param('id') id: string,
    @Body() dto: UpdateContentPlaceStatusDto,
    @Req() req: AuthedRequest,
  ) {
    return this.content.setPlaceStatus(id, dto.status, req.user.sub);
  }

  @Get('knowledge')
  knowledge() {
    return this.content.listKnowledgeDocuments();
  }

  @Post('knowledge')
  createKnowledge(
    @Body() dto: CreateKnowledgeDocumentDto,
    @Req() req: AuthedRequest,
  ) {
    return this.content.createKnowledgeDocument(dto, req.user.sub);
  }

  @Patch('knowledge/:id')
  updateKnowledge(
    @Param('id') id: string,
    @Body() dto: UpdateKnowledgeDocumentDto,
    @Req() req: AuthedRequest,
  ) {
    return this.content.updateKnowledgeDocument(id, dto, req.user.sub);
  }
}
