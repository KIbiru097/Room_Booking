# Manager Console — Upgrade Plan

## Current State

| Aspect | Current | Target |
|--------|---------|--------|
| Hotel relationship | 1-to-many (schema), 1-to-1 (app enforced) | Strict 1-to-1 with `@unique` |
| Hotel selector | Dropdown to switch between hotels | Removed — auto-resolved from JWT |
| Staff roles | Free-text string on `StaffHotel.role` | Structured custom roles + permissions |
| Permissions | None (role-based only) | Granular `RESOURCE.ACTION` permissions |
| Coupons | ADMIN only | MANAGER can create and manage coupons for own hotel; platform coupons remain ADMIN-only |
| Dashboard | Fixed widgets | Customizable dashboard builder |
| Navigation | Fixed 10 tabs | Configurable navigation builder |
| Custom fields | None | Full custom field system |
| Workflows | None | Trigger → Condition → Action builder |
| Notifications | None | Configurable notification rules |

---

## Phase 1: 1 Manager → 1 Hotel (Schema + Backend)

### 1.1 Schema Migration

```prisma
// apps/api/prisma/schema.prisma

model Hotel {
  id        String  @id @default(cuid())
  managerId String? @unique  // ADD THIS — enforces 1-to-1 at DB level
  // ... rest unchanged
}
```

**Migration:** Add `@@unique` on `managerId`. Handle existing duplicates by keeping the first hotel per manager and reassigning others.

### 1.2 Backend — Resolve Hotel from JWT

Remove `:hotelId` path params from all manager controllers. Resolve hotel from JWT:

```typescript
// NEW: apps/api/src/common/guards/manager-hotel.helper.ts
export class ManagerHotelHelper {
  constructor(private db: PrismaService) {}

  async getManagerHotel(userId: string): Promise<Hotel> {
    const hotel = await this.db.hotel.findFirst({
      where: { managerId: userId },
    });
    if (!hotel) throw new ForbiddenException('No hotel assigned to this manager');
    return hotel;
  }
}
```

**Controllers to update:**
- `manager-catalog.controller.ts` — remove `:hotelId` from all routes
- `manager-booking.controller.ts` — remove `:hotelId` from stay requests route
- `manager-staff.controller.ts` — remove `:hotelId` from all routes
- `manager-review.controller.ts` — remove `:hotelId` from all routes
- `manager-reporting.controller.ts` — remove `:hotelId` from all routes

**Example transformation:**
```typescript
// BEFORE
@Get('hotels/:hotelId/staff')
listStaff(@Param('hotelId') hotelId: string) { ... }

// AFTER
@Get('staff')
listStaff(@Req() req: AuthedRequest) {
  const hotel = await this.managerHotel.getManagerHotel(req.user.id);
  // use hotel.id
}
```

### 1.3 Web Frontend — Remove Hotel Selector

**File:** `apps/web/src/app/manager/page.tsx`

- Remove `selectedHotelId` state
- Remove `<select>` dropdown from sidebar (lines 909-926)
- Remove `hotelId` from all API calls
- Replace with `managerApi.myHotel()` that returns the single assigned hotel
- Hotels tab becomes "My Hotel" — single card, no grid, no "New Hotel" button

**New API method:**
```typescript
// apps/web/src/lib/services.ts
myHotel: () => api.get<Hotel>('/catalog/manager/my-hotel', getAuthToken()),
```

---

## Phase 2: Custom Roles & Permissions

### 2.1 New Prisma Models

```prisma
// apps/api/prisma/schema.prisma

model Department {
  id        String   @id @default(cuid())
  hotelId   String
  hotel     Hotel    @relation(fields: [hotelId], references: [id])
  name      String
  description String?
  color     String?
  icon      String?
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  staff     StaffHotel[]
  roles     Role[]
}

model Role {
  id          String   @id @default(cuid())
  hotelId     String
  hotel       Hotel    @relation(fields: [hotelId], references: [id])
  name        String
  description String?
  departmentId String?
  department  Department? @relation(fields: [departmentId], references: [id])
  isSystem    Boolean  @default(false)
  isActive    Boolean  @default(true)
  createdBy   String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  permissions RolePermission[]
  staffAssignments StaffRoleAssignment[]
}

model Permission {
  id          String   @id @default(cuid())
  key         String   @unique  // e.g. "booking.view"
  module      String   // e.g. "booking"
  action      String   // e.g. "view"
  description String?
  isSystem    Boolean  @default(false)
  createdAt   DateTime @default(now())
  roles       RolePermission[]
}

model RolePermission {
  roleId       String
  role         Role       @relation(fields: [roleId], references: [id])
  permissionId String
  permission   Permission @relation(fields: [permissionId], references: [id])
  createdAt    DateTime   @default(now())

  @@id([roleId, permissionId])
}

model StaffRoleAssignment {
  id        String    @id @default(cuid())
  staffId   String
  roleId    String
  role      Role      @relation(fields: [roleId], references: [id])
  hotelId   String
  startAt   DateTime  @default(now())
  endAt     DateTime?  // for temporary roles
  assignedBy String
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}
```

### 2.2 Seed Default Permissions

Create a seed script that inserts all system permissions:

```typescript
// apps/api/prisma/seeds/permissions.seed.ts
const PERMISSIONS = [
  // Booking
  { key: 'booking.view', module: 'booking', action: 'view' },
  { key: 'booking.create', module: 'booking', action: 'create' },
  { key: 'booking.edit', module: 'booking', action: 'edit' },
  { key: 'booking.confirm', module: 'booking', action: 'confirm' },
  { key: 'booking.reject', module: 'booking', action: 'reject' },
  { key: 'booking.checkin', module: 'booking', action: 'checkin' },
  { key: 'booking.checkout', module: 'booking', action: 'checkout' },
  { key: 'booking.no_show', module: 'booking', action: 'no_show' },
  { key: 'booking.relocate', module: 'booking', action: 'relocate' },
  // Room
  { key: 'room.view', module: 'room', action: 'view' },
  { key: 'room.create', module: 'room', action: 'create' },
  { key: 'room.edit', module: 'room', action: 'edit' },
  { key: 'room.delete', module: 'room', action: 'delete' },
  // Payment
  { key: 'payment.view', module: 'payment', action: 'view' },
  { key: 'payment.mark_cash_paid', module: 'payment', action: 'mark_cash_paid' },
  { key: 'payment.refund', module: 'payment', action: 'refund' },
  // Staff
  { key: 'staff.view', module: 'staff', action: 'view' },
  { key: 'staff.create', module: 'staff', action: 'create' },
  { key: 'staff.assign_role', module: 'staff', action: 'assign_role' },
  { key: 'staff.activate', module: 'staff', action: 'activate' },
  { key: 'staff.deactivate', module: 'staff', action: 'deactivate' },
  // Report
  { key: 'report.view', module: 'report', action: 'view' },
  { key: 'report.export', module: 'report', action: 'export' },
  // Review
  { key: 'review.view', module: 'review', action: 'view' },
  { key: 'review.respond', module: 'review', action: 'respond' },
  { key: 'review.delete_response', module: 'review', action: 'delete_response' },
  // Hotel
  { key: 'hotel.view', module: 'hotel', action: 'view' },
  { key: 'hotel.edit', module: 'hotel', action: 'edit' },
  // Coupon
  { key: 'coupon.view', module: 'coupon', action: 'view' },
  { key: 'coupon.create', module: 'coupon', action: 'create' },
  { key: 'coupon.edit', module: 'coupon', action: 'edit' },
  { key: 'coupon.delete', module: 'coupon', action: 'delete' },
  // Pricing
  { key: 'pricing.view', module: 'pricing', action: 'view' },
  { key: 'pricing.edit', module: 'pricing', action: 'edit' },
  // Policy
  { key: 'policy.view', module: 'policy', action: 'view' },
  { key: 'policy.edit', module: 'policy', action: 'edit' },
  // Maintenance
  { key: 'maintenance.view', module: 'maintenance', action: 'view' },
  { key: 'maintenance.create', module: 'maintenance', action: 'create' },
  { key: 'maintenance.resolve', module: 'maintenance', action: 'resolve' },
  // Housekeeping
  { key: 'housekeeping.view', module: 'housekeeping', action: 'view' },
  { key: 'housekeeping.create_task', module: 'housekeeping', action: 'create_task' },
  { key: 'housekeeping.assign', module: 'housekeeping', action: 'assign' },
  { key: 'housekeeping.complete', module: 'housekeeping', action: 'complete' },
  // Dispute
  { key: 'dispute.view', module: 'dispute', action: 'view' },
  { key: 'dispute.resolve', module: 'dispute', action: 'resolve' },
  // Settings
  { key: 'settings.view', module: 'settings', action: 'view' },
  { key: 'settings.edit', module: 'settings', action: 'edit' },
  { key: 'role.manage', module: 'role', action: 'manage' },
  { key: 'department.manage', module: 'department', action: 'manage' },
  { key: 'dashboard.customize', module: 'dashboard', action: 'customize' },
  { key: 'navigation.customize', module: 'navigation', action: 'customize' },
  { key: 'workflow.manage', module: 'workflow', action: 'manage' },
  { key: 'notification.manage', module: 'notification', action: 'manage' },
  { key: 'custom_field.manage', module: 'custom_field', action: 'manage' },
];
```

### 2.3 Seed Default Role Presets

```typescript
// apps/api/prisma/seeds/role-presets.seed.ts
const ROLE_PRESETS = [
  {
    name: 'Front Desk Agent',
    description: 'Handles check-in/check-out, guest services',
    permissions: ['booking.view', 'booking.create', 'booking.checkin', 'booking.checkout', 'guest.view', 'guest.create', 'guest.edit', 'room.view', 'payment.view'],
  },
  {
    name: 'Front Desk Supervisor',
    description: 'Supervises front desk operations',
    permissions: ['booking.view', 'booking.create', 'booking.edit', 'booking.confirm', 'booking.reject', 'booking.checkin', 'booking.checkout', 'booking.no_show', 'booking.relocate', 'guest.view', 'guest.create', 'guest.edit', 'guest.delete', 'room.view', 'payment.view', 'payment.mark_cash_paid', 'report.view'],
  },
  {
    name: 'Housekeeper',
    description: 'Room cleaning and maintenance',
    permissions: ['room.view', 'housekeeping.view', 'housekeeping.create_task', 'housekeeping.complete', 'maintenance.view', 'maintenance.create'],
  },
  {
    name: 'Housekeeping Supervisor',
    description: 'Manages housekeeping team',
    permissions: ['room.view', 'housekeeping.view', 'housekeeping.create_task', 'housekeeping.assign', 'housekeeping.complete', 'housekeeping.inspect', 'maintenance.view', 'maintenance.create', 'maintenance.resolve', 'staff.view'],
  },
  {
    name: 'Cashier',
    description: 'Handles payments and refunds',
    permissions: ['payment.view', 'payment.mark_cash_paid', 'payment.refund', 'booking.view', 'guest.view', 'report.view'],
  },
  {
    name: 'Accountant',
    description: 'Financial reporting and reconciliation',
    permissions: ['payment.view', 'payment.refund', 'report.view', 'report.export', 'booking.view', 'guest.view'],
  },
  {
    name: 'Maintenance Technician',
    description: 'Handles maintenance requests',
    permissions: ['maintenance.view', 'maintenance.create', 'maintenance.resolve', 'room.view'],
  },
  {
    name: 'Night Auditor',
    description: 'Overnight operations and reconciliation',
    permissions: ['booking.view', 'booking.checkin', 'booking.checkout', 'payment.view', 'report.view', 'report.export', 'guest.view', 'room.view'],
  },
  {
    name: 'Concierge',
    description: 'Guest services and special requests',
    permissions: ['booking.view', 'guest.view', 'guest.edit', 'room.view', 'dispute.view', 'dispute.resolve'],
  },
  {
    name: 'General Staff',
    description: 'Basic operational access',
    permissions: ['booking.view', 'room.view', 'guest.view'],
  },
];
```

### 2.4 Backend — Permissions Guard

```typescript
// apps/api/src/common/guards/permissions.guard.ts
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private db: PrismaService,
    private cache: CacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>('permissions', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // ADMIN bypasses permission checks
    if (user.role === 'ADMIN') return true;

    // Get effective permissions from cache or DB
    const permissions = await this.getEffectivePermissions(user.id, user.hotelId);

    return required.every((perm) => permissions.includes(perm));
  }

  private async getEffectivePermissions(userId: string, hotelId: string): Promise<string[]> {
    const cacheKey = `permissions:${userId}:${hotelId}`;
    const cached = await this.cache.get<string[]>(cacheKey);
    if (cached) return cached;

    const assignments = await this.db.staffRoleAssignment.findMany({
      where: {
        staffId: userId,
        hotelId,
        OR: [
          { endAt: null },
          { endAt: { gt: new Date() } },
        ],
      },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    const permissions = new Set<string>();
    for (const assignment of assignments) {
      for (const rp of assignment.role.permissions) {
        permissions.add(rp.permission.key);
      }
    }

    const result = Array.from(permissions);
    await this.cache.set(cacheKey, result, 300); // 5 min TTL
    return result;
  }
}
```

### 2.5 Backend — Manager Roles Controller

```typescript
// apps/api/src/modules/manager/presentation/manager-roles.controller.ts
@Controller('manager/roles')
@Roles(Role.MANAGER, Role.ADMIN)
export class ManagerRolesController {
  constructor(private roles: ManagerRolesService) {}

  @Get()
  listRoles() { return this.roles.list(); }

  @Post()
  @Permissions('role.manage')
  createRole(@Body() dto: CreateRoleDto) { return this.roles.create(dto); }

  @Get(':id')
  getRole(@Param('id') id: string) { return this.roles.getById(id); }

  @Patch(':id')
  @Permissions('role.manage')
  updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto) { return this.roles.update(id, dto); }

  @Delete(':id')
  @Permissions('role.manage')
  deleteRole(@Param('id') id: string) { return this.roles.delete(id); }

  @Get('permissions/all')
  listPermissions() { return this.roles.listPermissions(); }

  @Put(':id/permissions')
  @Permissions('role.manage')
  updateRolePermissions(@Param('id') id: string, @Body() dto: UpdateRolePermissionsDto) {
    return this.roles.updatePermissions(id, dto);
  }

  @Get('staff/:staffId/permissions')
  getStaffPermissions(@Param('staffId') staffId: string) {
    return this.roles.getStaffPermissions(staffId);
  }
}
```

### 2.6 Web — Roles & Permissions UI

**New tab in Manager Console:** `Settings` → `Roles & Permissions`

**File:** `apps/web/src/app/manager/roles/page.tsx`

Features:
- Role list with search, filter by department
- Create role wizard (name, description, department, permissions matrix)
- Permission matrix with module grouping, search, select all/none
- Role duplication
- Role comparison
- Staff assignment to roles
- Permission preview (effective access)
- Delete protection (cannot delete role with assigned staff)

---

## Phase 3: Coupon Management for Managers

### 3.1 Backend — Extend Coupon Controller

```typescript
// apps/api/src/modules/coupon/presentation/coupon.controller.ts

// Manager-only, hotel-scoped endpoints. Admin continues to use /admin/coupons.
@Controller('manager/coupons')
@Roles(Role.MANAGER)
export class ManagerCouponController {
  constructor(private coupons: CouponService) {}

  @Get()
  @Permissions('coupon.view')
  listCoupons(@Req() req: AuthedRequest) {
    return this.coupons.listForManager(req.user.sub);
  }

  @Post()
  @Permissions('coupon.create')
  createCoupon(@Body() dto: CreateCouponDto, @Req() req: AuthedRequest) {
    return this.coupons.createForManager(dto, req.user.sub);
  }

  @Patch(':id')
  @Permissions('coupon.edit')
  updateCoupon(@Param('id') id: string, @Body() dto: UpdateCouponDto, @Req() req: AuthedRequest) {
    return this.coupons.updateForManager(id, dto, req.user.sub);
  }

  @Delete(':id')
  @Permissions('coupon.delete')
  deleteCoupon(@Param('id') id: string, @Req() req: AuthedRequest) {
    return this.coupons.deactivateForManager(id, req.user.sub);
  }
}
```

### 3.2 Schema — Add hotelId to Coupon

```prisma
model Coupon {
  id               String       @id @default(cuid())
  hotelId         String?      // NEW — null = platform-wide coupon
  hotel            Hotel?       @relation(fields: [hotelId], references: [id])
  code             String       @unique
  discountType     DiscountType @default(PERCENTAGE)
  value            Decimal      @db.Decimal(10, 2)
  validFrom        DateTime
  validTo          DateTime
  usageLimit       Int          @default(100)
  timesUsed        Int          @default(0)
  isActive         Boolean      @default(true)
  minBookingAmount Decimal?     @db.Decimal(10, 2)
}
```

### 3.3 Web — Coupons Tab

**New tab in Manager Console:** `Coupons`

Features:
- Coupon list with status, usage count, validity period
- Create coupon form (code, discount type, value, validity, usage limit, min booking amount)
- Edit/deactivate coupons
- Filter by status (active, expired, exhausted)

---

## Phase 4: Dashboard Builder

### 4.1 New Prisma Models

```prisma
model DashboardLayout {
  id        String   @id @default(cuid())
  hotelId   String
  hotel     Hotel    @relation(fields: [hotelId], references: [id])
  userId    String?
  roleId    String?
  name      String
  layout    String   // compact, standard, spacious
  isDefault Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  widgets   DashboardWidget[]
}

model DashboardWidget {
  id         String   @id @default(cuid())
  layoutId   String
  layout     DashboardLayout @relation(fields: [layoutId], references: [id])
  widgetType String   // revenue, occupancy, bookings, arrivals, departures, etc.
  position   Int
  width      Int      @default(1)
  height     Int      @default(1)
  config     Json?    // widget-specific configuration
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

### 4.2 Backend — Dashboard Controller

```typescript
// apps/api/src/modules/manager/presentation/manager-dashboard.controller.ts
@Controller('manager/dashboard')
@Roles(Role.MANAGER, Role.ADMIN)
export class ManagerDashboardController {
  @Get('layout')
  @Permissions('dashboard.customize')
  getLayout() { ... }

  @Put('layout')
  @Permissions('dashboard.customize')
  updateLayout(@Body() dto: UpdateDashboardLayoutDto) { ... }

  @Post('layout/reset')
  @Permissions('dashboard.customize')
  resetLayout() { ... }
}
```

### 4.3 Web — Dashboard Customization

**File:** `apps/web/src/app/manager/dashboard/page.tsx`

Features:
- Toggle widget visibility
- Drag-and-drop reordering
- Resize widgets
- Layout presets (Compact, Standard, Spacious)
- Save/reset layout
- Role-based default dashboards

---

## Phase 5: Navigation Builder

### 5.1 New Prisma Model

```prisma
model NavigationItem {
  id               String   @id @default(cuid())
  hotelId          String
  hotel            Hotel    @relation(fields: [hotelId], references: [id])
  label            String
  icon             String?
  route            String
  position         Int
  enabled          Boolean  @default(true)
  requiredPermission String?
  departmentId     String?
  isSystem         Boolean  @default(false)  // cannot be removed
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}
```

### 5.2 Web — Navigation Builder UI

**File:** `apps/web/src/app/manager/settings/navigation/page.tsx`

Features:
- Toggle show/hide for each nav item
- Drag-and-drop reordering (with accessible move controls as a fallback)
- Rename labels
- Set required permission
- Add custom nav items (safe routes only)
- Reset to default

**Implementation status:** complete. The hotel-scoped `NavigationItem` model is exposed
through `/manager/navigation` with manager ownership checks, allow-listed routes, system
item protection, audit events, and reset support. The manager page is available at
`/manager/settings/navigation` and is linked from the manager console.

---

## Phase 6: Custom Fields

### 6.1 New Prisma Models

```prisma
model CustomField {
  id          String   @id @default(cuid())
  hotelId     String
  hotel       Hotel    @relation(fields: [hotelId], references: [id])
  entity      String   // guest, booking, room, staff, hotel, payment, maintenance, housekeeping
  name        String
  key         String   @unique
  type        String   // text, long_text, number, currency, date, datetime, boolean, dropdown, multi_select, phone, email, url, file, image
  required    Boolean  @default(false)
  options     Json?    // for dropdown/multi_select
  validation  Json?    // regex, min, max, etc.
  visibleToRoles Json? // role IDs that can see this field
  createdBy   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  values      CustomFieldValue[]
}

model CustomFieldValue {
  id         String   @id @default(cuid())
  fieldId    String
  field      CustomField @relation(fields: [fieldId], references: [id])
  entityId   String   // ID of the guest/booking/room/etc.
  value      Json
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@id([fieldId, entityId])
}
```

### 6.2 Web — Custom Fields Builder

**File:** `apps/web/src/app/manager/settings/custom-fields/page.tsx`

Features:
- Create custom fields for guests, bookings, rooms, staff
- Field type selector with validation options
- Required/optional toggle
- Visibility by role
- Field list with edit/delete

---

## Phase 7: Workflows

### 7.1 New Prisma Models

```prisma
model Workflow {
  id          String   @id @default(cuid())
  hotelId     String
  hotel       Hotel    @relation(fields: [hotelId], references: [id])
  name        String
  description String?
  trigger     String   // booking.created, booking.checked_in, booking.checked_out, payment.received, etc.
  conditions  Json     // array of conditions
  actions     Json     // array of actions
  isActive    Boolean  @default(true)
  createdBy   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### 7.2 Web — Workflow Builder

**File:** `apps/web/src/app/manager/settings/workflows/page.tsx`

Features:
- Trigger selector (booking events, payment events, room events)
- Condition builder (AND/OR logic)
- Action builder (send notification, create task, update status, assign staff)
- Workflow list with toggle active/inactive
- Test workflow button

---

## Phase 8: Notification Rules

### 8.1 New Prisma Model

```prisma
model NotificationRule {
  id          String   @id @default(cuid())
  hotelId     String
  hotel       Hotel    @relation(fields: [hotelId], references: [id])
  name        String
  event       String   // new_booking, booking_cancelled, payment_received, etc.
  channels    Json     // ["in_app", "push", "sms", "email"]
  recipients  Json     // role IDs or "manager", "staff", "department:xxx"
  priority    String   @default("normal")  // low, normal, high, urgent
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### 8.2 Web — Notification Settings

**File:** `apps/web/src/app/manager/settings/notifications/page.tsx`

Features:
- Event selector
- Channel toggles (in-app, push, SMS, email)
- Recipient configuration (by role, by department)
- Priority setting
- Test notification button

---

## Phase 9: Hotel Configuration

### 9.1 Web — Settings Page

**File:** `apps/web/src/app/manager/settings/hotel/page.tsx`

Features:
- Hotel profile editing (name, description, address, city, star rating)
- Branding (logo, cover image, brand colors)
- Localization (language, currency, timezone, date/time format)
- Contact information
- Social links

---

## Implementation Order

| Phase | Scope | Effort |
|-------|-------|--------|
| **1** | 1 Manager → 1 Hotel (schema + backend + frontend) | Medium |
| **2** | Custom Roles & Permissions (models + guard + UI) | Large |
| **3** | Coupon Management for Managers | Small |
| **4** | Dashboard Builder | Medium |
| **5** | Navigation Builder | Small |
| **6** | Custom Fields | Medium |
| **7** | Workflows | Large |
| **8** | Notification Rules | Medium |
| **9** | Hotel Configuration | Small |

---

## API Endpoints Summary

### Existing APIs (remain unchanged)
```
managerApi.hotels() → managerApi.myHotel()
managerApi.bookings()
managerApi.stats()
managerApi.getPolicy() / upsertPolicy()
managerApi.listStaff() / createStaff() / assignStaff()
managerApi.reportOverview() / reportRevenue() / reportTrends() / reportOccupancy()
managerApi.listReviews() / respondToReview() / deleteReviewResponse()
managerApi.action()
managerApi.createWalkIn()
managerApi.blockMaintenance()
managerApi.upsertSeasonalPricing()
managerApi.decideStayRequest()
managerApi.relocateRoom()
managerApi.noShow()
paymentApi.markCashPaid()
```

### New APIs
```
// Roles & Permissions
managerApi.roles()
managerApi.createRole()
managerApi.updateRole()
managerApi.deleteRole()
managerApi.permissions()
managerApi.updateRolePermissions()
managerApi.assignStaffRole()
managerApi.removeStaffRole()
managerApi.staffRoles()

// Departments
managerApi.departments()
managerApi.createDepartment()
managerApi.updateDepartment()
managerApi.deleteDepartment()

// Coupons
managerApi.coupons()
managerApi.createCoupon()
managerApi.updateCoupon()
managerApi.deleteCoupon()

// Dashboard
managerApi.dashboardLayout()
managerApi.updateDashboardLayout()

// Navigation
managerApi.navigationConfig()
managerApi.updateNavigationConfig()

// Custom Fields
managerApi.customFields()
managerApi.createCustomField()
managerApi.updateCustomField()
managerApi.deleteCustomField()

// Workflows
managerApi.workflows()
managerApi.createWorkflow()
managerApi.updateWorkflow()
managerApi.deleteWorkflow()

// Notifications
managerApi.notificationRules()
managerApi.createNotificationRule()
managerApi.updateNotificationRule()
managerApi.deleteNotificationRule()
```

---

## Critical Security Rules

1. **Never trust `hotelId` from frontend** — always resolve from JWT
2. **Never trust `userId` from frontend** — always use JWT `sub`
3. **Never trust `roleId` from frontend** — always verify role belongs to manager's hotel
4. **Permissions are backend-enforced** — frontend only controls visibility
5. **Protected permissions cannot be granted by managers:**
   - `platform.admin`, `platform.settings`, `platform.users`
   - `platform.audit`, `platform.feature_flags`, `platform.billing`
   - `platform.security`, `admin.manage`
6. **Sensitive actions require confirmation:**
   - `payment.refund`, `payment.delete`
   - `staff.disable`, `role.delete`
   - `booking.delete`, `financial.export`, `guest.delete`
7. **Audit logging for all sensitive actions**
8. **Permission cache invalidation on role/permission/staff changes**
