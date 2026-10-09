# YayeTech Hotel System — Platform Parity Audit
> Last updated: 2026-10-03 · Monorepo @ `hotel_system/`

---

## 1. At a Glance

| Metric | Mobile (Expo 54 / RN 0.81) | Web (Next.js 15.1 / React 19) | API (NestJS) |
|---|---|---|---|
| **Source files** | 64 screens + 65 routes, ~38 k LOC | 19 pages, ~31 k LOC | ~134 k LOC |
| **UI system** | StyleSheet + theme tokens | Tailwind v4 + tokens | — |
| **State** | Redux Toolkit + React Query | Zustand + React Query + react-hook-form | — |
| **HTTP** | 1 fetch client (20 s timeout, single-flight refresh) | 2 parallel clients (fetch + axios) | — |
| **i18n (EN keys)** | 1,256 | 2,206 | — |
| **i18n (AM keys)** | 1,256 (full parity) | 2,206 (full parity) | — |
| **Tests** | 16 files / ~138 cases | **0** | 1 controller spec |

---

## 2. Shared Core (both platforms ✅)

- Auth: email / Google / MFA
- Search (hotels, rooms)
- Hotel detail + room detail
- Booking wizard (create, detail, modify)
- Payments incl. mock Chapa/Telebirr stack
- Favorites
- Profile / account security
- Manager back-office
- Admin back-office
- Staff back-office
- Dark mode
- AI chat with voice (via `/ai/chat` + `/ai/voice` gateway — rules AI-001 → AI-008)

---

## 3. Mobile-Only Features

| Feature | Screen(s) |
|---|---|
| Push notifications | `NotificationsScreen.tsx` |
| Support thread inbox | `ContactInboxScreen.tsx`, `ContactThreadDetailScreen.tsx`, `ContactNewScreen.tsx` |
| Biometrics | `AccountSecurityScreen.tsx` (`expo-local-authentication`) |
| Offline banner + NetInfo | `HomeScreen.tsx` (`@react-native-community/netinfo`) |
| Deep links | `apps/mobile/src/navigation/` |
| Trips (read-only) | `TripsScreen.tsx` |
| Dispute flow | `DisputeScreen.tsx`, `DisputeDetailScreen.tsx` |
| Maps | `HotelDetailScreen.tsx` (Google Maps link-out) |
| Onboarding / Splash | `OnboardingScreen.tsx`, `SplashScreen.tsx` |

---

## 4. Web-Only Features

| Feature | Route |
|---|---|
| Interactive map | `/discover` |
| Full heritage city guide | `/discover/heritage/[cityId]` |
| Trip create / edit + AI day builder | `/trips`, `/trips/[tripId]` |
| Persistent discover / place favorites | `/discover/[placeId]` (partial) |
| PWA / Service Worker | `apps/web/public/sw.js` |
| SEO metadata | `generateMetadata` — confirmed on `/discover` |
| Wider Amharic coverage | 2,206 keys vs 1,256 on mobile |

---

## 5. Shared Gaps (neither platform)

| Gap | Risk | Affected locations |
|---|---|---|
| **Mock payment stack ships in production code** | 🔴 High | `apps/web/src/services/payment.service.ts`, `apps/web/src/hooks/use-payment.ts`, `apps/web/src/app/booking/[hotelId]/page.tsx`; mobile: booking + checkout screens |
| **Hardcoded remote image fallbacks** | 🟡 Medium | Mobile screens + non-discover web pages |
| **No RTL layout support** | 🟡 Medium | Neither `I18nManager` (mobile) nor `dir="rtl"` (web) found |
| **No in-room services module** | 🟡 Medium | No API module, no screens on either platform |
| **Web: zero test coverage** | 🔴 High | `apps/web/src/**` — no test runner configured |
| **Near-zero SSR on web** | 🟡 Medium | Only `/discover` confirmed with `generateMetadata`; no `cache()` usage found |

---

## 6. Platform Divergence Details

### 6a. State Management

```
Mobile                          Web
──────────────────────          ──────────────────────────────
Redux Toolkit (global)          Zustand (global, lighter)
  └─ authSlice                    └─ auth store
  └─ bookingSlice                 └─ booking store
React Query (server state)      React Query (server state)
                                react-hook-form (form state)
```

> Both platforms share `@repo/shared-types` for DTO types, keeping API contracts consistent even though the state libraries differ.

### 6b. HTTP Clients

```
Mobile                          Web
──────────────────────          ──────────────────────────────
1 × fetch wrapper               fetch wrapper  (token auth)
  • 20 s timeout                axios client   (payments / file uploads)
  • single-flight token
    refresh (race-safe)         ⚠ No deduped token refresh documented
```

> **Risk:** Web has two parallel clients with no evidence of a single-flight refresh guard. Concurrent 401s could trigger multiple refresh calls and a token race condition.

### 6c. i18n

```
Mobile                          Web
──────────────────────          ──────────────────────────────
Library: i18next                Hand-rolled context provider
Structure: flat en.json /       Namespaced: locales/en/*.json
           am.json                           locales/am/*.json
Keys: 1,256 per language        Keys: 2,206 per language
Back-office: hardcoded EN       Back-office: fully translated
```

> Mobile back-office screens (`screens/admin/`, `screens/manager/`) are hardcoded English. The AM translations exist on the web side and should be ported.

### 6d. Test Coverage

```
Mobile                          Web
──────────────────────          ──────────────────────────────
16 test files (~138 cases)      0 test files
jest + @testing-library/RN      (no test runner configured)
Covers: auth, API client,
  Redux store, screens,         —
  components, offline logic
```

---

## 7. Feature Parity Roadmap (Suggested Priority)

```
Priority  Item
────────  ──────────────────────────────────────────────────────────────────
🔴  1.   Strip mock payment stack from shipping code (both platforms)
🔴  2.   Add web test suite — Vitest (unit/hooks) + Playwright (e2e)
🟡  3.   Expand SSR: generateMetadata to /hotel/[id], /booking, /dashboard
🟡  4.   Add single-flight token refresh guard to web fetch client
🟡  5.   Web: notification UI (in-app toasts + notification center)
🟡  6.   Web: support thread inbox (port 3-screen mobile flow)
🟢  7.   Mobile: trip create/edit + AI day builder parity
🟢  8.   Mobile: migrate back-office hardcoded EN → i18next AM keys
⚪  9.   Both: in-room services module (API + screens)
⚪  10.  Both: RTL layout pass (mobile I18nManager + web dir="rtl")
```

---

## 8. Quick Reference — Key File Paths

| Area | Mobile | Web |
|---|---|---|
| Auth | `apps/mobile/src/screens/AuthScreen.tsx` | `apps/web/src/app/auth/page.tsx` |
| Booking wizard | `apps/mobile/src/screens/BookingFlowScreen.tsx` | `apps/web/src/app/booking/[hotelId]/page.tsx` |
| Trips | `apps/mobile/src/screens/TripsScreen.tsx` | `apps/web/src/app/trips/page.tsx` |
| Discover | `apps/mobile/src/screens/DiscoverScreen.tsx` | `apps/web/src/app/discover/page.tsx` |
| AI Chat | `apps/mobile/src/screens/AIChatScreen.tsx` | embedded in dashboard |
| Payment service | `apps/mobile/src/api.ts` | `apps/web/src/services/payment.service.ts` |
| i18n (EN) | `apps/mobile/src/locales/en.json` | `apps/web/src/locales/en/` |
| i18n (AM) | `apps/mobile/src/locales/am.json` | `apps/web/src/locales/am/` |
| Tests | `apps/mobile/src/__tests__/` | — |
| State | `apps/mobile/src/store/` | `apps/web/src/lib/` + `apps/web/src/hooks/` |
| Navigation | `apps/mobile/src/navigation/` | Next.js app router (`apps/web/src/app/`) |
| API modules | — | `apps/api/src/modules/` (20+ domains) |
