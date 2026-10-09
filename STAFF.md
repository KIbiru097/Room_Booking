# Staff Account Guide

This document describes the STAFF account as implemented in the current
LuxStay/YayeTech project: NestJS API, web portal, mobile app, Prisma data, and
server-side authorization.

> The API is the source of truth. Frontend route hiding is only a usability
> feature and never grants authorization.

## 1. Role definition

The shared role enum is:

~~~text
CUSTOMER | STAFF | MANAGER | ADMIN
~~~

STAFF is a hotel-operations role. A staff member works for one or more hotels
through StaffHotel assignments and performs front-desk and room operations for
those assigned hotels.

| Area | STAFF | MANAGER |
|---|---|---|
| Hotel scope | Hotels assigned through StaffHotel | Manager-owned hotel |
| Front-desk operations | Yes, by permission | Yes |
| Operational room status | Yes | Yes |
| Create/edit hotel or catalog rooms | No | Yes |
| Assign/remove staff | No | Yes for own hotel |
| Platform/admin console | No | No |

Staff are not hotel owners and cannot gain manager/admin authority by changing a
client-side role, URL, or request body.

## 2. Provisioning and assignment

There is no public “sign up as staff” flow. An ADMIN or a MANAGER for the target
hotel provisions the account through the staff-management service.

### New staff account lifecycle

1. The authorized actor selects a hotel and supplies the staff identity,
   email, phone, password, and optional assignment title.
2. The API normalizes the email and verifies that the hotel exists.
3. The user is created with role = STAFF, status = EMAIL_UNVERIFIED,
   isActive = true, and emailVerified = false.
4. The password is stored as an Argon2id hash.
5. A cryptographically random verification token is created with a 24-hour
   expiry and a verification email is queued.
6. A StaffHotel assignment is created. The default assignment title is
   Front Desk.
7. The operation is recorded in the audit log.

When an existing CUSTOMER is assigned, the server upgrades the role to STAFF,
activates the user, and creates the hotel assignment. The existing verification
state is not bypassed; login still requires a verified email.

### Assignment operations

| Operation | Allowed actor | Effect |
|---|---|---|
| Create and assign | ADMIN; MANAGER for own hotel | Creates/updates user and assignment |
| Assign existing user | ADMIN; MANAGER for own hotel | Adds a StaffHotel record |
| Change staff title/role | ADMIN; MANAGER for own hotel | Updates assignment/custom role |
| Activate/deactivate | ADMIN; MANAGER for own hotel | Changes account status and isActive |
| Remove from hotel | ADMIN; MANAGER for own hotel | Deletes that hotel assignment |
| List assignments | ADMIN globally; MANAGER for own hotel | Returns scoped staff records |

Staff cannot perform these assignment operations.

## 3. Login and account security

Authentication is centralized in NestJS. The login service validates:

- email and password schema;
- requested portal (STAFF accepts STAFF and MANAGER accounts);
- emailVerifiedAt and verification state;
- active status and isActive;
- Argon2id password hash;
- rate limits and failed-login lockout.

Current identity protections include a ten-attempt, 15-minute lockout policy,
short-lived access credentials, refresh-token rotation/revocation, and audit
records for sensitive account operations.

### Account states

- EMAIL_UNVERIFIED: created staff waiting for the verification link.
- ACTIVE: can authenticate and use permitted staff endpoints.
- DEACTIVATED: disabled by an admin/manager; login and operations are blocked.
- SUSPENDED/locked: blocked by account or security policy until restored.
- Removed from one hotel: that tenant assignment is removed; assignments in
  other hotels are not silently removed.

## 4. Tenant isolation

StaffHotel is the staff tenant boundary. Resource-scope helpers resolve all
hotel IDs assigned to the authenticated user. Services then verify that every
requested booking, room, payment, stay request, contact thread, and other
resource belongs to one of those hotels.

The JWT may contain a convenience primary hotelId, currently resolved from a
staff assignment. New endpoints must not trust that value alone: use the full
assignment scope for multi-hotel staff.

Operational isolation rules:

- bookings and booking actions are limited to assigned hotels;
- operational room reads/status changes are limited to assigned hotels;
- walk-ins, check-in/out, no-show, relocation, and stay-request decisions are
  hotel-scoped;
- contact/support threads are limited to assigned hotel threads;
- manager-only catalog and staff-management routes reject STAFF;
- a frontend hotel selector is never an authorization control.

## 5. Permission model

The API combines role guards with granular permission guards. Staff permissions
are resolved per hotel from custom role assignments. The legacy fallback grants
the following basic operational permissions when no custom assignment exists:

~~~text
booking.view       booking.create      booking.checkin
booking.checkout   guest.view          guest.create
guest.edit         room.view           payment.view
~~~

Other commonly used keys are:

~~~text
booking.confirm    booking.reject      booking.edit
booking.no_show    booking.relocate    payment.mark_cash_paid
report.view        staff.view          policy.view
~~~

The effective permission is evaluated with the target hotel. Removing a custom
permission must immediately block the associated API action. Managers/admins
may bypass custom staff-permission checks where the endpoint explicitly allows
their role, but ownership/scope checks still apply.

## 6. Web portal: /staff

Implementation: apps/web/src/app/staff/page.tsx.

The page uses AuthGate for STAFF and ADMIN. A MANAGER is redirected to /manager,
keeping manager administration separate from the staff desk.

### Dashboard tab

Shows pending approvals, today's check-ins/check-outs, active guests, and
refresh/error/success feedback.

### Housekeeping & Rooms tab

Loads assigned hotels and operational rooms. Staff can search/filter by
available, cleaning, maintenance, occupied, or all, and update an operational
room status. Staff cannot create/edit/delete catalog rooms from this surface.

### Bookings tab

Provides the front-desk reservation list and, when authorized:

- confirm or reject (reject requires a reason);
- check in/out;
- mark no-show;
- record an on-site cash payment;
- early check-in and late check-out;
- room relocation;
- walk-in guest registration when ENABLE_WALK_IN_BOOKINGS is enabled.

### Stay Requests tab

Lists assigned-hotel stay requests and allows approve/reject decisions with a
decision note where the permission is present.

Localization files:

~~~text
apps/web/src/locales/en/staff.json
apps/web/src/locales/am/staff.json
~~~

## 7. Mobile staff experience

The mobile app uses the same shared role enum and routes staff into the
manager/staff operational surface.

### Staff-accessible screens

The root navigator currently allows STAFF on:

- ManagerOverview
- ManagerBookings2
- ManagerGuests
- ManagerBookingDetail
- ManagerBilling
- ManagerDisputes
- ManagerMore
- WalkInBooking
- EarlyCheckinLateCheckout
""""""""""""""""""""""""""""""""""""""""""""""""""""::::":":';';''"'''":
The overview exposes new booking, walk-in, check-in, and billing actions where
the API permission permits them.

### Screens blocked for STAFF

- ManagerHotel (hotel configuration);
- ManagerRooms (catalog room administration);
- admin console/screens;
- customer FavoritesTab;
- ManagerReports (currently wrapped MANAGER-only in RootNavigator).

ManagerMoreScreen also hides hotel, rooms, and reports menu items for STAFF.

## 8. Backend API surface

### Bookings and front desk

Controller:
apps/api/src/modules/booking/presentation/manager-booking.controller.ts.

| Method | Route | Permission/condition |
|---|---|---|
| GET | /bookings/manage | booking.view |
| GET | /bookings/dashboard/stats | booking.view |
| POST | /bookings/walk-in | booking.create + feature flag |
| POST | /bookings/:bookingId/confirm | booking.confirm |
| POST | /bookings/:bookingId/reject | booking.reject + reason |
| POST | /bookings/:bookingId/check-in | booking.checkin |
| POST | /bookings/:bookingId/check-out | booking.checkout |
| POST | /bookings/:bookingId/early-checkin | booking.checkin |
| POST | /bookings/:bookingId/late-checkout | booking.checkout |
| GET | /bookings/hotels/:id/stay-requests | booking.view + hotel scope |
| POST | /bookings/stay-requests/:id/decide | booking.edit |
| POST | /bookings/:bookingId/no-show | booking.no_show |
| POST | /bookings/:bookingId/relocate-room | booking.relocate |

The booking service resolves managed hotel IDs and calls a resource-scope
assertion before each mutation.

### Catalog and rooms

| Method | Route | Staff behavior |
|---|---|---|
| GET | /catalog/manager/hotels | List assigned hotels |
| GET | /catalog/hotels/:id/policy | Read assigned hotel policy |
| GET | /catalog/hotels/:id/rooms/operational | Read room operations |
| PATCH | /catalog/rooms/:roomId/status | Update operational status only |

Hotel mutation, policy updates, images, amenities, seasonal pricing, and room
creation/edit/delete are manager/admin operations.

### Payments

POST /payments/:bookingId/cash-paid is the staff front-desk cash-received
operation. The payment service validates booking scope, method, and state
server-side. Refunds (POST /payments/:bookingId/refund) are MANAGER/ADMIN only.

### Contact/support inbox

Staff can use these endpoints for threads at assigned hotels:

~~~text
GET   /contact/threads
GET   /contact/threads/:threadId
POST  /contact/threads/:threadId/messages
PATCH /contact/threads/:threadId/status
~~~

ContactService checks assignments both when listing and when opening, replying
to, or closing a thread.

### Disputes

The controller currently permits STAFF to list disputes and mark a dispute
under review:

~~~text
GET  /disputes
POST /disputes/:id/review
~~~

Resolve is MANAGER/ADMIN; close is ADMIN. The current dispute implementation
needs the hardening described in section 12 before staff dispute access should
be considered fully tenant-safe.

### Transportation partner

/partner/transportation includes STAFF, MANAGER, and ADMIN. The underlying
partner service must verify provider ownership/assignment. These routes are
transport-partner operations, not hotel catalog administration.

## 9. Notifications and AI

Booking notifications/deep links route staff to manager booking screens rather
than customer booking detail screens.

Staff-safe AI tools currently include:

- getStaffRoomStatus: room status for an assigned hotel;
- getStaffTodayArrivals: today's confirmed/checked-in arrivals for an assigned
  hotel.

The AI tool registry checks the caller role and hotel context. Staff should not
receive customer, manager-administration, or admin tools unless a route
explicitly permits them.

## 10. Data records

### User

Important fields include:

~~~text
id, fullName, email, phone, role = STAFF
status, isActive, emailVerified, emailVerifiedAt
passwordHash, verification token/expiry, timestamps
~~~

### StaffHotel

Connects a staff user to a hotel and stores the assignment title/role. This is
the base tenant boundary for booking, room, contact, and permission checks.

### Custom role records

Where configured, Permission, Role, RolePermission, and StaffRoleAssignment
provide least-privilege hotel-specific access. A custom assignment must never
widen access outside its hotel.

## 11. Prohibited staff actions

The server must reject STAFF attempts to:

- access /admin/* or admin reports/settings;
- create, delete, or reassign hotels;
- edit hotel profile, policy, amenities, images, or pricing;
- create/edit/delete catalog rooms;
- create, remove, activate, deactivate, or assign other staff;
- refund payments;
- read/mutate another hotel's bookings, rooms, guests, payments, or threads;
- elevate their own role or permissions;
- rely on hidden frontend buttons as the only protection.

## 12. Current gaps and hardening items

These are implementation observations, not intended capabilities:

1. Dispute scope: GET /disputes and POST /disputes/:id/review permit STAFF, but
   the current adminList and status update methods do not receive the actor or
   assert the staff member's hotel. Pass the actor through and apply the
   booking/resource scope helper.
2. Mobile reports mismatch: ManagerReportsScreen contains a staff revenue
   exclusion, but RootNavigator currently protects the screen for MANAGER only.
   Decide whether staff should receive non-revenue reports and enforce
   report.view server-side.
3. Billing parity: mobile exposes ManagerBilling to STAFF; the web staff portal
   exposes cash-paid behavior inside bookings but no separate billing tab.
   Align the two clients with the final product decision.
4. Legacy permissions: the fallback set is broad for front-desk work. Production
   hotels should migrate to explicit least-privilege assignments.
5. Primary hotel ID: never authorize a new endpoint using only JWT hotelId;
   query all StaffHotel assignments and validate the resource.
6. Audit reasons: sensitive future actions should record actor, hotel, target,
   action, reason where applicable, and request metadata.

## 13. Release checklist

### Security

- [ ] Only ADMIN or an owning MANAGER can provision/assign staff.
- [ ] Verification link expires after 24 hours.
- [ ] Unverified, deactivated, suspended, or locked staff cannot log in.
- [ ] Passwords are Argon2id hashes and never appear in output/logs.
- [ ] Refresh sessions rotate and revoke correctly.
- [ ] Staff assignment/status/removal operations are audited.

### Tenant isolation

- [ ] Assigned hotels work for staff.
- [ ] Unassigned hotel IDs return 403.
- [ ] Booking, room, payment, contact, AI, and transport services use the same
      hotel scope.
- [ ] Dispute scope has an authorization regression test.

### Client behavior

- [ ] /staff allows STAFF/ADMIN and redirects MANAGER.
- [ ] Mobile hides favorites, hotel configuration, catalog room administration,
      reports (unless deliberately enabled), and admin screens.
- [ ] Booking, walk-in, check-in/out, room-status, and stay-request flows work
      with the required permissions.
- [ ] English and Amharic staff strings are complete.

## 14. Source locations

~~~text
apps/api/src/modules/admin/application/admin-staff.service.ts
apps/api/src/modules/admin/presentation/admin-staff.controller.ts
apps/api/src/modules/admin/presentation/manager-staff.controller.ts
apps/api/src/common/guards/permissions.guard.ts
apps/api/src/common/helpers/resource-scope.helper.ts
apps/api/src/modules/booking/presentation/manager-booking.controller.ts
apps/api/src/modules/catalog/presentation/manager-catalog.controller.ts
apps/api/src/modules/contact/application/contact.service.ts
apps/api/src/modules/dispute/presentation/dispute.controller.ts
apps/api/src/modules/ai/application/tools/staff-tools.ts
apps/web/src/app/staff/page.tsx
apps/web/src/lib/services.ts
apps/mobile/src/navigation/RootNavigator.tsx
apps/mobile/src/navigation/MainTabs.tsx
apps/mobile/src/screens/manager/ManagerOverviewScreen.tsx
apps/mobile/src/screens/manager/ManagerMoreScreen.tsx
~~~

