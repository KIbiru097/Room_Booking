import 'dotenv/config';
import {
  PrismaClient,
  Role,
  RoomStatus,
  DiscountType,
  BookingStatus,
  BookingSource,
  PaymentStatus,
  StayRequestType,
  StayRequestStatus,
} from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { hashPassword } from '../src/common/security/password-hasher';
import { seedSystemPermissions } from './seeds/permissions.seed';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL ?? '' }),
});

async function main() {
  console.log('🌱 Seeding initial data for YayeTech Hotel System...');

  // ── 1. Countries & Cities ────────────────────────────────────────────────
  const ethiopia = await prisma.country.upsert({
    where: { code: 'ET' },
    update: {},
    create: { name: 'Ethiopia', code: 'ET' },
  });

  const kenya = await prisma.country.upsert({
    where: { code: 'KE' },
    update: {},
    create: { name: 'Kenya', code: 'KE' },
  });

  const usa = await prisma.country.upsert({
    where: { code: 'US' },
    update: {},
    create: { name: 'United States', code: 'US' },
  });

  const addis = await prisma.city.upsert({
    where: { name_countryId: { name: 'Addis Ababa', countryId: ethiopia.id } },
    update: {},
    create: { name: 'Addis Ababa', countryId: ethiopia.id },
  });

  const hawassa = await prisma.city.upsert({
    where: { name_countryId: { name: 'Hawassa', countryId: ethiopia.id } },
    update: {},
    create: { name: 'Hawassa', countryId: ethiopia.id },
  });

  const nairobi = await prisma.city.upsert({
    where: { name_countryId: { name: 'Nairobi', countryId: kenya.id } },
    update: {},
    create: { name: 'Nairobi', countryId: kenya.id },
  });

  const newYork = await prisma.city.upsert({
    where: { name_countryId: { name: 'New York', countryId: usa.id } },
    update: {},
    create: { name: 'New York', countryId: usa.id },
  });

  // Heritage cities surfaced by the History & Heritage pillar.
  const gondar = await prisma.city.upsert({
    where: { name_countryId: { name: 'Gondar', countryId: ethiopia.id } },
    update: {},
    create: { name: 'Gondar', countryId: ethiopia.id },
  });

  const aksum = await prisma.city.upsert({
    where: { name_countryId: { name: 'Aksum', countryId: ethiopia.id } },
    update: {},
    create: { name: 'Aksum', countryId: ethiopia.id },
  });

  const lalibela = await prisma.city.upsert({
    where: { name_countryId: { name: 'Lalibela', countryId: ethiopia.id } },
    update: {},
    create: { name: 'Lalibela', countryId: ethiopia.id },
  });

  const harar = await prisma.city.upsert({
    where: { name_countryId: { name: 'Harar', countryId: ethiopia.id } },
    update: {},
    create: { name: 'Harar', countryId: ethiopia.id },
  });

  // ── 2. Users (Admin, Manager, Staff, Customer) ───────────────────────────
  const adminPassword = await hashPassword('AdminPass123!');
  const managerPassword = await hashPassword('ManagerPass123!');
  const staffPassword = await hashPassword('StaffPass123!');
  const customerPassword = await hashPassword('CustomerPass123!');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@yayetech.com' },
    update: { emailVerified: true, emailVerifiedAt: new Date(), status: 'ACTIVE' },
    create: {
      email: 'admin@yayetech.com',
      fullName: 'System Admin',
      passwordHash: adminPassword,
      role: Role.ADMIN,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@yayetech.com' },
    update: { emailVerified: true, emailVerifiedAt: new Date(), status: 'ACTIVE' },
    create: {
      email: 'manager@yayetech.com',
      fullName: 'Hotel Manager',
      passwordHash: managerPassword,
      role: Role.MANAGER,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: 'staff@yayetech.com' },
    update: { emailVerified: true, emailVerifiedAt: new Date(), status: 'ACTIVE' },
    create: {
      email: 'staff@yayetech.com',
      fullName: 'Hotel Staff',
      passwordHash: staffPassword,
      role: Role.STAFF,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: 'customer@yayetech.com' },
    update: { emailVerified: true, emailVerifiedAt: new Date(), status: 'ACTIVE' },
    create: {
      email: 'customer@yayetech.com',
      fullName: 'Kibru Guest',
      passwordHash: customerPassword,
      role: Role.CUSTOMER,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  // Keep the permission catalog idempotent and available before any hotel
  // role assignments are created by the manager console.
  await seedSystemPermissions(prisma);

  // ── 3. Transportation demo inventory ────────────────────────────────────
  // Three verified providers across Addis Ababa, Hawassa, and Nairobi with
  // vehicles, drivers, and a full range of service types so both tabs
  // (Airport Transfers & Car Rentals) show real cards in staging/dev.

  // ── Provider 1: Addis Ababa ──────────────────────────────────────────────
  const providerAddis = await prisma.transportProvider.upsert({
    where: { id: 'transport-provider-addis-demo' },
    update: { status: 'ACTIVE', verificationStatus: 'VERIFIED', cityId: addis.id },
    create: {
      id: 'transport-provider-addis-demo',
      userId: manager.id,
      businessName: 'LuxStay Addis Transport',
      legalName: 'LuxStay Addis Transport PLC',
      phone: '+251911000001',
      email: 'transport@luxstay.example',
      description: 'Premium airport transfers and insured rental vehicles across Addis Ababa. All drivers are licensed and background-checked.',
      status: 'ACTIVE',
      verificationStatus: 'VERIFIED',
      cityId: addis.id,
    },
  });

  // ── Provider 2: Hawassa ──────────────────────────────────────────────────
  const providerHawassa = await prisma.transportProvider.upsert({
    where: { id: 'transport-provider-hawassa-demo' },
    update: { status: 'ACTIVE', verificationStatus: 'VERIFIED', cityId: hawassa.id },
    create: {
      id: 'transport-provider-hawassa-demo',
      userId: manager.id,
      businessName: 'Rift Valley Rides',
      legalName: 'Rift Valley Rides PLC',
      phone: '+251912000002',
      email: 'rides@riftvalley.example',
      description: 'Comfortable transfers and private drivers for the Hawassa lake district. Specialising in hotel-to-airport routes and full-day private hire.',
      status: 'ACTIVE',
      verificationStatus: 'VERIFIED',
      cityId: hawassa.id,
    },
  });

  // ── Provider 3: Nairobi ──────────────────────────────────────────────────
  const providerNairobi = await prisma.transportProvider.upsert({
    where: { id: 'transport-provider-nairobi-demo' },
    update: { status: 'ACTIVE', verificationStatus: 'VERIFIED', cityId: nairobi.id },
    create: {
      id: 'transport-provider-nairobi-demo',
      userId: admin.id,
      businessName: 'Savannah Transfers Kenya',
      legalName: 'Savannah Transfers Kenya Ltd',
      phone: '+254700000003',
      email: 'info@savannahtransfers.example',
      description: 'Trusted Nairobi airport transfers, SUV rentals, and private drivers. Operating JKIA and Wilson Airport routes daily.',
      status: 'ACTIVE',
      verificationStatus: 'VERIFIED',
      cityId: nairobi.id,
    },
  });

  // ── Vehicles: Addis ──────────────────────────────────────────────────────
  await prisma.transportVehicle.upsert({
    where: { id: 'transport-vehicle-sedan-demo' },
    update: { providerId: providerAddis.id, status: 'AVAILABLE' },
    create: {
      id: 'transport-vehicle-sedan-demo',
      providerId: providerAddis.id,
      vehicleType: 'SEDAN',
      make: 'Toyota',
      model: 'Corolla',
      year: 2024,
      plateNumber: 'ET-LUX-001',
      color: 'White',
      passengerCapacity: 4,
      luggageCapacity: 3,
      status: 'AVAILABLE',
    },
  });

  await prisma.transportVehicle.upsert({
    where: { id: 'transport-vehicle-suv-addis-demo' },
    update: { providerId: providerAddis.id, status: 'AVAILABLE' },
    create: {
      id: 'transport-vehicle-suv-addis-demo',
      providerId: providerAddis.id,
      vehicleType: 'SUV',
      make: 'Toyota',
      model: 'Land Cruiser Prado',
      year: 2023,
      plateNumber: 'ET-LUX-002',
      color: 'Black',
      passengerCapacity: 7,
      luggageCapacity: 5,
      status: 'AVAILABLE',
    },
  });

  await prisma.transportVehicle.upsert({
    where: { id: 'transport-vehicle-minivan-addis-demo' },
    update: { providerId: providerAddis.id, status: 'AVAILABLE' },
    create: {
      id: 'transport-vehicle-minivan-addis-demo',
      providerId: providerAddis.id,
      vehicleType: 'MINIVAN',
      make: 'Toyota',
      model: 'HiAce',
      year: 2022,
      plateNumber: 'ET-LUX-003',
      color: 'Silver',
      passengerCapacity: 12,
      luggageCapacity: 8,
      status: 'AVAILABLE',
    },
  });

  // ── Vehicles: Hawassa ────────────────────────────────────────────────────
  await prisma.transportVehicle.upsert({
    where: { id: 'transport-vehicle-sedan-hawassa-demo' },
    update: { providerId: providerHawassa.id, status: 'AVAILABLE' },
    create: {
      id: 'transport-vehicle-sedan-hawassa-demo',
      providerId: providerHawassa.id,
      vehicleType: 'SEDAN',
      make: 'Hyundai',
      model: 'Elantra',
      year: 2023,
      plateNumber: 'ET-RVR-001',
      color: 'Blue',
      passengerCapacity: 4,
      luggageCapacity: 3,
      status: 'AVAILABLE',
    },
  });

  // ── Vehicles: Nairobi ────────────────────────────────────────────────────
  await prisma.transportVehicle.upsert({
    where: { id: 'transport-vehicle-suv-nairobi-demo' },
    update: { providerId: providerNairobi.id, status: 'AVAILABLE' },
    create: {
      id: 'transport-vehicle-suv-nairobi-demo',
      providerId: providerNairobi.id,
      vehicleType: 'SUV',
      make: 'Toyota',
      model: 'Fortuner',
      year: 2024,
      plateNumber: 'KEN-SAV-001',
      color: 'Pearl White',
      passengerCapacity: 7,
      luggageCapacity: 5,
      status: 'AVAILABLE',
    },
  });

  await prisma.transportVehicle.upsert({
    where: { id: 'transport-vehicle-minibus-nairobi-demo' },
    update: { providerId: providerNairobi.id, status: 'AVAILABLE' },
    create: {
      id: 'transport-vehicle-minibus-nairobi-demo',
      providerId: providerNairobi.id,
      vehicleType: 'MINIBUS',
      make: 'Ford',
      model: 'Transit',
      year: 2022,
      plateNumber: 'KEN-SAV-002',
      color: 'White',
      passengerCapacity: 15,
      luggageCapacity: 10,
      status: 'AVAILABLE',
    },
  });

  // ── Drivers: Addis ───────────────────────────────────────────────────────
  await prisma.transportDriver.upsert({
    where: { id: 'transport-driver-addis-1-demo' },
    update: { providerId: providerAddis.id, status: 'ACTIVE' },
    create: {
      id: 'transport-driver-addis-1-demo',
      providerId: providerAddis.id,
      name: 'Abebe Girma',
      phone: '+251911100001',
      licenseNumber: 'ETH-DRV-10021',
      status: 'ACTIVE',
    },
  });

  await prisma.transportDriver.upsert({
    where: { id: 'transport-driver-addis-2-demo' },
    update: { providerId: providerAddis.id, status: 'ACTIVE' },
    create: {
      id: 'transport-driver-addis-2-demo',
      providerId: providerAddis.id,
      name: 'Tigist Haile',
      phone: '+251911100002',
      licenseNumber: 'ETH-DRV-10022',
      status: 'ACTIVE',
    },
  });

  // ── Driver: Nairobi ──────────────────────────────────────────────────────
  await prisma.transportDriver.upsert({
    where: { id: 'transport-driver-nairobi-1-demo' },
    update: { providerId: providerNairobi.id, status: 'ACTIVE' },
    create: {
      id: 'transport-driver-nairobi-1-demo',
      providerId: providerNairobi.id,
      name: 'James Mwangi',
      phone: '+254700100001',
      licenseNumber: 'KEN-DRV-20011',
      status: 'ACTIVE',
    },
  });

  // ── Services: Addis Ababa (LuxStay) ─────────────────────────────────────
  const addisServices = [
    {
      id: 'transport-service-airport-pickup-sedan-demo',
      name: 'Bole Airport → Hotel (Sedan)',
      serviceType: 'AIRPORT_PICKUP' as const,
      description: 'Private meet-and-greet pickup from Bole International Airport to your Addis hotel. Driver holds your name sign at arrivals.',
      fixedPrice: 900,
      passengerLimit: 4,
      luggageLimit: 3,
      durationMinutes: 35,
      advanceBookingMinutes: 60,
    },
    {
      id: 'transport-service-airport-pickup-suv-demo',
      name: 'Bole Airport → Hotel (SUV)',
      serviceType: 'AIRPORT_PICKUP' as const,
      description: 'Spacious SUV transfer for families or guests with extra luggage. Bole International Airport to any Addis hotel.',
      fixedPrice: 1400,
      passengerLimit: 7,
      luggageLimit: 6,
      durationMinutes: 40,
      advanceBookingMinutes: 60,
    },
    {
      id: 'transport-service-airport-dropoff-sedan-demo',
      name: 'Hotel → Bole Airport (Sedan)',
      serviceType: 'AIRPORT_DROP_OFF' as const,
      description: 'Reliable scheduled drop-off from your Addis hotel to Bole International Airport. Fixed price, no surprises.',
      fixedPrice: 900,
      passengerLimit: 4,
      luggageLimit: 3,
      durationMinutes: 35,
      advanceBookingMinutes: 120,
    },
    {
      id: 'transport-service-airport-dropoff-suv-demo',
      name: 'Hotel → Bole Airport (SUV)',
      serviceType: 'AIRPORT_DROP_OFF' as const,
      description: 'SUV drop-off to Bole Airport — ideal for groups or guests with heavy luggage.',
      fixedPrice: 1400,
      passengerLimit: 7,
      luggageLimit: 6,
      durationMinutes: 40,
      advanceBookingMinutes: 120,
    },
    {
      id: 'transport-service-private-driver-addis-demo',
      name: 'Private Driver — Full Day (Addis)',
      serviceType: 'PRIVATE_DRIVER' as const,
      description: 'Book a dedicated driver for 8 hours across Addis Ababa. Perfect for meetings, shopping, or city sightseeing.',
      fixedPrice: 3500,
      passengerLimit: 4,
      luggageLimit: 2,
      durationMinutes: 480,
      advanceBookingMinutes: 180,
    },
    {
      id: 'transport-service-car-rental-sedan-demo',
      name: 'Toyota Corolla — Self-Drive Rental',
      serviceType: 'CAR_RENTAL' as const,
      description: 'Clean, insured sedan for self-drive around Addis. Unlimited city driving; fuel not included.',
      fixedPrice: 1800,
      dailyRate: 1800,
      passengerLimit: 4,
      luggageLimit: 3,
      depositAmount: 5000,
      mileagePolicyKm: 200,
      advanceBookingMinutes: 120,
    },
    {
      id: 'transport-service-car-rental-suv-demo',
      name: 'Land Cruiser Prado — SUV Rental',
      serviceType: 'CAR_RENTAL' as const,
      description: 'Full-size SUV rental for longer stays or intercity trips. Driver-supported option available on request.',
      fixedPrice: 3200,
      dailyRate: 3200,
      passengerLimit: 7,
      luggageLimit: 5,
      depositAmount: 10000,
      mileagePolicyKm: 300,
      advanceBookingMinutes: 240,
    },
  ];

  for (const service of addisServices) {
    await prisma.transportService.upsert({
      where: { id: service.id },
      update: { providerId: providerAddis.id, isActive: true, fixedPrice: service.fixedPrice, dailyRate: (service as any).dailyRate },
      create: { ...service, providerId: providerAddis.id, currency: 'ETB' },
    });
  }

  // ── Services: Hawassa (Rift Valley Rides) ────────────────────────────────
  const hawassaServices = [
    {
      id: 'transport-service-hawassa-airport-pickup-demo',
      name: 'Hawassa Airport → Hotel Transfer',
      serviceType: 'AIRPORT_PICKUP' as const,
      description: 'Comfortable sedan pickup from Hawassa Airport to any hotel in the city.',
      fixedPrice: 650,
      passengerLimit: 4,
      luggageLimit: 3,
      durationMinutes: 20,
      advanceBookingMinutes: 60,
    },
    {
      id: 'transport-service-hawassa-private-driver-demo',
      name: 'Private Driver — Hawassa Lake Tour',
      serviceType: 'PRIVATE_DRIVER' as const,
      description: 'Guided private driver around the Hawassa lake circuit, fish market, and nature reserves. Up to 6 hours.',
      fixedPrice: 2200,
      passengerLimit: 4,
      luggageLimit: 1,
      durationMinutes: 360,
      advanceBookingMinutes: 120,
    },
    {
      id: 'transport-service-hawassa-hotel-transfer-demo',
      name: 'Intercity Hotel Transfer (Hawassa ↔ Addis)',
      serviceType: 'HOTEL_TRANSFER' as const,
      description: 'Door-to-door intercity transfer between Hawassa and Addis Ababa. Approx 4–5 hours.',
      fixedPrice: 5500,
      passengerLimit: 4,
      luggageLimit: 4,
      durationMinutes: 270,
      advanceBookingMinutes: 360,
    },
  ];

  for (const service of hawassaServices) {
    await prisma.transportService.upsert({
      where: { id: service.id },
      update: { providerId: providerHawassa.id, isActive: true, fixedPrice: service.fixedPrice },
      create: { ...service, providerId: providerHawassa.id, currency: 'ETB' },
    });
  }

  // ── Services: Nairobi (Savannah Transfers) ───────────────────────────────
  const nairobiServices = [
    {
      id: 'transport-service-nairobi-airport-pickup-demo',
      name: 'JKIA Airport → Nairobi Hotel (SUV)',
      serviceType: 'AIRPORT_PICKUP' as const,
      description: 'Professional pickup from Jomo Kenyatta International Airport to your Nairobi hotel in a spacious SUV.',
      fixedPrice: 4500,
      passengerLimit: 6,
      luggageLimit: 5,
      durationMinutes: 45,
      advanceBookingMinutes: 60,
    },
    {
      id: 'transport-service-nairobi-minibus-demo',
      name: 'JKIA Group Transfer (Minibus)',
      serviceType: 'AIRPORT_PICKUP' as const,
      description: 'Minibus airport transfers for groups or corporate events. Fits up to 15 passengers.',
      fixedPrice: 9500,
      passengerLimit: 15,
      luggageLimit: 12,
      durationMinutes: 50,
      advanceBookingMinutes: 120,
    },
  ];

  for (const service of nairobiServices) {
    await prisma.transportService.upsert({
      where: { id: service.id },
      update: { providerId: providerNairobi.id, isActive: true, fixedPrice: service.fixedPrice },
      create: { ...service, providerId: providerNairobi.id, currency: 'KES' },
    });
  }

  // ── 4. Amenities ────────────────────────────────────────────────────────
  const standardAmenities = [
    { name: 'Free WiFi', category: 'GENERAL', icon: 'wifi' },
    { name: 'Swimming Pool', category: 'GENERAL', icon: 'pool' },
    { name: 'Gym & Fitness', category: 'HEALTH', icon: 'fitness_center' },
    { name: 'Spa & Wellness', category: 'HEALTH', icon: 'spa' },
    { name: 'Free Parking', category: 'GENERAL', icon: 'local_parking' },
    { name: 'Restaurant', category: 'DINING', icon: 'restaurant' },
    { name: 'Breakfast Included', category: 'DINING', icon: 'free_breakfast' },
    { name: 'Airport Shuttle', category: 'SERVICES', icon: 'airport_shuttle' },
    { name: 'Air Conditioning', category: 'ROOM', icon: 'ac_unit' },
    { name: 'Pet Friendly', category: 'GENERAL', icon: 'pets' },
  ];

  const amenityMap = new Map<string, string>();
  for (const amenity of standardAmenities) {
    const created = await prisma.amenity.upsert({
      where: { name: amenity.name },
      update: {},
      create: amenity,
    });
    amenityMap.set(amenity.name, created.id);
  }

  // ── 4. Hotels ───────────────────────────────────────────────────────────
  const skylightHotel = await prisma.hotel.upsert({
    where: { id: 'hotel-skylight-001' },
    update: {},
    create: {
      id: 'hotel-skylight-001',
      name: 'Grand Skylight Hotel Addis',
      description: 'Luxury 5-star hotel located near Bole International Airport featuring world-class amenities.',
      address: 'Bole Road, Airport Zone, Addis Ababa',
      lat: 8.9806,
      lng: 38.7958,
      starRating: 5,
      status: 'ACTIVE',
      cityId: addis.id,
      managerId: manager.id,
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945', isPrimary: true },
          { url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b', isPrimary: false },
        ],
      },
    },
  });

  const haileResort = await prisma.hotel.upsert({
    where: { id: 'hotel-haile-002' },
    // A manager owns exactly one hotel. Keep this demo hotel available but
    // unassigned so it can be claimed by another manager in the admin flow.
    update: { managerId: null },
    create: {
      id: 'hotel-haile-002',
      name: 'Haile Resort Hawassa',
      description: 'Serene lakeside resort overlooking Lake Hawassa with luxury suites and watersports.',
      address: 'Lakefront Drive, Hawassa',
      lat: 7.0621,
      lng: 38.4763,
      starRating: 4,
      status: 'ACTIVE',
      cityId: hawassa.id,
      managerId: null,
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef', isPrimary: true },
        ],
      },
    },
  });

  // Verified stays in Gondar so landmark pages can return proximity results.
  const gondarHotels = [
    {
      id: 'hotel-gondar-hills-003',
      name: 'Gondar Hills Resort',
      description: 'Hillside resort above the royal quarter with views over Fasil Ghebbi and the surrounding highlands.',
      address: 'Kenema Area, Gondar',
      lat: 12.6089,
      lng: 37.4701,
      starRating: 4,
      images: [
        { url: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9', isPrimary: true },
        { url: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7', isPrimary: false },
      ],
    },
    {
      id: 'hotel-qusquam-lodge-004',
      name: 'Qusquam Lodge Gondar',
      description: 'Quiet garden lodge on the Qusquam road, a short walk from Fasilides Bath and the old imperial compound.',
      address: 'Qusquam Road, Gondar',
      lat: 12.5997,
      lng: 37.4634,
      starRating: 3,
      images: [
        { url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945', isPrimary: true },
      ],
    },
    {
      id: 'hotel-royal-enclosure-view-005',
      name: 'Royal Enclosure View Hotel',
      description: 'Central hotel facing the Debre Berhan Selassie road with easy access to Gondar castle ruins and the market.',
      address: 'Debre Berhan Selassie Road, Gondar',
      lat: 12.6062,
      lng: 37.4638,
      starRating: 4,
      images: [
        { url: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa', isPrimary: true },
      ],
    },
  ];

  for (const hotel of gondarHotels) {
    await prisma.hotel.upsert({
      where: { id: hotel.id },
      update: { managerId: null },
      create: {
        ...hotel,
        status: 'ACTIVE',
        cityId: gondar.id,
        managerId: null,
        images: { create: hotel.images },
      },
    });
  }

  // Link Amenities to Hotels
  const wifiId = amenityMap.get('Free WiFi')!;
  const poolId = amenityMap.get('Swimming Pool')!;
  const gymId = amenityMap.get('Gym & Fitness')!;

  await prisma.hotelAmenity.upsert({
    where: { hotelId_amenityId: { hotelId: skylightHotel.id, amenityId: wifiId } },
    update: {},
    create: { hotelId: skylightHotel.id, amenityId: wifiId },
  });
  await prisma.hotelAmenity.upsert({
    where: { hotelId_amenityId: { hotelId: skylightHotel.id, amenityId: poolId } },
    update: {},
    create: { hotelId: skylightHotel.id, amenityId: poolId },
  });

  // ── 5. Rooms for Skylight Hotel ──────────────────────────────────────────
  const roomDeluxe = await prisma.room.upsert({
    where: { hotelId_roomNumber: { hotelId: skylightHotel.id, roomNumber: '101' } },
    update: {},
    create: {
      hotelId: skylightHotel.id,
      roomNumber: '101',
      type: 'Deluxe',
      capacity: 2,
      beds: 1,
      bathroom: 1,
      basePrice: 120.00,
      status: RoomStatus.AVAILABLE,
      description: 'Spacious Deluxe room with king bed and airport view.',
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39', isPrimary: true },
        ],
      },
    },
  });

  const roomSuite = await prisma.room.upsert({
    where: { hotelId_roomNumber: { hotelId: skylightHotel.id, roomNumber: '201' } },
    update: {},
    create: {
      hotelId: skylightHotel.id,
      roomNumber: '201',
      type: 'Executive Suite',
      capacity: 4,
      beds: 2,
      bathroom: 2,
      basePrice: 280.00,
      status: RoomStatus.AVAILABLE,
      description: 'Luxury Executive Suite with separate living room and panoramic city balcony.',
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1591088398332-8a7791972843', isPrimary: true },
        ],
      },
    },
  });

  // ── 5b. Staff hotel assignments ──────────────────────────────────────────
  // StaffHotel is the tenant boundary for STAFF accounts: without an
  // assignment the staff desk resolves zero hotels and renders empty.
  for (const hotel of [skylightHotel, haileResort]) {
    await prisma.staffHotel.upsert({
      where: {
        staffId_hotelId: { staffId: staff.id, hotelId: hotel.id },
      },
      update: {},
      create: {
        staffId: staff.id,
        hotelId: hotel.id,
        role: 'Front Desk',
      },
    });
  }

  // ── 5c. Staff desk demo data ─────────────────────────────────────────────
  // Reservations, stay requests, inbox threads and notifications scoped to
  // the staff-assigned hotels so the /staff console is populated on a fresh
  // database. Dates are relative to seed time so "today's" arrivals always
  // show up on the dashboard.
  const dayMs = 24 * 60 * 60 * 1000;
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const day = (offset: number) => new Date(today.getTime() + offset * dayMs);

  // Demo guests for the reservations below.
  const deskGuestPassword = await hashPassword('GuestPass123!');
  const deskGuests = [
    { id: 'user-desk-guest-001', email: 'selam@yayetech.com', fullName: 'Selamawit Bekele', phone: '+251911220011' },
    { id: 'user-desk-guest-002', email: 'yohannes@yayetech.com', fullName: 'Yohannes Alemu', phone: '+251911220022' },
    { id: 'user-desk-guest-003', email: 'meron@yayetech.com', fullName: 'Meron Tesfaye', phone: '+251911220033' },
    { id: 'user-desk-guest-004', email: 'dawit@yayetech.com', fullName: 'Dawit Haile', phone: '+251911220044' },
  ] as const;
  for (const guest of deskGuests) {
    await prisma.user.upsert({
      where: { email: guest.email },
      update: { role: Role.CUSTOMER, status: 'ACTIVE', emailVerified: true, emailVerifiedAt: new Date() },
      create: {
        id: guest.id,
        email: guest.email,
        fullName: guest.fullName,
        phone: guest.phone,
        passwordHash: deskGuestPassword,
        role: Role.CUSTOMER,
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });
  }

  // Haile rooms (Skylight rooms 101/201 already exist from section 5).
  const haileRooms = [
    { roomNumber: '101', type: 'Lakeside Standard', capacity: 2, basePrice: 95.0 },
    { roomNumber: '201', type: 'Lakeside Deluxe', capacity: 3, basePrice: 140.0 },
    { roomNumber: '301', type: 'Lake Suite', capacity: 4, basePrice: 220.0 },
  ] as const;
  const haileRoomIds: Record<string, string> = {};
  for (const room of haileRooms) {
    const created = await prisma.room.upsert({
      where: {
        hotelId_roomNumber: { hotelId: haileResort.id, roomNumber: room.roomNumber },
      },
      update: {},
      create: {
        hotelId: haileResort.id,
        roomNumber: room.roomNumber,
        type: room.type,
        capacity: room.capacity,
        beds: room.capacity > 2 ? 2 : 1,
        bathroom: 1,
        basePrice: room.basePrice,
        status: RoomStatus.AVAILABLE,
      },
    });
    haileRoomIds[room.roomNumber] = created.id;
  }

  interface DeskBookingSeed {
    id: string;
    bookingRef: string;
    guestEmail: string;
    hotelId: string;
    roomId: string;
    checkIn: Date;
    checkOut: Date;
    status: BookingStatus;
    bookingSource?: BookingSource;
    paymentMethod?: string;
    paymentStatus?: PaymentStatus;
  }

  const deskBookings: DeskBookingSeed[] = [
    // Grand Skylight (staff hotel 1) — today's arrivals and in-house guests.
    {
      id: 'booking-desk-0001',
      bookingRef: 'YT-DESK-1001',
      guestEmail: 'selam@yayetech.com',
      hotelId: skylightHotel.id,
      roomId: roomDeluxe.id,
      checkIn: day(0),
      checkOut: day(2),
      status: BookingStatus.CONFIRMED,
      paymentMethod: 'CASH',
      paymentStatus: PaymentStatus.PENDING_AT_HOTEL,
    },
    {
      id: 'booking-desk-0002',
      bookingRef: 'YT-DESK-1002',
      guestEmail: 'yohannes@yayetech.com',
      hotelId: skylightHotel.id,
      roomId: roomSuite.id,
      checkIn: day(0),
      checkOut: day(1),
      status: BookingStatus.PENDING,
    },
    {
      id: 'booking-desk-0003',
      bookingRef: 'YT-DESK-1003',
      guestEmail: 'meron@yayetech.com',
      hotelId: skylightHotel.id,
      roomId: roomDeluxe.id,
      checkIn: day(-1),
      checkOut: day(1),
      status: BookingStatus.CHECKED_IN,
      paymentMethod: 'CARD',
      paymentStatus: PaymentStatus.SUCCEEDED,
    },
    {
      id: 'booking-desk-0004',
      bookingRef: 'YT-DESK-1004',
      guestEmail: 'dawit@yayetech.com',
      hotelId: skylightHotel.id,
      roomId: roomSuite.id,
      checkIn: day(-3),
      checkOut: day(0),
      status: BookingStatus.CHECKED_IN,
      paymentMethod: 'CASH',
      paymentStatus: PaymentStatus.PENDING_AT_HOTEL,
    },
    // Haile Resort (staff hotel 2).
    {
      id: 'booking-desk-0005',
      bookingRef: 'YT-DESK-1005',
      guestEmail: 'selam@yayetech.com',
      hotelId: haileResort.id,
      roomId: haileRoomIds['201'],
      checkIn: day(1),
      checkOut: day(4),
      status: BookingStatus.CONFIRMED,
      paymentMethod: 'CARD',
      paymentStatus: PaymentStatus.SUCCEEDED,
    },
    {
      id: 'booking-desk-0006',
      bookingRef: 'YT-DESK-1006',
      guestEmail: 'yohannes@yayetech.com',
      hotelId: haileResort.id,
      roomId: haileRoomIds['101'],
      checkIn: day(0),
      checkOut: day(3),
      status: BookingStatus.PENDING,
    },
    {
      id: 'booking-desk-0007',
      bookingRef: 'YT-DESK-1007',
      guestEmail: 'meron@yayetech.com',
      hotelId: haileResort.id,
      roomId: haileRoomIds['301'],
      checkIn: day(-2),
      checkOut: day(0),
      status: BookingStatus.CHECKED_IN,
      bookingSource: BookingSource.WALK_IN,
      paymentMethod: 'CASH',
      paymentStatus: PaymentStatus.PENDING_AT_HOTEL,
    },
  ];

  for (const seed of deskBookings) {
    const guest = deskGuests.find((g) => g.email === seed.guestEmail)!;
    const nights = Math.max(
      1,
      Math.round((seed.checkOut.getTime() - seed.checkIn.getTime()) / dayMs),
    );
    const room = await prisma.room.findUnique({ where: { id: seed.roomId } });
    const nightly = Number(room?.basePrice ?? 100);
    const subtotal = nightly * nights;
    const taxAmount = Math.round(subtotal * 0.15 * 100) / 100;
    const totalPrice = Math.round((subtotal + taxAmount) * 100) / 100;

    const booking = await prisma.booking.upsert({
      where: { id: seed.id },
      update: {},
      create: {
        id: seed.id,
        bookingRef: seed.bookingRef,
        userId: guest.id,
        hotelId: seed.hotelId,
        checkIn: seed.checkIn,
        checkOut: seed.checkOut,
        status: seed.status,
        totalPrice,
        subtotal,
        taxAmount,
        bookingSource: seed.bookingSource ?? BookingSource.ONLINE,
        actualCheckIn:
          seed.status === BookingStatus.CHECKED_IN ? seed.checkIn : null,
        details: {
          create: {
            roomId: seed.roomId,
            guestCount: 2,
            checkIn: seed.checkIn,
            checkOut: seed.checkOut,
            guestInfo: {
              adults: 2,
              children: 0,
              guests: [{ name: guest.fullName, email: guest.email, phone: guest.phone }],
            },
            roomSnapshot: room
              ? {
                  roomNumber: room.roomNumber,
                  type: room.type,
                  capacity: room.capacity,
                  basePrice: Number(room.basePrice),
                }
              : undefined,
          },
        },
        statusHistory: {
          create: {
            fromStatus: BookingStatus.PENDING,
            toStatus: seed.status,
            changedBy: 'seed',
          },
        },
      },
    });

    if (seed.paymentStatus) {
      await prisma.payment.upsert({
        where: { bookingId: booking.id },
        update: {},
        create: {
          bookingId: booking.id,
          userId: guest.id,
          provider: seed.paymentMethod === 'CASH' ? 'HOTEL_DESK' : 'CHAPA',
          method: seed.paymentMethod ?? 'CARD',
          amount: totalPrice,
          status: seed.paymentStatus,
          txRef: `seed-${seed.bookingRef}`,
          completedAt:
            seed.paymentStatus === PaymentStatus.SUCCEEDED ? new Date() : null,
        },
      });
    }
  }

  // Stay requests the desk can approve/reject (today's early check-in and
  // tomorrow's late check-out on in-house bookings).
  const deskStayRequests = [
    {
      id: 'stayreq-desk-0001',
      bookingId: 'booking-desk-0003',
      type: StayRequestType.EARLY_CHECKIN,
      requestedTime: '09:30',
      fee: 15.0,
    },
    {
      id: 'stayreq-desk-0002',
      bookingId: 'booking-desk-0004',
      type: StayRequestType.LATE_CHECKOUT,
      requestedTime: '15:00',
      fee: 20.0,
    },
    {
      id: 'stayreq-desk-0003',
      bookingId: 'booking-desk-0007',
      type: StayRequestType.LATE_CHECKOUT,
      requestedTime: '14:00',
      fee: 20.0,
    },
  ] as const;
  for (const request of deskStayRequests) {
    await prisma.stayRequest.upsert({
      where: { id: request.id },
      update: {},
      create: {
        id: request.id,
        bookingId: request.bookingId,
        type: request.type,
        status: StayRequestStatus.PENDING,
        requestedTime: request.requestedTime,
        fee: request.fee,
        guestConsent: true,
      },
    });
  }

  // Inbox threads for the staff contact desk.
  const deskThreads = [
    {
      id: 'thread-desk-0001',
      guestEmail: 'meron@yayetech.com',
      hotelId: skylightHotel.id,
      bookingId: 'booking-desk-0003',
      subject: 'Airport pickup request',
      status: 'OPEN' as const,
      messages: [
        'Hello, my flight lands at 8:30 PM tonight. Can you arrange an airport pickup?',
        'Sure — a hotel car will wait at arrivals. Please share your flight number when you can.',
      ],
    },
    {
      id: 'thread-desk-0002',
      guestEmail: 'dawit@yayetech.com',
      hotelId: skylightHotel.id,
      bookingId: 'booking-desk-0004',
      subject: 'Late check-out for meeting',
      status: 'OPEN' as const,
      messages: [
        'I have a late meeting tomorrow. Is a 2 PM check-out possible?',
        'We can extend to 2 PM for a fee of 20 USD. Shall I confirm?',
      ],
    },
    {
      id: 'thread-desk-0003',
      guestEmail: 'selam@yayetech.com',
      hotelId: haileResort.id,
      bookingId: 'booking-desk-0005',
      subject: 'Lakeside room preferences',
      status: 'OPEN' as const,
      messages: [
        'We would love a quiet room facing the lake if possible.',
        'Noted — we have reserved a lakeside deluxe for you. See you soon!',
      ],
    },
  ] as const;
  for (const thread of deskThreads) {
    const guest = deskGuests.find((g) => g.email === thread.guestEmail)!;
    const created = await prisma.contactThread.upsert({
      where: { id: thread.id },
      update: {},
      create: {
        id: thread.id,
        customerId: guest.id,
        hotelId: thread.hotelId,
        bookingId: thread.bookingId,
        subject: thread.subject,
        status: thread.status,
      },
    });
    const existingMessages = await prisma.contactMessage.count({
      where: { threadId: created.id },
    });
    if (existingMessages === 0) {
      await prisma.contactMessage.createMany({
        data: thread.messages.map((content, index) => ({
          threadId: created.id,
          senderId: index === 0 ? guest.id : staff.id,
          content,
          readAt: index === 0 ? new Date() : null,
        })),
      });
    }
  }

  // In-app notifications for the staff account (arrivals, payments, requests).
  const deskNotifications = [
    {
      id: 'notif-desk-0001',
      type: 'BOOKING_CHECKIN_TODAY',
      payload: {
        title: 'Arrival today',
        message: 'Selamawit Bekele checks in today — Grand Skylight, room 101.',
      },
      readAt: null as Date | null,
    },
    {
      id: 'notif-desk-0002',
      type: 'PAYMENT_PENDING',
      payload: {
        title: 'Cash payment due',
        message: 'YT-DESK-1004 has a pending cash balance at check-out.',
      },
      readAt: null as Date | null,
    },
    {
      id: 'notif-desk-0003',
      type: 'STAY_REQUEST_PENDING',
      payload: {
        title: 'Early check-in request',
        message: 'Meron Tesfaye requested a 9:30 AM early check-in.',
      },
      readAt: new Date(),
    },
    {
      id: 'notif-desk-0004',
      type: 'NEW_MESSAGE',
      payload: {
        title: 'New guest message',
        message: 'Dawit Haile asked about a late check-out.',
      },
      readAt: new Date(),
    },
  ] as const;
  for (const notification of deskNotifications) {
    await prisma.notification.upsert({
      where: { id: notification.id },
      update: {},
      create: {
        id: notification.id,
        userId: staff.id,
        type: notification.type,
        channel: 'IN_APP',
        payload: notification.payload,
        sentAt: new Date(),
        readAt: notification.readAt,
      },
    });
  }

  // ── 6. Coupons ───────────────────────────────────────────────────────────
  await prisma.coupon.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      code: 'WELCOME10',
      discountType: DiscountType.PERCENTAGE,
      value: 10.00,
      validFrom: new Date('2026-01-01'),
      validTo: new Date('2027-12-31'),
      usageLimit: 500,
      timesUsed: 12,
    },
  });

  await prisma.coupon.upsert({
    where: { code: 'SUMMER50' },
    update: {},
    create: {
      code: 'SUMMER50',
      discountType: DiscountType.FIXED_AMOUNT,
      value: 50.00,
      validFrom: new Date('2026-06-01'),
      validTo: new Date('2026-09-01'),
      usageLimit: 100,
      timesUsed: 5,
    },
  });

  // ── 7. Platform Settings ────────────────────────────────────────────────
  await prisma.platformSetting.upsert({
    where: { key: 'system_info' },
    update: {},
    create: {
      key: 'system_info',
      value: {
        name: 'YayeTech Hotel Booking Platform',
        version: '1.0.0',
        supportEmail: 'support@yayetech.com',
      },
    },
  });

  // ── 8. Discover Pillar (Sources, Verified Places & Emergency Contacts) ──
  console.log('🏛️ Seeding verified Discover & Heritage places...');

  const heritageAuthoritySource = await prisma.source.upsert({
    where: { id: 'source-ethiopian-heritage' },
    update: {},
    create: {
      id: 'source-ethiopian-heritage',
      name: 'Ethiopian Heritage Authority',
      url: 'https://heritage.gov.et',
      license: 'Official Public Record / Open Government Data',
      verifiedBy: 'Cultural Heritage Field Review Team',
    },
  });

  const tourismMinistrySource = await prisma.source.upsert({
    where: { id: 'source-tourism-ministry' },
    update: {},
    create: {
      id: 'source-tourism-ministry',
      name: 'Ministry of Tourism Ethiopia (Land of Origins)',
      url: 'https://tourism.gov.et',
      license: 'Public Domain / Verified Tourism Directory',
      verifiedBy: 'Addis Ababa Tourism Information Desk',
    },
  });

  const addisAdministrationSource = await prisma.source.upsert({
    where: { id: 'source-addis-admin' },
    update: {},
    create: {
      id: 'source-addis-admin',
      name: 'Addis Ababa City Administration & Emergency Services',
      url: 'https://addisababa.gov.et',
      license: 'Official Civic Registry',
      verifiedBy: 'City Administration Public Safety Board',
    },
  });

  const unescoSource = await prisma.source.upsert({
    where: { id: 'source-unesco-whc' },
    update: {},
    create: {
      id: 'source-unesco-whc',
      name: 'UNESCO World Heritage Centre',
      url: 'https://whc.unesco.org',
      license: 'Official UNESCO World Heritage List record',
      verifiedBy: 'UNESCO nomination and evaluation documents',
    },
  });

  // Verified Places in Addis Ababa
  const placesData = [
    {
      id: 'place-national-museum',
      name: 'National Museum of Ethiopia',
      amharicName: 'የኢትዮጵያ ብሔራዊ ሙዚየም',
      description: 'Home to the famous 3.2-million-year-old fossilized hominid remains of Lucy (Dinknesh), ancient Aksumite relics, and royal ceremonial attire.',
      amharicDescription: 'ድንቅነሽ (ሉሲ) የተገኘችበት፣ ጥንታዊ የአክሱም ቅርሶችና የንጉሣውያን አልባሳት የሚገኙበት ታሪካዊ ሙዚየም።',
      category: 'MUSEUM' as const,
      address: 'King George VI St, Arat Kilo, Addis Ababa',
      lat: 9.0384,
      lng: 38.7618,
      phone: '+251 11 111 7150',
      website: 'https://heritage.gov.et/national-museum',
      openingHours: 'Mon-Sun 09:00 - 17:00',
      hoursVerified: true,
      priceLevel: 1,
      rating: 4.8,
      images: [
        'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800',
      ],
      sourceId: heritageAuthoritySource.id,
      cityId: addis.id,
    },
    {
      id: 'place-holy-trinity',
      name: 'Holy Trinity Cathedral (Kidist Selassie)',
      amharicName: 'ቅድስት ሥላሴ ካቴድራል',
      description: 'Architectural jewel with soaring stained-glass windows, hand-carved imperial thrones, and the final resting place of Emperor Haile Selassie and patriots of the liberation struggle.',
      amharicDescription: 'የቀዳማዊ ኃይለ ሥላሴና የሀገር አርበኞች መካነ መቃብር የሚገኝበት፣ ውብ ጥንታዊ ህንፃ ጥበብ የተላበሰ ቅዱስ ስፍራ።',
      category: 'HERITAGE' as const,
      address: 'Arat Kilo, Queen Elizabeth II St, Addis Ababa',
      lat: 9.0315,
      lng: 38.7663,
      phone: '+251 11 123 3582',
      openingHours: 'Mon-Sun 08:00 - 18:00',
      hoursVerified: true,
      priceLevel: 1,
      rating: 4.7,
      images: [
        'https://images.unsplash.com/photo-1590076215667-875d4ef2d7ee?w=800',
      ],
      sourceId: heritageAuthoritySource.id,
      cityId: addis.id,
    },
    {
      id: 'place-entoto-park',
      name: 'Entoto Natural & Eco Park',
      amharicName: 'የእንጦጦ የተፈጥሮ ፓርክ',
      description: 'Mountain retreat 3,200m above sea level with aromatic eucalyptus forests, horseback riding, ziplining, craft coffee lounges, and panoramic views of Addis Ababa.',
      amharicDescription: 'በንጹሕ አየር፣ በፈረስ ግልቢያና በአዲስ አበባ ከተማ ሙሉ ገጽታ የሚታይበት ውብ ተራራማ የተፈጥሮ መናፈሻ።',
      category: 'ATTRACTION' as const,
      address: 'Mount Entoto Ridge, Addis Ababa',
      lat: 9.0792,
      lng: 38.7635,
      phone: '+251 11 869 9999',
      openingHours: 'Mon-Sun 06:00 - 20:00',
      hoursVerified: true,
      priceLevel: 2,
      rating: 4.9,
      images: [
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800',
      ],
      sourceId: tourismMinistrySource.id,
      cityId: addis.id,
    },
    {
      id: 'place-tomoca-coffee',
      name: 'Tomoca Coffee (Historic Piazza)',
      amharicName: 'ቶሞካ ቡና (ፒያሳ)',
      description: 'Founded in 1953, Addis Ababa’s most iconic Italian-style espresso bar roasting high-altitude Harar, Sidama, and Yirgacheffe beans.',
      amharicDescription: 'ከ1953 ዓ.ም ጀምሮ ጥራት ያለው የኢትዮጵያ ሀረር እና ሲዳማ ቡና የሚቀርብበት አንጋፋው የፒያሳ ካፌ።',
      category: 'CAFE' as const,
      address: 'Wavel St, Piazza, Addis Ababa',
      lat: 9.0348,
      lng: 38.7516,
      phone: '+251 11 111 2781',
      website: 'https://tomocacoffee.com',
      openingHours: 'Mon-Sat 06:30 - 20:30, Sun 08:00 - 18:00',
      hoursVerified: true,
      priceLevel: 1,
      rating: 4.8,
      images: [
        'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800',
      ],
      sourceId: tourismMinistrySource.id,
      cityId: addis.id,
    },
    {
      id: 'place-yod-abyssinia',
      name: 'Yod Abyssinia Cultural Restaurant',
      amharicName: 'ዮድ አቢሲኒያ የባህል ምግብ ቤት',
      description: 'World-renowned Ethiopian traditional dining featuring injera feasts, traditional honey mead (Tej), and live tribal music and dance from all 10+ Ethiopian regions.',
      amharicDescription: 'የተለያዩ የኢትዮጵያ ብሔረሰቦች ባህላዊ ሙዚቃና ውዝዋዜ፣ ጠጅና ምርጥ የባህል ምግቦች የሚቀርቡበት የታወቀ ስፍራ።',
      category: 'RESTAURANT' as const,
      address: 'Bole Medhanialem Area, Addis Ababa',
      lat: 8.9950,
      lng: 38.7885,
      phone: '+251 11 661 2179',
      openingHours: 'Mon-Sun 12:00 - 23:30',
      hoursVerified: true,
      priceLevel: 3,
      rating: 4.7,
      images: [
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
      ],
      sourceId: tourismMinistrySource.id,
      cityId: addis.id,
    },
    {
      id: 'place-addis-mercato',
      name: 'Addis Mercato (Merkato)',
      amharicName: 'አዲስ መርካቶ',
      description: 'The largest open-air marketplace in Africa. An energetic sensory kaleidoscope offering authentic spices (berbere), handwoven fabrics (shemma), and silver filigree jewelry.',
      amharicDescription: 'በአፍሪካ ግዙፉ ክፍት የገበያ ማዕከል፤ ባህላዊ ቅመማ ቅመሞች፣ የሀገር ባህል ልብሶች እና ጥበቦች መገኛ።',
      category: 'SHOPPING' as const,
      address: 'Addis Ketema District, Addis Ababa',
      lat: 9.0300,
      lng: 38.7390,
      openingHours: 'Mon-Sat 08:30 - 18:30 (Closed Sundays)',
      hoursVerified: true,
      priceLevel: 1,
      rating: 4.5,
      images: [
        'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=800',
      ],
      sourceId: tourismMinistrySource.id,
      cityId: addis.id,
    },
    {
      id: 'place-tikur-anbessa',
      name: 'Tikur Anbessa (Black Lion) Hospital',
      amharicName: 'ጥቁር አንበሳ ስፔሻላይዝድ ሆስፒታል',
      description: 'Premier tertiary referral and teaching hospital with 24/7 emergency medicine trauma care unit.',
      amharicDescription: 'የ24 ሰዓት የድንገተኛ አደጋ ህክምና ክፍል ያለው ቀዳሚው የመንግስት ስፔሻላይዝድ ሆስፒታል።',
      category: 'HOSPITAL' as const,
      address: 'Zambia St, Lideta, Addis Ababa',
      lat: 9.0186,
      lng: 38.7492,
      phone: '+251 11 551 1211',
      openingHours: '24 Hours Emergency Service',
      hoursVerified: true,
      priceLevel: 1,
      rating: 4.3,
      images: [
        'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=800',
      ],
      sourceId: addisAdministrationSource.id,
      cityId: addis.id,
    },
  ];

  const unattributedPlaces = placesData.filter((place) => !place.sourceId);
  if (unattributedPlaces.length > 0) {
    throw new Error(
      `ROAD-001 violation: every seeded place must have a sourceId (${unattributedPlaces.map((place) => place.id).join(', ')})`,
    );
  }

  for (const p of placesData) {
    await prisma.place.upsert({
      where: { id: p.id },
      update: {},
      create: p,
    });
  }

  // Verified heritage places across Ethiopia's heritage cities.
  // Every entry carries a sourceId (ROAD-001) and leaves openingHours unset so
  // the UI labels them "Hours may vary" (PLACE-010) instead of inventing hours.
  const heritagePlaces = [
    // ── Gondar ──
    {
      id: 'place-fasil-ghebbi',
      name: 'Fasil Ghebbi (Royal Enclosure)',
      amharicName: 'ፊዚል ግቢ',
      description:
        'Royal enclosure of the Gondarine emperors, founded in the 17th century by Emperor Fasilides. Its fortress-palaces blend Ethiopian, Indian, Arab and Baroque building traditions. UNESCO World Heritage Site since 1979.',
      amharicDescription:
        'ንጉሣተ ጎንዳር ቤተ መንግሥት ከፍተኛ ቦታ፤ በንጉሡ ፊዚል የተመሰረተ የጎንዳር ንጉሣዊ ግቢ።',
      category: 'HERITAGE' as const,
      address: 'Royal Enclosure (Fasil Ghebbi), Gondar',
      lat: 12.603,
      lng: 37.467,
      priceLevel: 1,
      rating: 4.8,
      images: [
        'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/ET_Gondar_asv2018-02_img18_Fasil_Ghebbi.jpg/960px-ET_Gondar_asv2018-02_img18_Fasil_Ghebbi.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Fasilides_Palace_01.jpg/960px-Fasilides_Palace_01.jpg',
      ],
      sourceId: unescoSource.id,
      cityId: gondar.id,
    },
    {
      id: 'place-debre-berhan-selassie',
      name: 'Debre Berhan Selassie Church',
      amharicName: 'ደብረ ብርሃን ሥላሴ',
      description:
        "Gondar's best-known church, celebrated for its interior murals of cherubim, biblical scenes and its ceiling of painted angels, alongside a treasury of historic manuscripts.",
      amharicDescription:
        'የግቢ ጎንዳር ታዋቂው አብያተ ክርስቲያን፤ በውስጡ ባሉት ሥዕሎችና በሰማዩ መላእክት ስዕል የታወቀ።',
      category: 'HERITAGE' as const,
      address: 'Debre Berhan Selassie, Gondar',
      lat: 12.6029,
      lng: 37.4705,
      priceLevel: 1,
      rating: 4.7,
      images: [
        'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/ET_Gondar_asv2018-02_img42_Debre_Berhan_Selassie.jpg/960px-ET_Gondar_asv2018-02_img42_Debre_Berhan_Selassie.jpg',
      ],
      sourceId: heritageAuthoritySource.id,
      cityId: gondar.id,
    },
    {
      id: 'place-fasilides-bath',
      name: "Fasilides' Bath (Qusquam)",
      amharicName: 'የፊዚሊዴስ ጠጭ',
      description:
        'Royal bathhouse and pool complex on the Qusquam hill, where the Timkat (Epiphany) celebrations in Gondar culminate with the immersion of the tabot replica.',
      amharicDescription:
        'በቆስቋም ተራራ ላይ የሚገኝ የንጉሡ ጠጭ፤ ጥምቀት በዓል በእህሉ ዙሪያ የሚከበርበት ቅዱስ ስፍራ።',
      category: 'HERITAGE' as const,
      address: 'Qusquam, Gondar',
      lat: 12.5967,
      lng: 37.4658,
      priceLevel: 1,
      rating: 4.6,
      images: [
        'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/ET_Gondar_asv2018-02_img29_Fasilides_Bath.jpg/960px-ET_Gondar_asv2018-02_img29_Fasilides_Bath.jpg',
      ],
      sourceId: unescoSource.id,
      cityId: gondar.id,
    },

    // ── Aksum ──
    {
      id: 'place-northern-stelae-park',
      name: 'Northern Stelae Park (Obelisk Field)',
      amharicName: 'የሰሜን ሐውልት ሜዳ',
      description:
        'Archaeological park of the ancient Aksumite stelae, including a monumental carved monolithic stele dating to the Aksumite period. Aksum is a UNESCO World Heritage Site.',
      amharicDescription:
        'የጥንታዊ አክሱማዊ ሐውልቶች የአርኪዮሎጂ ፓርክ፤ ከአክሱማዊው ዘመን ጋር የተያያዘ ትልቅ የተቆረጠ ነጠላ ሐውልትን ያካትታል። አክሱም የዩኔስኮ የዓለም ቅርስ ቦታ ነው።',
      category: 'HERITAGE' as const,
      address: 'Northern Stelae Park, Aksum',
      lat: 14.131,
      lng: 38.721,
      priceLevel: 1,
      rating: 4.8,
      images: [
        'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Stela_in_Main_Stelae_Field_-_Axum_%28Aksum%29_-_Ethiopia_-_01_%288701108913%29.jpg/960px-Stela_in_Main_Stelae_Field_-_Axum_%28Aksum%29_-_Ethiopia_-_01_%288701108913%29.jpg',
      ],
      sourceId: unescoSource.id,
      cityId: aksum.id,
    },
    {
      id: 'place-mary-of-zion',
      name: 'Church of Our Lady Mary of Zion',
      amharicName: 'ቅድስት ማርያም ስዮን',
      description:
        "Aksum's principal church and, by long tradition, the coronation church of Ethiopia's emperors. Tradition holds that a sacred relic rests in the chapel reserved to its guardian.",
      amharicDescription:
        'የአክሱም ዋናው አብያተ ክርስቲያን፤ ንጉሣውያን የሚกกዱበት ቅዱስ ቤተ ክርስቲያን።',
      category: 'HERITAGE' as const,
      address: 'Church of Our Lady Mary of Zion, Aksum',
      lat: 14.1335,
      lng: 38.7255,
      priceLevel: 1,
      rating: 4.7,
      images: [
        'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/ET_Axum_asv2018-01_img31_StMary_of_Zion_Church.jpg/960px-ET_Axum_asv2018-01_img31_StMary_of_Zion_Church.jpg',
      ],
      sourceId: heritageAuthoritySource.id,
      cityId: aksum.id,
    },
    {
      id: 'place-queens-bath',
      name: "Queen of Sheba's Bath (Megretsu)",
      amharicName: 'የንግሥቲት ሳባ ጠጭ',
      description:
        'A large ancient reservoir and terraced site on the edge of Aksum, traditionally linked in local legend with the Queen of Sheba (Makeda).',
      amharicDescription:
        'በአክሱም ድንበር ላይ የሚገኝ ትናንሽ ጥንታዊ ምንጭ፤ ከንግሥቲት ሳባ ጋር በወግ የሚተባበር።',
      category: 'ATTRACTION' as const,
      address: 'Megretsu, Aksum',
      lat: 14.1083,
      lng: 38.7069,
      priceLevel: 1,
      rating: 4.4,
      images: [
        'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/ET_Axum_asv2018-01_img21_Queen_of_Sheba_Bath.jpg/960px-ET_Axum_asv2018-01_img21_Queen_of_Sheba_Bath.jpg',
      ],
      sourceId: tourismMinistrySource.id,
      cityId: aksum.id,
    },

    // ── Lalibela ──
    {
      id: 'place-bete-giyorgis',
      name: 'Bete Giyorgis (Church of St. George)',
      amharicName: 'ቤተ ጊዮርጊስ',
      description:
        'Rock-hewn church cut down into solid rock in the shape of a Greek cross, the most iconic of Lalibela’s monolithic churches. Part of the UNESCO World Heritage Site inscribed in 1978.',
      amharicDescription:
        'በእግር ሥዕል የተቀረጠበት የቅዱስ ጊዮርጊስ አብያተ ክርስቲያን፤ ለላሊበላ ሲማዊ ቅርስ የሆነ።',
      category: 'HERITAGE' as const,
      address: 'Bete Giyorgis, Lalibela',
      lat: 12.0316,
      lng: 39.0434,
      priceLevel: 1,
      rating: 4.9,
      images: [
        'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Lalibela%2C_san_giorgio%2C_esterno_24.jpg/960px-Lalibela%2C_san_giorgio%2C_esterno_24.jpg',
      ],
      sourceId: unescoSource.id,
      cityId: lalibela.id,
    },
    {
      id: 'place-bete-medhane-alem',
      name: 'Bete Medhane Alem',
      amharicName: 'ቤተ መድኃኔዓለም',
      description:
        'The largest of Lalibela’s rock-hewn churches, a monolithic hall ringed by a rock-cut courtyard, trenches and carved hermit cells.',
      amharicDescription:
        'ከላሊበላ የተቀረጡ በዓሉ አብያተ ክርስቲያን መካከል የተሳፋሪው፤ በድንጋይ የተቆረጠ አዳራሑ።',
      category: 'HERITAGE' as const,
      address: 'Bete Medhane Alem, Lalibela',
      lat: 12.0329,
      lng: 39.0416,
      priceLevel: 1,
      rating: 4.8,
      images: [
        'https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Bete_Medhane_Alem_in_Lalibela.JPG/960px-Bete_Medhane_Alem_in_Lalibela.JPG',
      ],
      sourceId: unescoSource.id,
      cityId: lalibela.id,
    },
    {
      id: 'place-bete-amanuel',
      name: 'Bete Amanuel',
      amharicName: 'ቤተ አማኑኤል',
      description:
        'The most finely finished of Lalibela’s rock-hewn churches, its façade of alternating recessed and projecting courses echoing the building style of ancient Aksum.',
      amharicDescription:
        'የተሳለ የልብሰ ገጽ ያለው፤ ከአክሱም ዘመናዊ አሰራር ጋር የሚመሳስል የድንጋይ ቤተ ክርስቲያን።',
      category: 'HERITAGE' as const,
      address: 'Bete Amanuel, Lalibela',
      lat: 12.0307,
      lng: 39.0437,
      priceLevel: 1,
      rating: 4.8,
      images: [
        'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Lalibela%2C_chiesa_di_bete_amanuel%2C_esterno_01%2C0.jpg/960px-Lalibela%2C_chiesa_di_bete_amanuel%2C_esterno_01%2C0.jpg',
      ],
      sourceId: unescoSource.id,
      cityId: lalibela.id,
    },

    // ── Harar ──
    {
      id: 'place-harar-jugol',
      name: 'Harar Jugol (Walled City)',
      amharicName: 'ሐረር ጅጉል (የተከበበች ከተማ)',
      description:
        'The old walled town of Harar, enclosed by a circuit of walls and gates and home to a dense weave of mosques, shrines and traditional courtyard houses. UNESCO World Heritage Site since 2006.',
      amharicDescription:
        'በቅጥቶችና በሮች በመደበቅ የተጠበቀው ጥንታዊ የሐረር ከተማ፤ በመስጊዶች፣ በቅዱሳን ስፍሮችና በባህላዊ የግቢ ቤቶች በብዛት የተሞላ ናት። ከ2006 ዓ.ም ጀምሮ የዩኔስኮ የዓለም ቅርስ ቦታ ናት።',
      category: 'HERITAGE' as const,
      address: 'Harar Jugol Old Town, Harar',
      lat: 9.3117,
      lng: 42.1186,
      priceLevel: 1,
      rating: 4.7,
      images: [
        'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/City_Gate%2C_Harar_Jugol_%2814464345823%29.jpg/960px-City_Gate%2C_Harar_Jugol_%2814464345823%29.jpg',
      ],
      sourceId: unescoSource.id,
      cityId: harar.id,
    },
    {
      id: 'place-rimbaud-house',
      name: 'Arthur Rimbaud House',
      amharicName: 'የሪምቦ ቤት',
      description:
        'The house where the French poet Arthur Rimbaud lived in Harar in the 1880s, now a museum presenting his life, manuscripts and time in the city.',
      amharicDescription:
        'በሀረር የተገኘ የፈረንሳዊው ጸሐፊ አርቶ ሪምቦ ቤት፤ አሁን ሙዚየም ሆኖ ተቀምጧል።',
      category: 'MUSEUM' as const,
      address: 'Muda Garad, Harar',
      lat: 9.3144,
      lng: 42.1213,
      priceLevel: 1,
      rating: 4.5,
      images: [
        'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Harar%2C_Ethiopia_-_52016190051.jpg/960px-Harar%2C_Ethiopia_-_52016190051.jpg',
      ],
      sourceId: tourismMinistrySource.id,
      cityId: harar.id,
    },
  ];

  const unattributedHeritagePlaces = heritagePlaces.filter((place) => !place.sourceId);
  if (unattributedHeritagePlaces.length > 0) {
    throw new Error(
      `ROAD-001 violation: every heritage place must have a sourceId (${unattributedHeritagePlaces
        .map((place) => place.id)
        .join(', ')})`,
    );
  }

  for (const p of heritagePlaces) {
    await prisma.place.upsert({
      where: { id: p.id },
      update: {},
      create: p,
    });
  }

  // Source-controlled city history. The web client reads this payload through
  // /discover/cities/:cityId/history; it must not ship historical facts in a
  // frontend bundle where they cannot be reviewed or updated independently.
  const cityHistoryData = [
    {
      id: 'history-gondar', cityId: gondar.id, sourceId: unescoSource.id,
      tagline: 'The royal capital that shaped northern Ethiopian architecture.',
      overview: 'Gondar became a permanent royal centre in the 17th century. Its surviving royal enclosure and churches show the layered architectural and religious history of the Gondarine period.',
      timeline: [
        { id: 'gondar-capital', period: 'Mid-17th century', title: 'A royal capital takes root', body: 'Emperor Fasilides made Gondar his capital and established the royal enclosure known as Fasil Ghebbi.', citation: { name: 'UNESCO World Heritage Centre', url: 'https://whc.unesco.org/en/list/19/' } },
        { id: 'gondar-unesco', period: '1979', title: 'World Heritage inscription', body: 'Fasil Ghebbi was inscribed on the UNESCO World Heritage List as an outstanding example of Ethiopian court architecture.', citation: { name: 'UNESCO World Heritage Centre', url: 'https://whc.unesco.org/en/list/19/' } },
      ],
      stories: [
        { id: 'gondar-castles', title: 'A city of castles', body: 'The royal enclosure brings together fortress-palaces and other court buildings developed by successive Gondarine rulers.', placeId: 'place-fasil-ghebbi', citation: { name: 'UNESCO World Heritage Centre', url: 'https://whc.unesco.org/en/list/19/' } },
        { id: 'gondar-church', title: 'Living worship and painted art', body: 'Debre Berhan Selassie remains a place of worship and is known for its painted interior and manuscript tradition.', placeId: 'place-debre-berhan-selassie', citation: { name: 'Ethiopian Heritage Authority', url: 'https://heritage.gov.et' } },
      ],
      culture: [
        { id: 'gondar-timkat', title: 'Timkat at the royal bath', body: 'Gondar’s Timkat celebrations are associated with the Fasilides Bath and are part of the city’s living religious calendar.', citation: { name: 'Ministry of Tourism Ethiopia', url: 'https://tourism.gov.et' } },
        { id: 'gondar-coffee', title: 'Coffee ceremony', body: 'Coffee ceremony is a shared Ethiopian hospitality tradition; visitors should follow the host’s local customs when participating.', citation: { name: 'Ministry of Tourism Ethiopia', url: 'https://tourism.gov.et' } },
      ],
    },
    {
      id: 'history-aksum', cityId: aksum.id, sourceId: unescoSource.id,
      tagline: 'The centre of an ancient kingdom and a living spiritual landscape.',
      overview: 'Aksum preserves archaeological remains and religious places associated with the history of the Aksumite kingdom and Ethiopia’s northern highlands.',
      timeline: [
        { id: 'aksum-kingdom', period: '1st–7th centuries CE', title: 'The Aksumite kingdom', body: 'Aksum was the centre of a trading power that reached across the Red Sea and raised monumental stelae.', citation: { name: 'UNESCO World Heritage Centre', url: 'https://whc.unesco.org/en/list/15/' } },
        { id: 'aksum-unesco', period: '1980', title: 'World Heritage inscription', body: 'The archaeological site of Aksum was inscribed on the UNESCO World Heritage List.', citation: { name: 'UNESCO World Heritage Centre', url: 'https://whc.unesco.org/en/list/15/' } },
      ],
      stories: [
        { id: 'aksum-stelae', title: 'The stelae field', body: 'The northern stelae field is the most visible legacy of Aksumite funerary architecture.', placeId: 'place-northern-stelae-park', citation: { name: 'UNESCO World Heritage Centre', url: 'https://whc.unesco.org/en/list/15/' } },
        { id: 'aksum-mary', title: 'A living sacred landscape', body: 'The Church of Our Lady Mary of Zion remains an important religious place; access rules are determined by local custodians.', placeId: 'place-mary-of-zion', citation: { name: 'Ethiopian Heritage Authority', url: 'https://heritage.gov.et' } },
      ],
      culture: [
        { id: 'aksum-pilgrimage', title: 'Pilgrimage and worship', body: 'Visitors should respect worship services, photography restrictions, and local guidance at active religious sites.', citation: { name: 'Ethiopian Heritage Authority', url: 'https://heritage.gov.et' } },
      ],
    },
    {
      id: 'history-lalibela', cityId: lalibela.id, sourceId: unescoSource.id,
      tagline: 'Rock-hewn churches, pilgrimage, and living craftsmanship.',
      overview: 'Lalibela is known for its group of rock-hewn churches and the continuing religious practices that connect the monuments to the present day.',
      timeline: [
        { id: 'lalibela-churches', period: '12th–13th centuries', title: 'A monumental church complex', body: 'The rock-hewn churches of Lalibela form a remarkable group of monolithic and semi-monolithic structures.', citation: { name: 'UNESCO World Heritage Centre', url: 'https://whc.unesco.org/en/list/18/' } },
        { id: 'lalibela-unesco', period: '1978', title: 'World Heritage inscription', body: 'The Rock-Hewn Churches of Lalibela were inscribed on the UNESCO World Heritage List.', citation: { name: 'UNESCO World Heritage Centre', url: 'https://whc.unesco.org/en/list/18/' } },
      ],
      stories: [
        { id: 'lalibela-giyorgis', title: 'Bete Giyorgis', body: 'Bete Giyorgis is a monolithic church cut into the rock in the shape of a cross.', placeId: 'place-bete-giyorgis', citation: { name: 'UNESCO World Heritage Centre', url: 'https://whc.unesco.org/en/list/18/' } },
      ],
      culture: [
        { id: 'lalibela-pilgrimage', title: 'A living pilgrimage destination', body: 'The churches remain active religious places. Visitors should dress modestly and follow guidance from custodians and clergy.', citation: { name: 'Ethiopian Heritage Authority', url: 'https://heritage.gov.et' } },
      ],
    },
    {
      id: 'history-harar', cityId: harar.id, sourceId: unescoSource.id,
      tagline: 'A walled city of Islamic heritage, homes, and living traditions.',
      overview: 'Harar Jugol preserves a historic walled settlement with mosques, shrines, traditional houses, and cultural practices that remain part of city life.',
      timeline: [
        { id: 'harar-jugol', period: 'Historic Islamic city', title: 'Harar Jugol', body: 'The old walled town contains a dense network of mosques, shrines, gates, and traditional courtyard houses.', citation: { name: 'UNESCO World Heritage Centre', url: 'https://whc.unesco.org/en/list/1189/' } },
        { id: 'harar-unesco', period: '2006', title: 'World Heritage inscription', body: 'Harar Jugol was inscribed on the UNESCO World Heritage List.', citation: { name: 'UNESCO World Heritage Centre', url: 'https://whc.unesco.org/en/list/1189/' } },
      ],
      stories: [
        { id: 'harar-walled-city', title: 'Inside the walls', body: 'Harar’s gates and lanes connect homes, mosques, shrines, markets, and traditional community spaces.', placeId: 'place-harar-jugol', citation: { name: 'UNESCO World Heritage Centre', url: 'https://whc.unesco.org/en/list/1189/' } },
      ],
      culture: [
        { id: 'harar-customs', title: 'Respect local customs', body: 'Harar is a living community. Ask before photographing people, homes, ceremonies, or religious spaces.', citation: { name: 'Ethiopian Heritage Authority', url: 'https://heritage.gov.et' } },
      ],
    },
  ];

  for (const history of cityHistoryData) {
    await prisma.cityHistory.upsert({
      where: { cityId: history.cityId },
      update: history,
      create: history,
    });
  }

  // Emergency Contacts (Curated official phone numbers with source verification)
  const emergencyData = [
    {
      id: 'emg-police-991',
      city: 'Addis Ababa',
      kind: 'POLICE',
      name: 'Ethiopian Federal Police Emergency Dispatch',
      phone: '991',
      sourceId: addisAdministrationSource.id,
      status: 'PUBLISHED',
    },
    {
      id: 'emg-ambulance-907',
      city: 'Addis Ababa',
      kind: 'AMBULANCE',
      name: 'Ethiopian Red Cross National Ambulance',
      phone: '907',
      sourceId: addisAdministrationSource.id,
      status: 'PUBLISHED',
    },
    {
      id: 'emg-fire-939',
      city: 'Addis Ababa',
      kind: 'FIRE',
      name: 'City Fire & Emergency Rescue Service',
      phone: '939',
      sourceId: addisAdministrationSource.id,
      status: 'PUBLISHED',
    },
    {
      id: 'emg-hospital-tikur',
      city: 'Addis Ababa',
      kind: 'HOSPITAL',
      name: 'Tikur Anbessa Emergency Trauma Desk',
      phone: '+251 11 551 1211',
      sourceId: addisAdministrationSource.id,
      status: 'PUBLISHED',
    },
    {
      id: 'emg-hotel-skylight',
      city: 'Addis Ababa',
      hotelId: skylightHotel.id,
      kind: 'HOTEL',
      name: 'Grand Skylight Front Desk & Guest Safety',
      phone: '+251 11 681 8181',
      sourceId: tourismMinistrySource.id,
      status: 'PUBLISHED',
    },
  ];

  for (const emg of emergencyData) {
    await prisma.emergencyContact.upsert({
      where: { id: emg.id },
      update: {},
      create: emg,
    });
  }

  console.log('✅ Seeding complete!');
  console.log(`   Admin:    ${admin.email} (AdminPass123!)`);
  console.log(`   Manager:  ${manager.email} (ManagerPass123!)`);
  console.log(`   Staff:    ${staff.email} (StaffPass123!)`);
  console.log(`   Customer: ${customer.email} (CustomerPass123!)`);
  console.log(`   Hotels:   ${skylightHotel.name}, ${haileResort.name}, ${gondarHotels.length} in Gondar`);
  console.log(`   Places:   ${placesData.length + heritagePlaces.length} verified places seeded`);
  console.log(`   Heritage: ${heritagePlaces.length} heritage places across 4 heritage cities`);
  console.log(`   Contacts: ${emergencyData.length} emergency contacts seeded`);
  console.log(`   Transport: 3 providers, 6 vehicles, 3 drivers, 12 services (Addis / Hawassa / Nairobi)`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
