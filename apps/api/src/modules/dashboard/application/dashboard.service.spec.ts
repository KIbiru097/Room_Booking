import { NotFoundException } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

describe('DashboardService hotel scoping', () => {
  const scope = { getManagerHotelId: jest.fn().mockResolvedValue('hotel-1') };
  const audit = { record: jest.fn().mockResolvedValue(undefined) };

  beforeEach(() => jest.clearAllMocks());

  it('lists layouts only for the manager hotel', async () => {
    const db = {
      dashboardLayout: {
        findMany: jest
          .fn()
          .mockResolvedValue([{ id: 'layout-1', hotelId: 'hotel-1' }]),
      },
    };
    const service = new DashboardService(
      db as never,
      scope as never,
      audit as never,
    );

    await expect(service.listLayouts({ sub: 'manager-1' })).resolves.toEqual([
      { id: 'layout-1', hotelId: 'hotel-1' },
    ]);
    expect(db.dashboardLayout.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { hotelId: 'hotel-1' } }),
    );
  });

  it('creates a layout with the hotel resolved from the manager identity', async () => {
    const tx = {
      dashboardLayout: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        create: jest.fn().mockResolvedValue({
          id: 'layout-1',
          hotelId: 'hotel-1',
          widgets: [],
        }),
      },
    };
    const db = {
      $transaction: jest.fn(async (callback: (client: typeof tx) => unknown) =>
        callback(tx),
      ),
    };
    const service = new DashboardService(
      db as never,
      scope as never,
      audit as never,
    );

    await service.createLayout(
      {
        name: 'Front desk',
        isDefault: true,
        widgets: [{ key: 'occupancy', position: 0 }],
      },
      { sub: 'manager-1' },
    );

    expect(tx.dashboardLayout.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          hotelId: 'hotel-1',
          userId: 'manager-1',
          isDefault: true,
        }),
      }),
    );
    expect(audit.record).toHaveBeenCalledWith(
      'manager-1',
      'DASHBOARD_LAYOUT_CREATE',
      'DashboardLayout',
      'layout-1',
      expect.objectContaining({ hotelId: 'hotel-1' }),
    );
  });

  it('does not reveal or update a layout from another hotel', async () => {
    const db = {
      dashboardLayout: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    const service = new DashboardService(
      db as never,
      scope as never,
      audit as never,
    );

    await expect(
      service.getLayout('layout-other', { sub: 'manager-1' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      service.updateLayout(
        'layout-other',
        { name: 'Changed' },
        { sub: 'manager-1' },
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(db.dashboardLayout.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'layout-other', hotelId: 'hotel-1' },
      }),
    );
  });
});
