import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PlaceStatus } from '../../../generated/prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditService } from '../../../common/services/audit.service';

type ContentList = {
  status?: PlaceStatus;
  cityId?: string;
  search?: string;
  page: number;
  pageSize: number;
};

@Injectable()
export class AdminContentService {
  constructor(
    private readonly db: PrismaService,
    private readonly audit: AuditService,
  ) {}

  listCountries() {
    return this.db.country.findMany({ orderBy: { name: 'asc' } });
  }

  listCities() {
    return this.db.city.findMany({
      include: {
        country: true,
        _count: { select: { places: true, hotels: true } },
      },
      orderBy: [{ name: 'asc' }],
    });
  }

  async createCity(dto: { name: string; countryId: string }, actorId: string) {
    const country = await this.db.country.findUnique({
      where: { id: dto.countryId },
    });
    if (!country) throw new NotFoundException('Country not found');
    const city = await this.db.city.create({
      data: dto,
      include: { country: true },
    });
    this.audit.record(actorId, 'CREATE', 'City', city.id, { name: city.name });
    return city;
  }

  async updateCity(
    id: string,
    dto: { name?: string; countryId?: string },
    actorId: string,
  ) {
    const before = await this.db.city.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('City not found');
    if (dto.countryId) {
      const country = await this.db.country.findUnique({
        where: { id: dto.countryId },
      });
      if (!country) throw new NotFoundException('Country not found');
    }
    const city = await this.db.city.update({
      where: { id },
      data: dto,
      include: { country: true },
    });
    this.audit.record(actorId, 'UPDATE', 'City', id, { before, after: city });
    return city;
  }

  listSources() {
    return this.db.source.findMany({
      include: {
        _count: {
          select: {
            places: true,
            emergencyContacts: true,
            cityHistories: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createSource(
    dto: {
      name: string;
      url?: string | null;
      license?: string | null;
      verifiedBy?: string | null;
    },
    actorId: string,
  ) {
    const source = await this.db.source.create({ data: dto });
    this.audit.record(actorId, 'CREATE', 'Source', source.id, {
      name: source.name,
      url: source.url,
    });
    return source;
  }

  async updateSource(
    id: string,
    dto: {
      name?: string;
      url?: string | null;
      license?: string | null;
      verifiedBy?: string | null;
    },
    actorId: string,
  ) {
    const before = await this.db.source.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('Source not found');
    const source = await this.db.source.update({ where: { id }, data: dto });
    this.audit.record(actorId, 'UPDATE', 'Source', id, {
      before,
      after: source,
    });
    return source;
  }

  async listPlaces(query: ContentList) {
    const where: Prisma.PlaceWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.cityId) where.cityId = query.cityId;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { address: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const [total, data] = await Promise.all([
      this.db.place.count({ where }),
      this.db.place.findMany({
        where,
        include: { city: true, source: true },
        orderBy: { updatedAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);
    return { data, total, page: query.page, pageSize: query.pageSize };
  }

  private async validatePlaceReferences(
    cityId?: string | null,
    sourceId?: string,
  ) {
    if (cityId) {
      const city = await this.db.city.findUnique({ where: { id: cityId } });
      if (!city) throw new NotFoundException('City not found');
    }
    if (sourceId) {
      const source = await this.db.source.findUnique({
        where: { id: sourceId },
      });
      if (!source) throw new NotFoundException('Source not found');
    }
  }

  async createPlace(dto: Record<string, unknown>, actorId: string) {
    await this.validatePlaceReferences(
      dto.cityId as string | null | undefined,
      dto.sourceId as string,
    );
    const { cityId, sourceId, images, ...scalar } = dto;
    const place = await this.db.place.create({
      data: {
        ...(scalar as Prisma.PlaceCreateInput),
        city: cityId ? { connect: { id: cityId as string } } : undefined,
        source: { connect: { id: sourceId as string } },
        images: images ?? [],
      },
      include: { city: true, source: true },
    });
    this.audit.record(actorId, 'CREATE', 'Place', place.id, {
      status: place.status,
      sourceId: place.sourceId,
    });
    return place;
  }

  async updatePlace(id: string, dto: Record<string, unknown>, actorId: string) {
    const before = await this.db.place.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('Place not found');
    await this.validatePlaceReferences(
      dto.cityId as string | null | undefined,
      dto.sourceId as string | undefined,
    );
    const { cityId, sourceId, images, ...scalar } = dto;
    const place = await this.db.place.update({
      where: { id },
      data: {
        ...(scalar as Prisma.PlaceUpdateInput),
        ...(images !== undefined
          ? { images: images as Prisma.InputJsonValue }
          : {}),
        ...(cityId !== undefined
          ? {
              city: cityId
                ? { connect: { id: cityId as string } }
                : { disconnect: true },
            }
          : {}),
        ...(sourceId !== undefined
          ? {
              source: sourceId
                ? { connect: { id: sourceId as string } }
                : { disconnect: true },
            }
          : {}),
      },
      include: { city: true, source: true },
    });
    this.audit.record(actorId, 'UPDATE', 'Place', id, { before, after: place });
    return place;
  }

  async setPlaceStatus(id: string, status: PlaceStatus, actorId: string) {
    const before = await this.db.place.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('Place not found');
    if (status === PlaceStatus.PUBLISHED && !before.sourceId) {
      throw new BadRequestException(
        'A source is required before publishing a place',
      );
    }
    const place = await this.db.place.update({
      where: { id },
      data: { status },
      include: { city: true, source: true },
    });
    this.audit.record(actorId, 'STATUS_CHANGE', 'Place', id, {
      before: before.status,
      after: status,
    });
    return place;
  }

  listKnowledgeDocuments() {
    return this.db.aiKnowledgeDocument.findMany({
      orderBy: { updatedAt: 'desc' },
      include: { hotel: true },
    });
  }

  async createKnowledgeDocument(
    dto: {
      title: string;
      content: string;
      hotelId?: string | null;
      approved: boolean;
    },
    actorId: string,
  ) {
    const document = await this.db.aiKnowledgeDocument.create({ data: dto });
    this.audit.record(actorId, 'CREATE', 'AiKnowledgeDocument', document.id, {
      approved: document.approved,
    });
    return document;
  }

  async updateKnowledgeDocument(
    id: string,
    dto: Partial<{
      title: string;
      content: string;
      hotelId: string | null;
      approved: boolean;
    }>,
    actorId: string,
  ) {
    const before = await this.db.aiKnowledgeDocument.findUnique({
      where: { id },
    });
    if (!before) throw new NotFoundException('Knowledge document not found');
    const document = await this.db.aiKnowledgeDocument.update({
      where: { id },
      data: dto,
    });
    this.audit.record(actorId, 'UPDATE', 'AiKnowledgeDocument', id, {
      before: before.approved,
      after: document.approved,
    });
    return document;
  }
}
