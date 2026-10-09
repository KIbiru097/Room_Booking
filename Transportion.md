# YayeTech Transportation Marketplace --- Full Build Plan

## 1. Purpose

Build a **Transportation Marketplace** inside YayeTech where customers
can discover and book transportation services connected to their hotel
and trip, while verified transportation partners manage services and
bookings.

The first release should **not** try to become an Uber-style
ride-hailing platform. Start with fixed-price, scheduled partner
services and design the backend so real-time rides can be added later.

## 2. Product Goal

The customer should be able to:

1.  Book a YayeTech hotel.
2.  See transportation options related to the trip.
3.  Choose a service such as airport pickup or private driver.
4.  See a clear fixed price.
5.  Enter pickup/drop-off and passenger information.
6.  Pay or choose the available payment method.
7.  Receive confirmation and reminders.
8.  See the transportation booking inside **My Trip**.
9.  Receive driver/partner details when assigned.
10. Contact the partner through approved communication channels.

The partner should be able to:

1.  Register as a transportation provider.
2.  Submit business and verification information.
3.  Add vehicles and services.
4.  Define service areas and fixed prices.
5.  Receive booking requests.
6.  Accept or reject requests.
7.  Assign a driver and vehicle.
8.  Update booking status.
9.  See upcoming bookings.
10. View earnings and completed trips.


## 3. Scope

### Phase 1 --- Scheduled Transportation Marketplace

Build:

-   Airport pickup
-   Hotel ↔ airport transfer
-   Private driver
-   Fixed-price transportation services
-   Partner onboarding
-   Partner verification
-   Partner booking management
-   Customer transportation booking
-   Booking notifications
-   Payment status
-   My Trip integration
-   Basic cancellation rules
-   Basic partner earnings/reporting

### Phase 2 --- Expand Transportation

Add:

-   Car rental
-   Intercity transportation
-   More transportation providers
-   More vehicle categories
-   More pricing models
-   Availability calendars
-   Multi-day rental
-   Pickup/drop-off locations
-   Partner documents and agreements

### Phase 3 --- On-Demand Transportation

Only after the scheduled marketplace is stable:

-   On-demand taxi/rides
-   Driver app
-   Driver availability
-   Live GPS
-   Ride assignment
-   Real-time ETA
-   Dynamic/real-time pricing
-   Ride tracking
-   Driver/customer live status
-   Safety and incident workflows

## 4. Core Product Principle

Transportation should be a **marketplace**, not a single hard-coded
transport company.

``` text
Customer
   |
   v
YayeTech Marketplace2
   |
   +---- Provider A
   |
   +---- Provider B
   |
   +---- Provider C
```

YayeTech owns the booking, trust, payment/status, notification, and trip
experience.

The transportation provider owns the actual vehicle/driver/service
fulfillment.

## 5. Connection With the Existing YayeTech Platform

Transportation should connect to:

``` text
User
  |
Hotel Booking
  |
Trip
  |
Transportation Booking
  |
Notifications
  |
Payment
```

Example:

``` text
Customer
  |
  +-- Hotel: ABC Hotel, Addis Ababa
  |
  +-- Arrival: 15 Oct, 14:30
  |
  +-- Airport pickup: 15 Oct, 15:00
  |
  +-- Hotel check-in: 15 Oct, 16:00
  |
  +-- Heritage visit: 16 Oct, 10:00
```

The hotel booking provides useful context, but transportation must
remain independently bookable.

A customer should be able to book transportation:

-   after booking a hotel
-   from My Trip
-   from Explore
-   from a transportation page
-   from an airport-transfer offer

## 6. Recommended Architecture

``` text
React Native Customer App
        |
        | HTTPS / REST
        v
NestJS API
        |
        +-- Auth
        +-- Users
        +-- Hotels
        +-- Bookings
        +-- Trips
        +-- Payments
        +-- Notifications
        +-- Transportation
        |
        +--------------------+
        |                    |
        v                    v
PostgreSQL / Neon          Redis
        |                    |
        |                    +-- queues/cache
        |
        +-- PostGIS
```

Partner side can initially be a responsive web dashboard or a separate
manager/partner mobile app.

Recommended initial setup:

``` text
apps/
  mobile/              # customer React Native / Expo
  partner-web/         # transportation partner portal
  manager-web/         # YayeTech admin/operations
  api/                 # NestJS

packages/
  types/
  validation/
  api-client/
  ui/
```

If your existing repository has a different structure, add the
transportation module without restructuring working hotel code
unnecessarily.

## 7. Backend Modules

Create a NestJS module:

``` text
transportation/
├── transportation.module.ts
├── providers/
├── vehicles/
├── drivers/
├── services/
├── availability/
├── bookings/
├── pricing/
├── assignments/
├── payments/
├── notifications/
├── documents/
└── reports/
```

### Minimum Phase 1 modules

-   TransportationProvidersModule
-   TransportationServicesModule
-   VehiclesModule
-   TransportationBookingsModule
-   AssignmentsModule
-   TransportationPricingModule
-   TransportationNotificationsModule

Do not build the DriverModule as a live GPS system in Phase 1. Keep
driver records simple until the marketplace workflow works.

## 8. Database Design

### transport_providers

``` text
id UUID PK
business_name
legal_name nullable
phone
email
description nullable
status
verification_status
verification_notes nullable
address nullable
city_id nullable
created_at
updated_at
```

Suggested status:

``` text
DRAFT
PENDING_REVIEW
ACTIVE
SUSPENDED
REJECTED
```

Verification:

``` text
PENDING
VERIFIED
EXPIRED
REJECTED
```

### provider_documents

``` text
id UUID PK
provider_id FK
document_type
document_number nullable
file_url
status
expires_at nullable
verified_by nullable
verified_at nullable
created_at
```

Do not store sensitive document files directly in PostgreSQL. Use
controlled object storage and store metadata/reference in the database.

### vehicles

``` text
id UUID PK
provider_id FK
vehicle_type
make nullable
model nullable
year nullable
plate_number
color nullable
passenger_capacity
luggage_capacity
status
created_at
updated_at
```

Vehicle types can start with:

``` text
SEDAN
SUV
MINIVAN
MINIBUS
BUS
OTHER
```

### drivers

Phase 1 can be simple:

``` text
id UUID PK
provider_id FK
name
phone
status
verification_status
created_at
updated_at
```

Later add:

-   driver documents
-   license information
-   availability
-   live location
-   rating
-   safety/incident records

### transportation_services

A service is what the customer actually purchases.

``` text
id UUID PK
provider_id FK
name
service_type
description
origin_type
destination_type
fixed_price
currency
passenger_limit
luggage_limit
duration_minutes nullable
advance_booking_minutes
cancellation_policy_id nullable
status
created_at
updated_at
```

Service types:

``` text
AIRPORT_PICKUP
AIRPORT_DROP_OFF
HOTEL_TRANSFER
PRIVATE_DRIVER
INTERCITY_TRANSFER
```

Phase 2:

``` text
CAR_RENTAL
INTERCITY_BUS
OTHER
```

### service_locations

For structured locations:

``` text
id UUID PK
service_id FK
location_type
city_id nullable
latitude
longitude
address
place_id nullable
```

Use PostGIS for geographic coordinates.

### transportation_bookings

``` text
id UUID PK
booking_reference
user_id FK
trip_id nullable
hotel_booking_id nullable
service_id FK
provider_id FK
vehicle_id nullable
driver_id nullable
pickup_at
pickup_location
pickup_latitude
pickup_longitude
dropoff_location
dropoff_latitude
dropoff_longitude
passengers
luggage_count nullable
customer_notes nullable
price_amount
currency
payment_status
status
cancellation_reason nullable
created_at
updated_at
```

Important:

`hotel_booking_id` is optional because transportation can exist without
a hotel booking.

`trip_id` is also optional because the customer may book transportation
before creating a formal trip.

## 9. Booking State Machine

Do not use one field for everything.

Use separate:

### Transportation status

``` text
REQUESTED
ACCEPTED
REJECTED
ASSIGNED
DRIVER_ON_THE_WAY
ARRIVED
IN_PROGRESS
COMPLETED
CANCELLED
NO_SHOW
```

### Payment status

``` text
UNPAID
PENDING
PAID
FAILED
REFUNDED
PARTIALLY_REFUNDED
```

Example:

``` text
REQUESTED + UNPAID
        |
        v
ACCEPTED + PAID
        |
        v
ASSIGNED + PAID
        |
        v
DRIVER_ON_THE_WAY + PAID
        |
        v
ARRIVED + PAID
        |
        v
IN_PROGRESS + PAID
        |
        v
COMPLETED + PAID
```

The payment state must not determine whether the ride is operationally
completed.

## 10. Partner Onboarding

Partner onboarding should be controlled.

``` text
Partner registers
       |
       v
Business information
       |
       v
Documents
       |
       v
Vehicles
       |
       v
Services/prices
       |
       v
Admin review
       |
       +---- Reject
       |
       +---- Request changes
       |
       v
Verified / Active
```

Do not allow an unverified provider to appear as a normal public
provider.

## 11. Partner Dashboard

Partner dashboard:

``` text
Dashboard
├── Overview
├── Booking Requests
├── Upcoming Trips
├── Completed Trips
├── Services
├── Vehicles
├── Drivers
├── Availability
├── Earnings
├── Documents
├── Reviews
└── Settings
```

Dashboard cards:

``` text
Today's Trips
Pending Requests
Accepted
Completed
Revenue
```

## 12. Customer Flow

### Airport pickup

``` text
My Hotel
   |
   v
Transportation
   |
   v
Airport Pickup
   |
   v
Choose Airport
   |
   v
Choose Pickup Date/Time
   |
   v
Passengers + Luggage
   |
   v
Choose Vehicle/Service
   |
   v
Price
   |
   v
Customer Details
   |
   v
Payment
   |
   v
Confirm
```

### Example UI

``` text
Airport Pickup

Bole International Airport
        ↓
ABC Hotel

15 October
14:30

2 passengers
3 bags

Standard Sedan
1,200 ETB

[Continue]
```

## 13. Hotel ↔ Airport Integration

When a hotel booking exists, prefill:

``` text
Hotel
City
Customer
Booking dates
Guest count
```

For airport pickup, customer provides:

``` text
Airport
Flight date
Arrival time
Flight number
Passengers
Luggage
```

Flight number can be optional in Phase 1.

Do not claim real-time flight tracking until a flight data provider is
integrated.

## 14. Private Driver

Phase 1 should use scheduled private-driver bookings.

Example:

``` text
Private Driver

Duration:
4 hours

Vehicle:
SUV

Price:
2,000 ETB

Pickup:
ABC Hotel

Date:
16 October

Start:
09:00
```

The partner accepts the request and assigns a driver.

## 15. Fixed Pricing

Start simple.

``` text
Service
+
Route/area
+
Vehicle type
=
Fixed price
```

Example:

``` text
Airport → Hotel
Sedan = 1,200 ETB
SUV   = 1,600 ETB
Van   = 2,000 ETB
```

Do not build dynamic pricing in Phase 1.

Later pricing can support:

``` text
base_price
distance_price
time_price
night_surcharge
airport_fee
extra_passenger_fee
extra_luggage_fee
partner_commission
tax
```

Keep pricing calculation in the backend, never trust a price calculated
only by the mobile app.

## 16. Marketplace Search

Customer filters:

``` text
Service type
City
Pickup time
Vehicle type
Passengers
Luggage
Price
Verified provider
```

Sort options:

``` text
Price
Availability
Distance
Partner rating
```

Do not automatically rank paid partners as better. Sponsored placement,
if added later, should be clearly labeled.

## 17. Availability

Phase 1 does not need complicated live driver availability.

Use:

``` text
service availability
+
provider availability
+
vehicle availability
```

Before confirming a booking, backend checks:

1.  Service is active.
2.  Provider is active.
3.  Vehicle is available.
4.  Pickup time is valid.
5.  No conflicting confirmed booking.
6.  Capacity is sufficient.

Use a database transaction/locking strategy to prevent two customers
from booking the same vehicle/time slot.

## 18. API Design

### Customer APIs

``` http
GET /transportation/services
GET /transportation/services/:id
GET /transportation/providers/:id
GET /transportation/vehicles
POST /transportation/bookings
GET /transportation/bookings
GET /transportation/bookings/:id
POST /transportation/bookings/:id/cancel
```

### Partner APIs

``` http
GET /partner/transportation/dashboard
GET /partner/transportation/bookings
POST /partner/transportation/bookings/:id/accept
POST /partner/transportation/bookings/:id/reject
POST /partner/transportation/bookings/:id/assign
POST /partner/transportation/bookings/:id/status
GET /partner/transportation/services
POST /partner/transportation/services
PATCH /partner/transportation/services/:id
GET /partner/transportation/vehicles
POST /partner/transportation/vehicles
PATCH /partner/transportation/vehicles/:id
```

### Admin APIs

``` http
GET /admin/transportation/providers
POST /admin/transportation/providers/:id/verify
POST /admin/transportation/providers/:id/reject
GET /admin/transportation/bookings
GET /admin/transportation/reports
```

## 19. API Security

Every request must verify:

``` text
Authentication
+
Role
+
Provider ownership
```

Example:

A provider must never be able to request:

``` http
GET /partner/bookings/another-provider-booking
```

Backend must check:

``` text
booking.provider_id == authenticated_user.provider_id
```

Never trust `provider_id` supplied by the mobile/web client.

## 20. Roles

Start with:

``` text
CUSTOMER
PARTNER_OWNER
PARTNER_MANAGER
PARTNER_DRIVER
YAYETECH_ADMIN
YAYETECH_OPERATIONS
```

Permissions:

### Customer

-   Search
-   Book
-   Pay
-   Cancel according to policy
-   View own booking
-   Review completed service

### Partner Owner

-   Manage company
-   Manage vehicles
-   Manage services
-   Manage staff
-   View bookings
-   View earnings

### Partner Manager

-   Manage bookings
-   Assign drivers
-   Manage availability

### Partner Driver

Phase 1:

-   View assigned trips
-   Update trip status

Phase 3:

-   Live GPS
-   Navigation
-   Ride tracking
-   Availability

### YayeTech Admin

-   Verify partners
-   Manage disputes
-   Manage services
-   Manage marketplace
-   View reports
-   Suspend providers

## 21. Notifications

Create transportation-specific events:

``` text
TRANSPORT_BOOKING_CREATED
TRANSPORT_BOOKING_ACCEPTED
TRANSPORT_BOOKING_REJECTED
TRANSPORT_DRIVER_ASSIGNED
TRANSPORT_PICKUP_REMINDER
TRANSPORT_DRIVER_ON_THE_WAY
TRANSPORT_ARRIVED
TRANSPORT_COMPLETED
TRANSPORT_CANCELLED
TRANSPORT_PAYMENT_FAILED
```

Channels:

``` text
Push notification
In-app notification
Email where available
SMS where necessary
```

Do not send duplicate notifications when multiple backend workers
process the same event.

## 22. My Trip Integration

Every confirmed transportation booking should appear in:

``` text
My Trip
   |
   +-- Hotel
   |
   +-- Airport Pickup
   |
   +-- Heritage Visit
   |
   +-- Restaurant
   |
   +-- Tour
```

Example:

``` text
15 OCT

14:30
✈️ Arrive at Bole Airport

15:00
🚗 Airport Pickup
ABC Transport
Sedan
Confirmed

16:00
🏨 Hotel Check-in
ABC Hotel
```

Transportation should be represented as a `trip_item` or linked booking,
while the transportation booking remains its own domain object.

## 23. AI Integration

AI should not directly create or confirm transportation bookings without
confirmation.

AI can help:

``` text
Customer:
"I arrive in Addis at 2:30 PM. I need transport to my hotel."

AI:
- identifies hotel
- identifies arrival time
- calls transportation search tool
- returns available services
```

AI tool:

``` text
searchTransportationServices
```

Other tools:

``` text
getTransportationBooking
getMyTrip
getHotelLocation
getAvailableAirportTransfers
getPrivateDrivers
```

For state-changing actions:

``` text
bookTransportation
cancelTransportation
```

require explicit confirmation in the UI.

Example:

``` text
AI:
"I found a verified sedan airport transfer for 1,200 ETB.
Would you like to book it?"

Customer:
"Yes"

App:
[Confirm booking]
```

Do not let the LLM directly write database records.

## 24. AI Safety Rules

The AI must:

-   use actual marketplace data
-   never invent providers
-   never invent prices
-   never invent availability
-   never invent driver information
-   never claim a ride is booked before backend confirmation
-   never expose another customer's booking
-   never bypass cancellation/payment rules

Architecture:

``` text
Customer
   |
   v
AI
   |
   v
NestJS tool
   |
   v
Transportation service
   |
   v
Database
```

## 25. Payments

Use the same payment architecture as the existing YayeTech platform.

Transportation booking:

``` text
Booking created
     |
     v
Payment pending
     |
     +---- success → PAID
     |
     +---- failure → FAILED
```

Keep:

``` text
booking status
```

separate from:

``` text
payment status
```

Payment options can be added according to the gateways you actually
integrate.

For mock development, create a payment adapter:

``` text
PaymentProvider
├── MockPaymentProvider
├── RealProviderLater
└── AnotherProviderLater
```

This lets you test without building the real payment integration first.

## 26. Commission Model

YayeTech can earn a marketplace commission.

Example:

``` text
Customer pays:       1,200 ETB
Partner share:       1,020 ETB
YayeTech commission:   180 ETB
```

Do not hard-code 15%.

Store commission rules:

``` text
commission_type
commission_value
effective_from
effective_to
```

Eventually support:

``` text
percentage
fixed_amount
provider-specific
service-specific
```

Record the commission snapshot on the booking so later price-rule
changes do not alter historical transactions.

## 27. Partner Earnings

Partner dashboard:

``` text
Total bookings
Completed bookings
Gross revenue
YayeTech commission
Refunds
Net payable
```

Create a financial ledger rather than calculating everything from the
current service price.

Minimum tables later:

``` text
transportation_ledger
partner_payouts
commission_rules
```

Do not build automatic payouts until your payment/legal/accounting
requirements are clear.

## 28. Cancellation

Each service should have a cancellation policy.

Example:

``` text
Free cancellation
> 24 hours before pickup

50% cancellation fee
12–24 hours

No refund
< 12 hours
```

These are examples only. Actual partner policies should be configured
and shown clearly to customers.

Store the policy snapshot with the booking.

## 29. Reviews

After:

``` text
COMPLETED
```

customer can review:

``` text
Driver
Vehicle
Service
Partner
```

Do not allow reviews before completion.

Add:

``` text
rating
comment
created_at
booking_id
user_id
```

One customer should not create unlimited reviews for the same completed
booking.

## 30. Disputes and Support

Add:

``` text
transportation_support_tickets
```

Possible reasons:

``` text
Driver did not arrive
Wrong vehicle
Late pickup
Payment issue
Service issue
Refund request
Safety concern
Other
```

Partner and YayeTech operations can handle the case.

## 31. Phase 1 UI

### Customer

``` text
Home
Explore
Trips
AI
Profile

Transportation:
├── Airport Transfer
├── Private Driver
├── My Transportation
└── Booking Details
```

### Partner

``` text
Dashboard
Bookings
Services
Vehicles
Drivers
Availability
Earnings
Documents
Settings
```

### Admin

``` text
Transportation
├── Providers
├── Verification
├── Services
├── Bookings
├── Disputes
├── Commissions
└── Reports
```

## 32. Phase 1 Build Milestones

### Milestone 1 --- Database

Build:

-   providers
-   documents
-   vehicles
-   drivers
-   services
-   bookings

Exit criteria:

-   migrations work
-   constraints work
-   indexes exist
-   ownership relations are correct

### Milestone 2 --- Partner onboarding

Build:

-   partner registration
-   provider profile
-   document upload
-   admin verification
-   provider activation

Exit criteria:

A verified provider can become visible in marketplace.

### Milestone 3 --- Service management

Build:

-   create service
-   fixed price
-   vehicle type
-   passenger capacity
-   availability

Exit criteria:

Partner can publish an airport transfer.

### Milestone 4 --- Customer marketplace

Build:

-   search
-   filters
-   service details
-   price
-   booking form

Exit criteria:

Customer can select an available service.

### Milestone 5 --- Booking

Build:

-   booking creation
-   transaction-safe availability check
-   partner request
-   accept/reject
-   assignment

Exit criteria:

Customer booking reaches partner and partner can accept it.

### Milestone 6 --- Payment

Build:

-   mock payment adapter
-   payment status
-   success/failure
-   booking confirmation

Exit criteria:

A test customer can complete the entire mock payment flow.

### Milestone 7 --- My Trip

Connect:

``` text
hotel booking
+
transportation booking
+
trip item
```

Exit criteria:

Customer sees hotel and transport in one trip.

### Milestone 8 --- Notifications

Build:

-   booking confirmation
-   partner acceptance
-   driver assignment
-   pickup reminder
-   cancellation

Exit criteria:

No duplicate notifications.

### Milestone 9 --- Reviews and support

Build:

-   completed-trip review
-   support ticket
-   dispute workflow

### Milestone 10 --- Production hardening

Test:

-   concurrent booking
-   unauthorized access
-   payment failure
-   cancellation
-   provider suspension
-   duplicate requests
-   notification retry
-   network failure

## 33. What NOT to Build in Phase 1

Do not start with:

-   Uber-style live rides
-   live GPS
-   dynamic pricing
-   automatic driver dispatch
-   complex route optimization
-   driver heatmaps
-   real-time ETA
-   automatic partner payouts
-   nationwide transportation
-   dozens of transport categories

First prove:

``` text
Provider
   ↓
Service
   ↓
Customer
   ↓
Booking
   ↓
Payment
   ↓
Partner acceptance
   ↓
Assignment
   ↓
Completed trip
```

## 34. Phase 2

After Phase 1 is stable:

### Car rental

Add:

``` text
rental_vehicles
rental_rates
rental_bookings
rental_availability
pickup_locations
return_locations
```

Support:

-   daily price
-   multi-day rental
-   deposit
-   mileage policy
-   fuel policy
-   insurance information
-   pickup/return

### Intercity transportation

Add:

-   routes
-   departure times
-   arrival estimates
-   seat capacity
-   scheduled services
-   stations
-   route stops

Do not assume every intercity operator uses the same inventory model.
Keep domain-specific tables.

## 35. Phase 3

Build a separate driver experience.

``` text
Driver App
├── Login
├── Availability
├── Assigned Rides
├── Ride Details
├── Navigation
├── Start Ride
├── Complete Ride
└── Earnings
```

Then:

``` text
Driver
  |
  | GPS
  v
Backend
  |
  v
Customer
```

Use a real-time channel such as WebSocket for ride status/location
updates.

Do not send GPS every second by default. Design an appropriate update
interval and battery/network strategy.

## 36. Live Ride Architecture

Phase 3:

``` text
Driver App
    |
    | location update
    v
NestJS Gateway
    |
    +---- Redis / realtime coordination
    |
    v
Ride Tracking
    |
    +---- Customer App
    |
    +---- Operations Dashboard
```

Store appropriate location history only when needed. Do not keep
unnecessary precise location data forever.

## 37. Routing

For Phase 1:

-   store coordinates
-   calculate straight-line distance where needed
-   do not promise travel time

For later:

``` text
Routing Provider
       |
       v
route distance
route duration
ETA
```

Only display "leave now" or ETA information when a real routing service
supports it.

## 38. Testing Strategy

### Unit tests

Test:

-   price calculation
-   commission calculation
-   booking state transitions
-   cancellation policy
-   availability
-   ownership checks

### Integration tests

Test:

``` text
customer
→ booking
→ payment
→ partner
→ assignment
→ completion
```

### Security tests

Test:

-   customer accessing another customer's booking
-   provider accessing another provider's booking
-   suspended provider creating bookings
-   staff changing protected data
-   forged provider IDs
-   forged prices

### Concurrency test

Two customers attempt to book the same vehicle/time.

Expected:

``` text
Customer A → confirmed
Customer B → unavailable
```

Never allow both because of a race condition.

## 39. Observability

Track:

``` text
booking_created
booking_accepted
booking_rejected
booking_cancelled
booking_completed
payment_success
payment_failed
driver_assigned
```

Monitor:

-   API errors
-   failed payments
-   failed notifications
-   booking conversion
-   partner acceptance time
-   cancellation rate
-   completion rate

## 40. Deployment

Suggested initial stack:

``` text
Mobile:
Expo / EAS

Backend:
NestJS

Database:
Neon PostgreSQL + PostGIS

Cache/Queue:
Redis

Object Storage:
S3-compatible storage / provider

Web:
Vercel or equivalent

Backend:
Render / Railway / Fly.io / VPS
```

Choose providers based on current pricing, availability, and free-tier
limits rather than designing the architecture around one vendor.

## 41. Environment Variables

Example:

``` env
DATABASE_URL=
REDIS_URL=

JWT_SECRET=
JWT_REFRESH_SECRET=

STORAGE_ENDPOINT=
STORAGE_BUCKET=
STORAGE_ACCESS_KEY=
STORAGE_SECRET_KEY=

PAYMENT_PROVIDER=
PAYMENT_SECRET=

PUSH_NOTIFICATION_KEY=
```

Never put secrets inside React Native source code.

## 42. Data Ownership Rules

Every partner-owned record must include the provider relationship.

Example:

``` text
provider_id
```

Backend checks ownership on every protected request.

Customer data:

``` text
user_id
```

Booking data:

``` text
user_id
provider_id
```

This creates tenant isolation between transportation companies.

## 43. Important Business Rules

### TRANS-001

Only active and verified providers can publish public services.

### TRANS-002

Every booking belongs to exactly one customer.

### TRANS-003

Every partner request is scoped to that provider.

### TRANS-004

Prices are calculated and validated by the backend.

### TRANS-005

Payment status and booking status are separate.

### TRANS-006

A vehicle cannot have conflicting confirmed assignments.

### TRANS-007

A completed booking cannot be silently edited into another service.

### TRANS-008

Cancellation follows the booking's policy snapshot.

### TRANS-009

A customer can review only completed services.

### TRANS-010

AI cannot invent availability, price, provider, driver, or booking
status.

### TRANS-011

State-changing AI actions require explicit customer confirmation.

### TRANS-012

Suspended providers cannot receive new bookings.

### TRANS-013

Historical financial records must remain auditable.

### TRANS-014

Sensitive partner/customer documents must be access-controlled.

### TRANS-015

Live location is a Phase 3 capability, not a Phase 1 dependency.

## 44. Recommended MVP

For your first working version, build exactly this:

``` text
CUSTOMER
   |
   v
Airport Transfer
   |
   v
Choose:
- Sedan
- SUV
- Van
   |
   v
Fixed price
   |
   v
Pickup date/time
   |
   v
Passenger/luggage
   |
   v
Mock payment
   |
   v
Booking confirmed
   |
   v
Partner Dashboard
   |
   v
Accept
   |
   v
Assign driver
   |
   v
Customer notification
   |
   v
Completed
   |
   v
Review
```

And one partner should be enough for the technical MVP. After the
workflow works, onboard more providers.

## 45. Suggested Development Order for YayeTech

Because your existing project already has hotel booking, do not create
transportation as a completely separate application.

Build it in this order:

``` text
1. Transportation database
        ↓
2. Partner onboarding
        ↓
3. Partner verification
        ↓
4. Service + fixed pricing
        ↓
5. Customer marketplace
        ↓
6. Transportation booking
        ↓
7. Mock payment
        ↓
8. Partner acceptance
        ↓
9. Driver assignment
        ↓
10. Notifications
        ↓
11. My Trip integration
        ↓
12. Reviews/support
        ↓
13. Production testing
        ↓
14. Real payment integration
        ↓
15. Real partners
        ↓
16. Car rental/intercity
        ↓
17. Driver app
        ↓
18. Live GPS
```

## 46. Final Product Vision

The transportation feature should eventually become:

``` text
                 YayeTech Trip
                      |
       +--------------+--------------+
       |              |              |
      Hotel       Transportation   Experiences
       |              |              |
    Booking       Airport/Taxi      Tours
       |              |              |
       +--------------+--------------+
                      |
                 My Trip
                      |
                  AI Assistant
```

The customer's experience should feel like **one trip**, not five
unrelated features.

The first objective is therefore not "build a taxi app."

The first objective is:

> **Build a trustworthy scheduled transportation marketplace connected
> to the customer's YayeTech hotel booking and My Trip.**

Once that works end-to-end, add car rental and intercity transport. Only
then invest in the much more complex driver app, live GPS, real-time
ETA, and on-demand rides.
