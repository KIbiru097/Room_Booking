import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { NavigationService } from './navigation.service';

describe('NavigationService hotel scoping', () => {
  const scope = { getManagerHotelId: jest.fn().mockResolvedValue('hotel-1') };
  const audit = { record: jest.fn() };
  const actor = { sub: 'manager-1', role: 'MANAGER' };

  beforeEach(() => jest.clearAllMocks());

  it('seeds missing defaults only for the manager hotel', async () => {
    const db = {
      navigationItem: {
        findMany: jest
          .fn()
          .mockImplementation((args: { select?: unknown }) =>
            args.select ? [] : [{ id: 'nav-1', hotelId: 'hotel-1' }],
          ),
        createMany: jest.fn().mockResolvedValue({ count: 5 }),
      },
    };
    const service = new NavigationService(
      db as never,
      scope as never,
      audit as never,
    );

    await expect(service.list(actor)).resolves.toEqual([
      { id: 'nav-1', hotelId: 'hotel-1' },
    ]);
    expect(db.navigationItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { hotelId: 'hotel-1' } }),
    );
    expect(db.navigationItem.createMany).toHaveBeenCalledTimes(1);
    const seeded = (
      db.navigationItem.createMany.mock.calls as Array<
        [{ data: Array<{ hotelId: string; route: string }> }]
      >
    )[0][0];
    expect(seeded.data.map((item) => item.route)).toEqual([
      '/manager',
      '/manager/roles',
      '/manager/dashboard',
      '/manager/coupons',
      '/manager/settings/navigation',
    ]);
    expect(seeded.data.every((item) => item.hotelId === 'hotel-1')).toBe(true);
  });

  it('does not write defaults when the hotel already has navigation rows', async () => {
    const db = {
      navigationItem: {
        findMany: jest
          .fn()
          .mockResolvedValue([
            { route: '/manager' },
            { route: '/manager/roles' },
            { route: '/manager/dashboard' },
            { route: '/manager/coupons' },
            { route: '/manager/settings/navigation' },
          ]),
        createMany: jest.fn(),
      },
    };
    const service = new NavigationService(
      db as never,
      scope as never,
      audit as never,
    );

    await service.list(actor);
    expect(db.navigationItem.createMany).not.toHaveBeenCalled();
  });

  it('rejects unsafe routes before persistence', async () => {
    const db = {
      navigationItem: { create: jest.fn() },
      permission: { findUnique: jest.fn() },
    };
    const service = new NavigationService(
      db as never,
      scope as never,
      audit as never,
    );

    await expect(
      service.create({ label: 'External', route: '/admin/users' }, actor),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(db.navigationItem.create).not.toHaveBeenCalled();
  });

  it('creates custom items with the manager hotel and non-system status', async () => {
    const db = {
      navigationItem: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({
          id: 'nav-custom',
          hotelId: 'hotel-1',
          isSystem: false,
        }),
      },
    };
    const service = new NavigationService(
      db as never,
      scope as never,
      audit as never,
    );

    await service.create(
      { label: 'Operations', route: '/manager/roles' },
      actor,
    );
    const created = (
      db.navigationItem.create.mock.calls as Array<
        [{ data: { hotelId: string; isSystem: boolean; route: string } }]
      >
    )[0][0];
    expect(created.data.hotelId).toBe('hotel-1');
    expect(created.data.isSystem).toBe(false);
    expect(created.data.route).toBe('/manager/roles');
  });

  it('does not reveal another hotel item and protects system items', async () => {
    const db = {
      navigationItem: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    const service = new NavigationService(
      db as never,
      scope as never,
      audit as never,
    );
    await expect(
      service.update('nav-other', { label: 'Nope' }, actor),
    ).rejects.toBeInstanceOf(NotFoundException);

    db.navigationItem.findFirst.mockResolvedValue({
      id: 'nav-system',
      hotelId: 'hotel-1',
      isSystem: true,
    });
    await expect(service.remove('nav-system', actor)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
