import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CouponService } from './coupon.service';

describe('CouponService hotel scoping', () => {
  const dto = {
    code: 'HOTEL10',
    discountType: 'PERCENTAGE' as const,
    value: 10,
    validFrom: new Date('2026-01-01'),
    validTo: new Date('2026-12-31'),
    usageLimit: 100,
    minBookingAmount: 0,
  };

  it('creates and lists coupons only for the manager hotel', async () => {
    const db = {
      coupon: {
        findMany: jest
          .fn()
          .mockResolvedValue([{ id: 'coupon-1', hotelId: 'hotel-1' }]),
        create: jest
          .fn()
          .mockResolvedValue({ id: 'coupon-1', hotelId: 'hotel-1' }),
      },
    };
    const scope = { getManagerHotelId: jest.fn().mockResolvedValue('hotel-1') };
    const service = new CouponService(db as never, scope as never);

    await expect(service.listForManager('manager-1')).resolves.toEqual([
      { id: 'coupon-1', hotelId: 'hotel-1' },
    ]);
    await service.createForManager(dto, 'manager-1');
    expect(db.coupon.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ hotelId: 'hotel-1', code: 'HOTEL10' }),
    });
  });

  it('rejects a manager update/deactivation for another hotel', async () => {
    const db = { coupon: { findFirst: jest.fn().mockResolvedValue(null) } };
    const scope = { getManagerHotelId: jest.fn().mockResolvedValue('hotel-1') };
    const service = new CouponService(db as never, scope as never);

    await expect(
      service.updateForManager('coupon-2', {}, 'manager-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      service.deactivateForManager('coupon-2', 'manager-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects a hotel coupon when used against another hotel', async () => {
    const db = {
      coupon: {
        findUnique: jest.fn().mockResolvedValue({
          code: 'HOTEL10',
          hotelId: 'hotel-1',
          isActive: true,
          validFrom: new Date('2026-01-01'),
          validTo: new Date('2026-12-31'),
          timesUsed: 0,
          usageLimit: 10,
          minBookingAmount: null,
        }),
      },
    };
    const service = new CouponService(db as never, {} as never);
    await expect(
      service.validate('HOTEL10', db as never, undefined, 'hotel-2'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
