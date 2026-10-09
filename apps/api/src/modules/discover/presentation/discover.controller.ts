import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DiscoverService } from '../application/discover.service';
import {
  CreatePlaceDto,
  EmergencyContactsQueryDto,
  HeritageQueryDto,
  NearbyPlacesQueryDto,
  SearchPlacesQueryDto,
} from './dto/discover.dto';
import { Public } from '../../../common/decorators/public.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../../generated/prisma/client';

@ApiTags('discover')
@Controller('discover')
export class DiscoverController {
  constructor(private readonly discoverService: DiscoverService) {}

  @Public()
  @Get('destinations')
  @ApiOperation({
    summary:
      'List supported destinations with verified places and hotel counts',
  })
  getDestinations(@Query('limit') limit?: string) {
    return this.discoverService.getDestinations(
      limit ? Number(limit) : undefined,
    );
  }

  @Public()
  @Get('destinations/:cityId')
  @ApiOperation({
    summary: 'Get a destination with nearby verified places and active hotels',
  })
  getDestination(@Param('cityId') cityId: string) {
    return this.discoverService.getDestination(cityId);
  }

  @Public()
  @Get('cities/:cityId/history')
  @ApiOperation({
    summary: 'Get source-attributed history, stories, and culture for a city',
  })
  getCityHistory(@Param('cityId') cityId: string) {
    return this.discoverService.getHistory(cityId);
  }

  @Public()
  @Get('cities/:cityId/heritage')
  @ApiOperation({ summary: 'List verified heritage places for a city' })
  getCityHeritage(
    @Param('cityId') cityId: string,
    @Query('limit') limit?: string,
  ) {
    return this.discoverService.getHeritage({
      cityId,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Public()
  @Get('cities/:cityId/heritage/timeline')
  @ApiOperation({ summary: 'Get the verified historical timeline for a city' })
  getCityTimeline(@Param('cityId') cityId: string) {
    return this.discoverService.getHistoryTimeline(cityId);
  }

  @Public()
  @Get('nearby')
  @ApiOperation({
    summary: 'Find nearby places and attractions by coordinates',
  })
  getNearby(@Query() query: NearbyPlacesQueryDto) {
    return this.discoverService.getNearby(query);
  }

  @Public()
  @Get('hotels/:hotelId/nearby-heritage')
  @ApiOperation({
    summary: 'Find verified heritage and museum places near an active hotel',
  })
  getNearbyHeritage(
    @Param('hotelId') hotelId: string,
    @Query('radiusKm') radiusKm?: string,
    @Query('limit') limit?: string,
  ) {
    return this.discoverService.getNearbyHeritage(
      hotelId,
      radiusKm ? Number(radiusKm) : undefined,
      limit ? Number(limit) : undefined,
    );
  }

  @Public()
  @Get('heritage')
  @ApiOperation({
    summary: 'List verified heritage, cultural sites, and museums',
  })
  getHeritage(@Query() query: HeritageQueryDto) {
    return this.discoverService.getHeritage(query);
  }

  @Public()
  @Get('emergency')
  @ApiOperation({
    summary: 'Get verified emergency contacts and safety numbers',
  })
  getEmergencyContacts(@Query() query: EmergencyContactsQueryDto) {
    return this.discoverService.getEmergencyContacts(query);
  }

  @Public()
  @Get('search')
  @ApiOperation({ summary: 'Search places by text query' })
  search(@Query() query: SearchPlacesQueryDto) {
    return this.discoverService.search(query);
  }

  @Public()
  @Get('sources')
  @ApiOperation({
    summary: 'Get verified content sources and licensing information',
  })
  getSources() {
    return this.discoverService.getSources();
  }

  @Public()
  @Get('places/:placeId/nearby-hotels')
  @ApiOperation({ summary: 'Find active hotels near a verified place' })
  getNearbyHotels(
    @Param('placeId') placeId: string,
    @Query('radiusKm') radiusKm?: string,
    @Query('limit') limit?: string,
  ) {
    return this.discoverService.getNearbyHotels(
      placeId,
      radiusKm ? Number(radiusKm) : undefined,
      limit ? Number(limit) : undefined,
    );
  }

  @Public()
  @Get('places/:id')
  @ApiOperation({
    summary: 'Get full details for a place with source attribution',
  })
  getPlaceById(@Param('id') id: string) {
    return this.discoverService.getById(id);
  }

  @Roles(Role.ADMIN, Role.MANAGER)
  @Post('places')
  @ApiOperation({ summary: 'Add a new verified place (Admin / Manager only)' })
  createPlace(@Body() dto: CreatePlaceDto) {
    return this.discoverService.createPlace(dto);
  }
}
