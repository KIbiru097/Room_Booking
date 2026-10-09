import { ForbiddenException } from '@nestjs/common';
import { ResourceScopeHelper } from './resource-scope.helper';

describe('ResourceScopeHelper', () => {
  it('resolves the manager hotel and prevents an unassigned manager from operating', async () => {
    const db = {
      hotel: {
        findFirst: jest
          .fn()
          .mockResolvedValueOnce({ id: 'hotel-1', managerId: 'manager-1' })
          .mockResolvedValueOnce(null),
      },
    };
    const helper = new ResourceScopeHelper(db as never);

    await expect(helper.getManagerHotelId('manager-1')).resolves.toBe(
      'hotel-1',
    );
    await expect(helper.getManagerHotelId('manager-2')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('allows staff only through an explicit StaffHotel assignment', async () => {
    const db = {
      hotel: { findFirst: jest.fn() },
      staffHotel: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce({ staffId: 'staff-1', hotelId: 'hotel-1' })
          .mockResolvedValueOnce(null),
        findMany: jest.fn().mockResolvedValue([{ hotelId: 'hotel-1' }]),
      },
    };
    const helper = new ResourceScopeHelper(db as never);

    await expect(
      helper.assertManagerOwnsHotel('staff-1', 'STAFF', 'hotel-1'),
    ).resolves.toBeUndefined();
    await expect(
      helper.assertManagerOwnsHotel('staff-1', 'STAFF', 'hotel-2'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      helper.getAccessibleHotelIds({ sub: 'staff-1', role: 'STAFF' }),
    ).resolves.toEqual(['hotel-1']);
  });
});
