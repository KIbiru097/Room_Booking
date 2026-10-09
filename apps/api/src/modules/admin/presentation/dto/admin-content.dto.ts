import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const placeStatus = z.enum([
  'DRAFT',
  'PENDING_REVIEW',
  'PUBLISHED',
  'REJECTED',
  'ARCHIVED',
]);
const optionalUrl = z.string().url().optional().nullable();

const contentListSchema = z.object({
  status: placeStatus.optional(),
  cityId: z.string().optional(),
  search: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

const createCitySchema = z.object({
  name: z.string().trim().min(2).max(120),
  countryId: z.string().min(1),
});

const updateCitySchema = createCitySchema.partial();

const createSourceSchema = z.object({
  name: z.string().trim().min(2).max(180),
  url: optionalUrl,
  license: z.string().trim().max(120).optional().nullable(),
  verifiedBy: z.string().trim().max(180).optional().nullable(),
});

const updateSourceSchema = createSourceSchema.partial();

const placeFields = {
  name: z.string().trim().min(2).max(150),
  amharicName: z.string().max(150).optional().nullable(),
  description: z.string().min(10),
  amharicDescription: z.string().optional().nullable(),
  category: z.enum([
    'RESTAURANT',
    'CAFE',
    'HERITAGE',
    'MUSEUM',
    'ATTRACTION',
    'NIGHTLIFE',
    'SHOPPING',
    'HOSPITAL',
    'CLINIC',
    'PHARMACY',
    'EMERGENCY',
    'OTHER',
  ]),
  address: z.string().trim().min(3),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  cityId: z.string().optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  website: optionalUrl,
  openingHours: z.string().max(300).optional().nullable(),
  hoursVerified: z.boolean().default(false),
  priceLevel: z.number().int().min(1).max(4).optional().nullable(),
  rating: z.number().min(1).max(5).optional().nullable(),
  images: z.array(z.string().url()).max(20).default([]),
  sourceId: z.string().min(1),
};

const createPlaceSchema = z.object({
  ...placeFields,
  status: placeStatus.default('DRAFT'),
});

const updatePlaceSchema = z.object(placeFields).partial().extend({
  status: placeStatus.optional(),
});

const statusSchema = z.object({ status: placeStatus });

const createKnowledgeSchema = z.object({
  title: z.string().trim().min(2).max(180),
  content: z.string().min(20),
  hotelId: z.string().optional().nullable(),
  approved: z.boolean().default(false),
});

const updateKnowledgeSchema = createKnowledgeSchema.partial();

export class ContentListDto extends createZodDto(contentListSchema) {}
export class CreateContentCityDto extends createZodDto(createCitySchema) {}
export class UpdateContentCityDto extends createZodDto(updateCitySchema) {}
export class CreateContentSourceDto extends createZodDto(createSourceSchema) {}
export class UpdateContentSourceDto extends createZodDto(updateSourceSchema) {}
export class CreateContentPlaceDto extends createZodDto(createPlaceSchema) {}
export class UpdateContentPlaceDto extends createZodDto(updatePlaceSchema) {}
export class UpdateContentPlaceStatusDto extends createZodDto(statusSchema) {}
export class CreateKnowledgeDocumentDto extends createZodDto(
  createKnowledgeSchema,
) {}
export class UpdateKnowledgeDocumentDto extends createZodDto(
  updateKnowledgeSchema,
) {}
