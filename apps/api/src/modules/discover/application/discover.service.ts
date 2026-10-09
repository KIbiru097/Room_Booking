import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  HotelStatus,
  PlaceCategory,
  PlaceStatus,
} from '../../../generated/prisma/client';
import {
  CreatePlaceDto,
  EmergencyContactsQueryDto,
  HeritageQueryDto,
  NearbyPlacesQueryDto,
  SearchPlacesQueryDto,
} from '../presentation/dto/discover.dto';

export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

@Injectable()
export class DiscoverService {
  constructor(private readonly prisma: PrismaService) {}

  /** Destination-first discovery. Only cities with published, attributed content are public. */
  async getDestinations(limit = 50) {
    const safeLimit = Number.isFinite(limit)
      ? Math.min(Math.max(Math.trunc(limit), 1), 100)
      : 50;
    const cities = await this.prisma.city.findMany({
      where: {
        OR: [
          {
            places: {
              some: { status: PlaceStatus.PUBLISHED, sourceId: { not: null } },
            },
          },
          { hotels: { some: { status: HotelStatus.ACTIVE } } },
        ],
      },
      include: {
        country: { select: { id: true, name: true, code: true } },
        places: {
          where: { status: PlaceStatus.PUBLISHED, sourceId: { not: null } },
          orderBy: [{ rating: 'desc' }, { lastVerifiedAt: 'desc' }],
          take: 1,
          select: { images: true },
        },
        _count: {
          select: {
            places: {
              where: { status: PlaceStatus.PUBLISHED, sourceId: { not: null } },
            },
            hotels: { where: { status: HotelStatus.ACTIVE } },
          },
        },
      },
      orderBy: { name: 'asc' },
      take: safeLimit,
    });

    return cities.map((city) => {
      const placeCount = city._count.places;
      const hotelCount = city._count.hotels;
      return {
        id: city.id,
        name: city.name,
        country: city.country,
        // City-level copy only — never reuse a place's text as the city's description.
        description: `${city.name}, ${city.country.name} — ${placeCount} verified ${
          placeCount === 1 ? 'place' : 'places'
        } and ${hotelCount} active ${hotelCount === 1 ? 'hotel' : 'hotels'}.`,
        amharicName: null,
        heroImage:
          Array.isArray(city.places[0]?.images) &&
          typeof city.places[0]?.images[0] === 'string'
            ? city.places[0]?.images[0]
            : null,
        placeCount,
        hotelCount,
      };
    });
  }

  async getDestination(cityId: string) {
    const city = await this.prisma.city.findUnique({
      where: { id: cityId },
      include: {
        country: { select: { id: true, name: true, code: true } },
        places: {
          where: { status: PlaceStatus.PUBLISHED, sourceId: { not: null } },
          include: { source: true, city: true },
          orderBy: [{ rating: 'desc' }, { lastVerifiedAt: 'desc' }],
          take: 50,
        },
        hotels: {
          where: { status: HotelStatus.ACTIVE },
          include: { images: { where: { isPrimary: true }, take: 1 } },
          orderBy: [{ starRating: 'desc' }, { name: 'asc' }],
          take: 30,
        },
      },
    });
    if (!city) throw new NotFoundException('Destination not found');
    return {
      id: city.id,
      name: city.name,
      country: city.country,
      places: city.places,
      hotels: city.hotels.map((hotel) => ({
        id: hotel.id,
        name: hotel.name,
        address: hotel.address,
        lat: hotel.lat,
        lng: hotel.lng,
        starRating: hotel.starRating,
        images: hotel.images.map((image) => image.url),
      })),
    };
  }

  /**
   * Return the source-controlled history payload for a city. Historical copy
   * is deliberately not kept in the web bundle: an unapproved or missing
   * record produces an empty state instead of guessed facts.
   */
  async getHistory(cityId: string) {
    const city = await this.prisma.city.findUnique({
      where: { id: cityId },
      include: { country: { select: { id: true, name: true, code: true } } },
    });
    if (!city) throw new NotFoundException('Destination not found');

    const history = await this.prisma.cityHistory.findFirst({
      where: { cityId, sourceId: { not: null } },
      include: { source: true },
    });

    return {
      city: { id: city.id, name: city.name, country: city.country },
      tagline: history?.tagline ?? null,
      overview: history?.overview ?? null,
      timeline: Array.isArray(history?.timeline) ? history.timeline : [],
      stories: Array.isArray(history?.stories) ? history.stories : [],
      culture: Array.isArray(history?.culture) ? history.culture : [],
      source: history?.source ?? null,
      verifiedAt: history?.verifiedAt ?? null,
    };
  }

  async getHistoryTimeline(cityId: string) {
    const history = await this.getHistory(cityId);
    return {
      city: history.city,
      timeline: history.timeline,
      source: history.source,
      verifiedAt: history.verifiedAt,
    };
  }

  /** Nearby heritage is hotel-centred and only returns published attributed places. */
  async getNearbyHeritage(hotelId: string, radiusKm = 15, limit = 30) {
    const hotel = await this.prisma.hotel.findFirst({
      where: {
        id: hotelId,
        status: HotelStatus.ACTIVE,
        lat: { not: null },
        lng: { not: null },
      },
      select: { id: true, name: true, address: true, lat: true, lng: true },
    });
    if (!hotel || hotel.lat == null || hotel.lng == null) {
      throw new NotFoundException('Active hotel with location not found');
    }

    const safeRadius = Math.min(
      Math.max(Number.isFinite(radiusKm) ? radiusKm : 15, 1),
      50,
    );
    const latDelta = safeRadius / 111;
    const lngDelta =
      safeRadius / (111 * Math.cos(hotel.lat * (Math.PI / 180)) || 1);
    const places = await this.prisma.place.findMany({
      where: {
        status: PlaceStatus.PUBLISHED,
        sourceId: { not: null },
        category: { in: [PlaceCategory.HERITAGE, PlaceCategory.MUSEUM] },
        lat: { gte: hotel.lat - latDelta, lte: hotel.lat + latDelta },
        lng: { gte: hotel.lng - lngDelta, lte: hotel.lng + lngDelta },
      },
      include: { source: true, city: true },
      take: 200,
    });

    const data = places
      .map((place) => ({
        ...place,
        distanceKm: haversineDistanceKm(
          hotel.lat!,
          hotel.lng!,
          place.lat,
          place.lng,
        ),
      }))
      .filter((place) => place.distanceKm <= safeRadius)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(
        0,
        Math.min(Math.max(Number.isFinite(limit) ? limit : 30, 1), 100),
      );

    return { hotel, radiusKm: safeRadius, total: data.length, data };
  }

  /** Reverse heritage-to-hotel discovery, scoped to active hotels. */
  async getNearbyHotels(placeId: string, radiusKm = 15, limit = 30) {
    const place = await this.prisma.place.findFirst({
      where: {
        id: placeId,
        status: PlaceStatus.PUBLISHED,
        sourceId: { not: null },
      },
      select: { id: true, name: true, lat: true, lng: true },
    });
    if (!place) throw new NotFoundException('Place not found');

    const safeRadius = Math.min(
      Math.max(Number.isFinite(radiusKm) ? radiusKm : 15, 1),
      50,
    );
    const latDelta = safeRadius / 111;
    const lngDelta =
      safeRadius / (111 * Math.cos(place.lat * (Math.PI / 180)) || 1);
    const hotels = await this.prisma.hotel.findMany({
      where: {
        status: HotelStatus.ACTIVE,
        lat: {
          not: null,
          gte: place.lat - latDelta,
          lte: place.lat + latDelta,
        },
        lng: {
          not: null,
          gte: place.lng - lngDelta,
          lte: place.lng + lngDelta,
        },
      },
      include: { images: { where: { isPrimary: true }, take: 1 } },
      take: 200,
    });
    const data = hotels
      .filter((hotel) => hotel.lat != null && hotel.lng != null)
      .map((hotel) => ({
        id: hotel.id,
        name: hotel.name,
        address: hotel.address,
        lat: hotel.lat,
        lng: hotel.lng,
        starRating: hotel.starRating,
        images: hotel.images.map((image) => image.url),
        distanceKm: haversineDistanceKm(
          place.lat,
          place.lng,
          hotel.lat!,
          hotel.lng!,
        ),
      }))
      .filter((hotel) => hotel.distanceKm <= safeRadius)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(
        0,
        Math.min(Math.max(Number.isFinite(limit) ? limit : 30, 1), 100),
      );

    return { place, radiusKm: safeRadius, total: data.length, data };
  }

  /**
   * Search nearby places within a given radius using Haversine calculation.
   * Adheres to ROAD-001 (sources attached) and PLACE-010 (hoursVerified flag).
   */
  async getNearby(query: NearbyPlacesQueryDto) {
    const { lat, lng, radiusKm = 5, category, limit = 20 } = query;

    // Fast bounding box query in DB first
    // 1 deg lat ~ 111 km, 1 deg lng ~ 111 * cos(lat)
    const latDelta = radiusKm / 111;
    const lngDelta = radiusKm / (111 * Math.cos(lat * (Math.PI / 180)) || 1);

    const places = await this.prisma.place.findMany({
      where: {
        status: PlaceStatus.PUBLISHED,
        sourceId: { not: null },
        ...(category ? { category: category } : {}),
        lat: {
          gte: lat - latDelta,
          lte: lat + latDelta,
        },
        lng: {
          gte: lng - lngDelta,
          lte: lng + lngDelta,
        },
      },
      include: {
        source: true,
        city: true,
      },
      take: 100, // retrieve candidate pool, then filter accurately
    });

    const withDistance = places
      .map((place) => {
        const distanceKm = haversineDistanceKm(lat, lng, place.lat, place.lng);
        return {
          ...place,
          distanceKm,
        };
      })
      .filter((p) => p.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, limit);

    return {
      center: { lat, lng, radiusKm },
      total: withDistance.length,
      data: withDistance,
    };
  }

  /**
   * Get verified heritage, historical sites, and museums.
   */
  async getHeritage(query: HeritageQueryDto) {
    const { cityId } = query;
    const limit = Number.isFinite(query.limit)
      ? Math.min(Math.max(Math.trunc(query.limit), 1), 50)
      : 20;

    const places = await this.prisma.place.findMany({
      where: {
        status: PlaceStatus.PUBLISHED,
        sourceId: { not: null },
        category: { in: [PlaceCategory.HERITAGE, PlaceCategory.MUSEUM] },
        ...(cityId ? { cityId } : {}),
      },
      include: {
        source: true,
        city: true,
      },
      orderBy: { rating: 'desc' },
      take: limit,
    });

    return {
      total: places.length,
      data: places,
    };
  }

  /**
   * Search places by text keyword across name, description, address.
   */
  async search(query: SearchPlacesQueryDto) {
    const { q, category, cityId, limit = 20 } = query;

    const places = await this.prisma.place.findMany({
      where: {
        status: PlaceStatus.PUBLISHED,
        sourceId: { not: null },
        ...(category ? { category: category } : {}),
        ...(cityId ? { cityId } : {}),
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { amharicName: { contains: q } },
          { description: { contains: q, mode: 'insensitive' } },
          { address: { contains: q, mode: 'insensitive' } },
        ],
      },
      include: {
        source: true,
        city: true,
      },
      take: limit,
    });

    return {
      query: q,
      total: places.length,
      data: places,
    };
  }

  /**
   * Get full details of a specific place including source attribution.
   */
  async getById(id: string) {
    const place = await this.prisma.place.findFirst({
      where: { id, status: PlaceStatus.PUBLISHED, sourceId: { not: null } },
      include: {
        source: true,
        city: true,
      },
    });

    if (!place) {
      throw new NotFoundException(`Place with ID ${id} not found`);
    }

    return place;
  }

  /**
   * Verified emergency contacts (POLICE, AMBULANCE, FIRE, HOSPITALS, EMBASSIES).
   * Strict adherence to TRIP-010 & TRIP-011.
   */
  async getEmergencyContacts(query: EmergencyContactsQueryDto) {
    const { city, hotelId } = query;

    const contacts = await this.prisma.emergencyContact.findMany({
      where: {
        status: 'PUBLISHED',
        sourceId: { not: null },
        OR: [
          { city: null }, // National contacts (991, 907, etc.)
          ...(city
            ? [{ city: { equals: city, mode: 'insensitive' as const } }]
            : []),
          ...(hotelId ? [{ hotelId }] : []),
        ],
      },
      include: {
        source: true,
        hotel: { select: { id: true, name: true, address: true } },
      },
      orderBy: [{ hotelId: 'desc' }, { kind: 'asc' }],
    });

    return {
      total: contacts.length,
      data: contacts,
    };
  }

  /**
   * List all verified content sources and licenses.
   */
  async getSources() {
    return this.prisma.source.findMany({
      include: {
        _count: {
          select: { places: true, emergencyContacts: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Create a new place (used for admin/manager or data seeding).
   */
  async createPlace(dto: CreatePlaceDto) {
    return this.prisma.place.create({
      data: {
        name: dto.name,
        amharicName: dto.amharicName,
        description: dto.description,
        amharicDescription: dto.amharicDescription,
        category: dto.category,
        address: dto.address,
        lat: dto.lat,
        lng: dto.lng,
        city: dto.cityId ? { connect: { id: dto.cityId } } : undefined,
        phone: dto.phone,
        website: dto.website,
        openingHours: dto.openingHours,
        hoursVerified: dto.hoursVerified ?? false,
        priceLevel: dto.priceLevel ?? 1,
        rating: dto.rating ?? 4.5,
        images: dto.images ?? [],
        source: { connect: { id: dto.sourceId } },
      },
      include: {
        source: true,
        city: true,
      },
    });
  }
}
