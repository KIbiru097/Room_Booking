import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TripService } from './trip.service';

describe('TripService', () => {
  const db = {
    trip: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    tripItem: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    booking: { findFirst: jest.fn() },
    hotel: { findUnique: jest.fn() },
    place: { findFirst: jest.fn(), findMany: jest.fn() },
    city: { findUnique: jest.fn() },
  } as any;

  let service: TripService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TripService(db);
  });

  it('does not expose a trip owned by another user', async () => {
    db.trip.findFirst.mockResolvedValue(null);

    await expect(service.get('trip-1', 'user-a')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(db.trip.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'trip-1', userId: 'user-a', deletedAt: null },
      }),
    );
  });

  it('rejects reversed trip dates', async () => {
    await expect(
      service.create(
        {
          title: 'Addis weekend',
          startDate: '2026-10-10',
          endDate: '2026-10-08',
          timezone: 'Africa/Addis_Ababa',
        } as any,
        'user-a',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(db.trip.create).not.toHaveBeenCalled();
  });

  it('requires explicit confirmation for AI-created itinerary items', async () => {
    db.trip.findFirst.mockResolvedValue({
      id: 'trip-1',
      userId: 'user-a',
      startDate: new Date('2026-10-08T00:00:00.000Z'),
      endDate: new Date('2026-10-10T00:00:00.000Z'),
    });

    await expect(
      service.addItem(
        'trip-1',
        {
          dayDate: '2026-10-09',
          itemType: 'CUSTOM',
          title: 'Museum visit',
          createdBy: 'AI',
          userConfirmed: false,
        } as any,
        'user-a',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns conflict metadata for overlapping timed items', async () => {
    db.trip.findFirst.mockResolvedValue({
      id: 'trip-1',
      userId: 'user-a',
      startDate: new Date('2026-10-08T00:00:00.000Z'),
      endDate: new Date('2026-10-10T00:00:00.000Z'),
    });
    db.tripItem.findMany.mockResolvedValue([
      { id: 'existing', title: 'Lunch', startTime: '10:30', durationMin: 60 },
    ]);
    db.tripItem.create.mockResolvedValue({
      id: 'new',
      tripId: 'trip-1',
      dayDate: new Date('2026-10-09T00:00:00.000Z'),
      startTime: '10:00',
      durationMin: 60,
      itemType: 'CUSTOM',
      title: 'Museum',
      place: null,
      booking: null,
    });

    const result = await service.addItem(
      'trip-1',
      {
        dayDate: '2026-10-09',
        itemType: 'CUSTOM',
        title: 'Museum',
        startTime: '10:00',
        durationMin: 60,
        createdBy: 'USER',
        userConfirmed: false,
      } as any,
      'user-a',
    );

    expect(result.hasConflict).toBe(true);
    expect(result.conflictWith).toEqual([
      { id: 'existing', title: 'Lunch', timeWindow: '10:30 - 11:30' },
    ]);
  });

  describe('buildDay', () => {
    const trip = {
      id: 'trip-1',
      userId: 'user-a',
      startDate: new Date('2026-10-08T00:00:00.000Z'),
      endDate: new Date('2026-10-10T00:00:00.000Z'),
    };

    const makePlace = (id: string, name: string) => ({
      id,
      name,
      amharicName: null,
      description: 'A verified heritage site.',
      category: 'HERITAGE',
      status: 'PUBLISHED',
      address: 'Gondar',
      lat: 12.6,
      lng: 37.4,
      priceLevel: 1,
      rating: 4.8,
      images: [],
      sourceId: 'source-unesco-whc',
      lastVerifiedAt: new Date('2026-09-01'),
    });

    beforeEach(() => {
      db.trip.findFirst.mockResolvedValue(trip);
      db.city.findUnique.mockResolvedValue({
        id: 'city-gondar',
        name: 'Gondar',
      });
    });

    it('rejects an unknown destination before querying places', async () => {
      db.city.findUnique.mockResolvedValue(null);

      await expect(
        service.buildDay(
          'trip-1',
          {
            dayDate: '2026-10-09',
            duration: 'HALF_DAY',
            startTime: '09:00',
            cityId: 'missing',
          } as any,
          'user-a',
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(db.place.findMany).not.toHaveBeenCalled();
    });

    it('scopes candidates to the destination and the chosen interests', async () => {
      db.place.findMany.mockResolvedValueOnce([
        makePlace('p1', 'Fasil Ghebbi'),
        makePlace('p2', 'Debre Berhan Selassie'),
        makePlace('p3', "Fasilides' Bath"),
      ]);

      const result = await service.buildDay(
        'trip-1',
        {
          dayDate: '2026-10-09',
          duration: 'HALF_DAY',
          startTime: '09:00',
          cityId: 'city-gondar',
          interests: ['heritage'],
        } as any,
        'user-a',
      );

      expect(db.place.findMany).toHaveBeenCalledTimes(1);
      expect(db.place.findMany.mock.calls[0][0].where).toEqual({
        status: 'PUBLISHED',
        sourceId: { not: null },
        cityId: 'city-gondar',
        category: { in: ['HERITAGE'] },
      });
      expect(result.scope).toBe('city_interests');
      expect(result.cityName).toBe('Gondar');
      expect(result.proposal).toHaveLength(3);
    });

    it('drops unknown interest chips instead of matching nothing', async () => {
      db.place.findMany.mockResolvedValueOnce([
        makePlace('p4', 'Debre Berhan Selassie'),
      ]);

      const result = await service.buildDay(
        'trip-1',
        {
          dayDate: '2026-10-09',
          duration: 'HALF_DAY',
          startTime: '09:00',
          cityId: 'city-gondar',
          interests: ['unmapped-chip'],
        } as any,
        'user-a',
      );

      expect(db.place.findMany).toHaveBeenCalledTimes(1);
      const { where } = db.place.findMany.mock.calls[0][0];
      expect(where).not.toHaveProperty('category');
      expect(result.scope).toBe('city');
    });

    it('widens the scope when the city has no matching published places', async () => {
      db.city.findUnique.mockResolvedValue({ id: 'city-harar', name: 'Harar' });
      db.place.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          makePlace('p5', 'National Museum'),
          makePlace('p6', 'Holy Trinity'),
          makePlace('p7', 'Entoto Park'),
          makePlace('p8', 'Tomoca Coffee'),
          makePlace('p9', 'Merkato'),
        ]);

      const result = await service.buildDay(
        'trip-1',
        {
          dayDate: '2026-10-09',
          duration: 'FULL_DAY',
          startTime: '09:00',
          cityId: 'city-harar',
          interests: ['heritage'],
        } as any,
        'user-a',
      );

      expect(db.place.findMany).toHaveBeenCalledTimes(4);
      expect(result.scope).toBe('global');
      expect(result.proposal).toHaveLength(5);
    });

    it('returns an empty proposal rather than an error when nothing is published', async () => {
      db.place.findMany.mockResolvedValue([]);

      const result = await service.buildDay(
        'trip-1',
        {
          dayDate: '2026-10-09',
          duration: '2_HOURS',
          startTime: '09:00',
          cityId: 'city-gondar',
        } as any,
        'user-a',
      );

      expect(result.proposal).toEqual([]);
      expect(result.totalDurationMin).toBe(0);
      expect(result.estimatedBudgetEtb).toBe(0);
    });
  });
});
