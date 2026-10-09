# expALL.md — Full Project Explanation

Everything in this repository, end to end: what it is, how it is structured, how the pieces talk to each other, and how to run it.

---

## 1. What this is

**A full-stack hotel booking platform** (branded *YayeTech / LuxStay / LuxSty* across surfaces) with **three client apps sharing one backend**:

| Surface | Tech | Port | Purpose |
|---|---|---|---|
| `apps/api` | NestJS 11 + Prisma 7 + PostgreSQL | **3001** | All business logic — the only source of truth |
| `apps/web` | Next.js 15 (App Router, Turbopack dev) | **4000** | Customer site + Admin / Manager / Staff portals |
| `apps/mobile` | React Native + Expo | — | iOS/Android guest app (offline-ready) |
| `apps/docs` | Next.js | 3001 *(default!)* | Bare docs scaffold — still the create-next-app starter |

Monorepo: **Turborepo + pnpm workspaces** (`pnpm-workspace.yaml` → `apps/*`, `packages/*`).

---

## 2. Directory map

```
hotel_system/
├── apps/
│   ├── api/                 NestJS backend
│   │   ├── prisma/          schema.prisma (46 models), 32 migrations, seed.ts
│   │   └── src/
│   │       ├── modules/     22 feature modules, 34 controllers, ~225 routes
│   │       ├── common/      guards, interceptors, filters, cache, storage, security
│   │       ├── config/      Zod-validated env configuration
│   │       └── generated/   committed Prisma client (generated/)
│   ├── web/                 Next.js customer + admin web
│   │   ├── src/app/         routes (see §7)
│   │   ├── src/components/  NavBar, AIChat, HeroSearchBar, NavigationProgressBar…
│   │   ├── src/lib/         services.ts (API client), api.ts (fetch wrapper), i18n, offline-cache
│   │   └── src/locales/     en/, am/  (Amharic) — full UI translation
│   ├── mobile/              Expo app — 40+ screens, tests in src/__tests__
│   └── docs/                Next.js docs scaffold (unfinished)
├── packages/
│   ├── shared-types/        Zod schemas + TS types shared by api/web/mobile (+ committed dist/)
│   ├── ui/                  tiny shared components (button, card, code)
│   ├── eslint-config/       shared lint config
│   └── typescript-config/   shared tsconfig
├── scripts/                 smoke-test.ts, test-e2e-flow.ts, export-postman.ts
├── docker-compose.yml       postgres:16 (5433) + redis:7 (6379)
├── render.yaml              production API deployment
├── turbo.json               tasks: build / lint / check-types / test / dev
└── pnpm-lock.yaml
```

---

## 3. Tech stack

| Layer | Choice |
|---|---|
| API | NestJS 11, TypeScript strict, Winston logging, Helmet, throttler (rate limit) |
| DB | PostgreSQL (local/Neon), Prisma 7 ORM, `@prisma/adapter-pg` |
| Queue | BullMQ + Redis (booking expiry, check-in reminders, trip reminders, account purge, no-show) |
| Auth | JWT — access 15m + refresh 7d, sessions in DB, Google OAuth, admin **MFA/TOTP** |
| Validation | Zod + `nestjs-zod` (DTOs are Zod schemas) |
| Payments | Provider switch `mock | chapa`; gateways: Chapa, Telebirr, CBE Birr, PayPal, credit card, cash, mock |
| Storage | Cloudinary (images) with a local `uploads/` fallback |
| Email | Nodemailer/SMTP (verification, reset, notifications) |
| AI | Gemini (primary) → mock → fallback; RAG over knowledge docs; role-scoped tool registry |
| Web | Next.js 15 App Router, Tailwind CSS v4, TanStack Query, Zustand, react-hook-form + Zod, framer-motion, lucide-react, ogl |
| Mobile | Expo, expo-secure-store, local auth, offline caching, Jest tests |
| Docs/API | Swagger/OpenAPI at `/docs`, `postman_collection.json`, `pnpm export:postman` |

---

## 4. Backend (`apps/api`) — 22 modules

| Module | Responsibility |
|---|---|
| `identity` | register/login/refresh, Google OAuth, MFA, sessions, password reset |
| `catalog` | countries, cities, hotels, rooms, amenities, images, pricing, availability, **maintenance block/release** |
| `booking` | quotes, create/modify/cancel, holds, status machine (`PENDING → CONFIRMED → CHECKED_IN → CHECKED_OUT / CANCELLED`) |
| `payment` | gateways (Chapa/Telebirr/CBE/PayPal/card/cash/mock), OTP, webhooks, sandbox admin endpoints |
| `trip` | trips + itinerary items (this powers `/discover` → "Add to my trip") |
| `discover` | verified places, destinations, nearby (haversine), heritage, emergency contacts, sources/licensing |
| `ai` | `/ai/chat`, `/ai/voice`, conversation CRUD, RAG service, per-role tools (customer/staff/manager/admin) |
| `notification` | push (Expo), in-app notifications, preferences |
| `email` | templated transactional mail |
| `review` | guest reviews + moderation |
| `favorite` | wishlist |
| `coupon` | discounts |
| `contact` | support threads/messages |
| `dispute` | guest vs hotel disputes |
| `admin` | users, staff, hotels, imports/exports (Excel/CSV) |
| `admin-reporting` | manager reports — **PDF (pdfkit) + Excel (exceljs)** exporters |
| `feature-flags` | runtime flags |
| `fraud` | fraud signals |
| `invoice`, `events`, `jobs` | billing docs, event listeners, queue processors |
| `common/` | guards (JWT, roles), filters (HTTP exception + spec), cache service, storage, security helpers |

**Roles** (`enum Role`): `CUSTOMER · STAFF · MANAGER · ADMIN`, enforced by `@Roles()` decorators + guards.

**Prisma data model** — 46 models, grouped: identity (`User`, `UserSession`), catalog (`Country`, `City`, `Hotel`, `Room`, `RoomAvailability`, `SeasonalPricing`, `HotelPolicy`), booking (`Booking`, `BookingDetail`, `BookingModification`, `RoomHold`, `RoomRelocation`, `StayRequest`), money (`Payment`, `PaymentEvent`, `PaymentAttempt`, `Coupon`), engagement (`Review`, `Favorite`, `Notification`), governance (`Dispute`, `SuspensionRequest`, `AuditLog`, `PlatformSetting`), support (`ContactThread`, `ContactMessage`), AI (`AiConversation`, `AiMessage`, `AiKnowledgeDocument`, `AiAuditLog`), discovery (`Source`, `Place`, `EmergencyContact`), travel (`Trip`, `TripItem`).

---

## 5. Data flow (one request, end to end)

```
Browser /app/discover
   └─ services.ts  discoverApi.nearby({lat,lng,radiusKm})
        └─ api.ts  fetch(API_BASE_URL + path)  ← .env.local: NEXT_PUBLIC_API_URL=http://localhost:3001
             └─ NestJS: Throttler → JwtAuth/OptionalAuth → RolesGuard → Zod DTO pipe → Service
                  └─ Prisma → PostgreSQL        (BullMQ jobs go to Redis)
     response → cached in localStorage (lib/offline-cache.ts) → UI state → render
```

- Every `discover` endpoint is `@Public()`.
- Failures fall back to the cached snapshot and show a "showing saved data from {age}" banner.
- Auth tokens live in `localStorage` under `luxstay.session` / `yayetech.session`; `api.ts` auto-refreshes on 401.

---

## 6. Backend API surface

- ~**225 routes** across **34 controllers**, Swagger at `http://localhost:3001/docs`.
- `GET /health` used by Render health checks.
- Public: auth, catalog browsing, `discover/*`, search.
- Role-guarded: bookings, payments, `/admin/*`, `/manager/*`, `/staff/*`, AI (rate-limited per user).

---

## 7. Web app (`apps/web`) — routes

| Route | Purpose |
|---|---|
| `/` | landing + hero search |
| `/search` | hotel search results |
| `/hotel/[id]`, `/booking/[hotelId]` | details + booking flow |
| `/auth`, `/auth/verify-email`, `/auth/reset-password` | auth, email verification, reset |
| `/dashboard` | guest dashboard |
| `/favorites` | wishlist |
| `/discover`, `/discover/[placeId]` | city guide + place detail (see §8) |
| `/trips`, `/trips/[tripId]` | trips & itinerary |
| `/emergency` | emergency hub (safety directory) |
| `/payment-history` | past payments |
| `/admin` | admin portal (users, hotels, approvals, coupons, reports) |
| `/manager` | manager portal (analytics, rooms, pricing, staff, maintenance) |
| `/staff` | staff portal |

Cross-cutting: `NavBar`, `NavigationProgressBar`, `AIChat` (global floating assistant), `HeroSearchBar`, i18n (en/am), offline cache, TanStack Query with `CACHE_POLICIES`.

Dev server: `pnpm --filter web dev` → `next dev --turbo --port 4000 --hostname 0.0.0.0`.

---

## 8. The Discover feature (flagship, newest)

`apps/web/src/app/discover/page.tsx` (1055 lines) + `apps/api/src/modules/discover/`.

- **Destination selector** — 6 cities with hotel/place counts (`GET /discover/destinations`).
- **Tabs** — All / Heritage / Dining / Attractions / Emergency.
- **Neighborhood + radius filters** — 7 hardcoded Addis Ababa districts, 1/10/15 km radius.
- **List ⇄ Map** — map is CSS-projected lat/lng (no map library), `projectPlace()`.
- **Add to itinerary** — auth-gated modal → `POST /trips/:tripId/items`.
- **Provenance** — every place card shows source, license, verifier, last-checked; "© OSM (ODbL)".
- **Governance section** — licensing policy + source record counts.
- API: `nearby` (bounding box + haversine filter), `heritage`, `search`, `emergency`, `sources`, `places/:id`; `POST /places` is ADMIN/MANAGER only.
- Data today: **7 places (all Addis Ababa), 2 emergency contacts, 3 sources, 6 destinations** — other 5 destinations have 0 places.

---

## 9. Mobile app (`apps/mobile`)

40+ screens: onboarding, auth (+MFA, forgot/reset), search, hotel/room detail, full booking flow, Chapa checkout, Telebirr OTP, mock bank auth, booking history/modify/detail, favorites, reviews, notifications, payment history, disputes, contact threads, **Discover + place details**, **Trips**, **AI chat**, settings/security, plus `admin/` and `manager/` screen folders.

Offline-ready: local caching, `expo-secure-store`, Google sign-in (`src/lib/oauth.ts`).
Tests: `src/__tests__` (16 files — oauth, schemas, DiscoverScreen, etc.) via `pnpm --filter mobile test`.

---

## 10. Shared types

`packages/shared-types/src/*` — Zod schemas + inferred types consumed by api, web and mobile:
`admin, ai, booking, catalog, contact, coupon, discover, email, index, notification, review, staff`.
`dist/` is **committed on purpose** (`.gitignore` has `!packages/shared-types/dist`) so consumers don't need a build step.

---

## 11. Environment variables

Local: `apps/web/.env.local` (gitignored) and `apps/api/.env` (gitignored). Templates: root `.env.example`, `apps/api/.env.example`.

Key groups (see `apps/api/.env.example`):

- **DB/queue**: `DATABASE_URL`, `REDIS_URL`
- **Auth**: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_TTL=15m`, `JWT_REFRESH_TTL=7d`, `GOOGLE_CLIENT_ID(S)`, `MFA_ENCRYPTION_KEY`
- **Payments**: `PAYMENT_PROVIDER=mock|chapa`, `CHAPA_PUBLIC_KEY/SECRET_KEY/ENCRYPTION_KEY/WEBHOOK_SECRET`, `MOCK_PAYMENT_WEBHOOK_SECRET`
- **Email/Cloudinary**: `EMAIL_*`, `CLOUDINARY_*`
- **AI**: `AI_PROVIDER=mock|gemini`, `AI_PROVIDER_FALLBACK`, `GEMINI_API_KEY`, `AI_MODEL` limits, rate limits
- **Web**: `NEXT_PUBLIC_API_URL=http://localhost:3001`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `WEB_APP_URL=http://localhost:4000`

---

## 12. Commands

```bash
pnpm install                      # all workspaces

pnpm dev                          # turbo: api + web (+ docs) concurrently
pnpm --filter api dev             # Nest watch on :3001
pnpm --filter web dev             # Next dev (Turbopack) on :4000
pnpm --filter mobile start        # Expo

pnpm build                        # turbo build (prisma generate + nest build, next build)
pnpm lint                         # turbo lint
pnpm check-types                  # turbo check-types (tsc --noEmit everywhere)
pnpm test                         # turbo test (jest)

pnpm --filter api db:seed         # prisma db seed
pnpm export:postman               # regenerate postman_collection.json
pnpm smoke-test                   # scripts/smoke-test.ts against a running API
```

Infra: `docker compose up -d` → Postgres on **5433**, Redis on **6379** (note: local `.env` may point at 5432/system Postgres).

---

## 13. Testing

- **API**: 35 `*.spec.ts` (unit, jest) + `test/*.e2e-spec.ts` (`pnpm --filter api test:e2e`).
- **Mobile**: 16 test files (`pnpm --filter mobile test`).
- **Web**: no test suite; `next lint` + `tsc --noEmit` only.
- `scripts/smoke-test.ts` + `scripts/test-e2e-flow.ts` for running-system checks.

---

## 14. Deployment

`render.yaml` → Render free tier:
build `pnpm install && prisma generate && nest build` → start `node apps/api/dist/src/main.js`, health check `/health`, generated JWT/webhook secrets.

Mobile: EAS (`app.json` in `apps/mobile`, `owner: kibruyisfa`).

---

## 15. Known issues / current state

1. **API lint fails** — ~764 ESLint errors, mostly pre-existing (`no-unsafe-*`, unused vars) in `modules/trip`, `modules/ai`, `test/*.e2e-spec.ts`. Web lint passes (warnings only).
2. **Redis not running locally** — BullMQ processors (booking expiry, reminders) won't execute until `docker compose up -d redis`.
3. **Git-LFS gotcha** — `apps/web/src/app/favicon.ico` was once pushed as an LFS *pointer* and 500'd every page on machines without git-lfs; restored to a real binary in commit `20924db`. `.gitattributes` still declares the `lfs` filter but git-lfs is **not installed** here.
4. **Stray root `app.json`** — partial duplicate of `apps/mobile/app.json` with a *different* EAS project ID; deliberately left untracked.
5. **`apps/docs` dev script uses port 3001** — collides with the API if both run.
6. **Data skew** — all 7 discover places are in Addis Ababa; the other 5 destinations show the empty state.
7. **Two stashes** exist (`stash@{0}`, `stash@{1}`) from earlier WIP — untouched.

---

## 16. Git

- Remote: `https://github.com/777Nebyu/hotel_system`, branch `main`.
- Latest pushed state: `20924db fix(web): restore real favicon binary instead of git-lfs pointer` (local == `origin/main`).
- Recent history: local feature work (AI, discover, trips, MFA, payments) merged with 4 remote commits (room maintenance release, booking/admin/search/nav-progress updates).
