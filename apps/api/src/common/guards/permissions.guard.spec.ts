import { PermissionsGuard } from './permissions.guard';

describe('PermissionsGuard', () => {
  const context = (user: { sub: string; role: string }) =>
    ({
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => ({ user, params: {} }) }),
    }) as any;

  it('allows managers through the hotel ownership boundary', async () => {
    const guard = new PermissionsGuard(
      { getAllAndOverride: () => ['role.manage'] } as any,
      {} as any,
      {} as any,
      {} as any,
    );
    await expect(
      guard.canActivate(context({ sub: 'm1', role: 'MANAGER' })),
    ).resolves.toBe(true);
  });

  it('allows a staff permission from an active hotel role', async () => {
    const guard = new PermissionsGuard(
      { getAllAndOverride: () => ['booking.confirm'] } as any,
      {
        staffRoleAssignment: {
          findMany: jest.fn().mockResolvedValue([
            {
              role: {
                permissions: [{ permission: { key: 'booking.confirm' } }],
              },
            },
          ]),
        },
        staffHotel: { findFirst: jest.fn() },
      } as any,
      { get: jest.fn().mockResolvedValue(null), set: jest.fn() } as any,
      {
        getAccessibleHotelIds: jest.fn().mockResolvedValue(['hotel-1']),
      } as any,
    );
    await expect(
      guard.canActivate(context({ sub: 's1', role: 'STAFF' })),
    ).resolves.toBe(true);
  });

  it('denies staff without the requested permission', async () => {
    const guard = new PermissionsGuard(
      { getAllAndOverride: () => ['booking.refund'] } as any,
      {
        staffRoleAssignment: { findMany: jest.fn().mockResolvedValue([]) },
        staffHotel: {
          findFirst: jest.fn().mockResolvedValue({ staffId: 's1' }),
        },
      } as any,
      { get: jest.fn().mockResolvedValue(null), set: jest.fn() } as any,
      {
        getAccessibleHotelIds: jest.fn().mockResolvedValue(['hotel-1']),
      } as any,
    );
    await expect(
      guard.canActivate(context({ sub: 's1', role: 'STAFF' })),
    ).resolves.toBe(false);
  });
});
