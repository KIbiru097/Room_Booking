"use client"

// ─── Service definitions ──────────────────────────────────────────────────────

// ─── Page ─────────────────────────────────────────────────────────────────────
/* ══════════════════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════════════════ */ /* Background photograph */ /* Dark sapphire gradient overlay */ /* Eyebrow */ /* Heading */ /* CTAs */ /* Trust bar */ /* ══════════════════════════════════════════════════════════════════════
          FLOATING SEARCH PANEL
      ══════════════════════════════════════════════════════════════════════ */ /* Service type */ /* Pickup */ /* Date */ /* Search btn */ /* ══════════════════════════════════════════════════════════════════════
          STATS STRIP
      ══════════════════════════════════════════════════════════════════════ */ /* ══════════════════════════════════════════════════════════════════════
          7 SERVICE CARDS
      ══════════════════════════════════════════════════════════════════════ */ /* Icon badge */ /* Content */ /* CTA row */ /* ══════════════════════════════════════════════════════════════════════
          WHY YAYETECH TRANSPORTATION
      ══════════════════════════════════════════════════════════════════════ */ /* ══════════════════════════════════════════════════════════════════════
          CONNECTED JOURNEY SECTION
      ══════════════════════════════════════════════════════════════════════ */ /* Left: copy */ /* Journey steps */ /* Right: visual */

import Link from "next/link"
import Image from "next/image"
import {
  ArrowRight,
  Briefcase,
  Bus,
  Car,
  CheckCircle2,
  Clock3,
  Compass,
  MapPin,
  Plane,
  ShieldCheck,
  Star,
  User,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import { useLanguage } from "@/lib/i18n"
import { useAuth } from "@/lib/auth-store"

const SERVICES = [
  {
    icon: Car,
    slug: "ride",
    titleKey: "svcRideTitle",
    descKey: "svcRideDesc",
    ctaKey: "svcRideCta",
    accent: "#0b1528",
  },
  {
    icon: Plane,
    slug: "airport-pickup",
    titleKey: "svcAirportTitle",
    descKey: "svcAirportDesc",
    ctaKey: "svcAirportCta",
    accent: "#1E3A8A",
  },
  {
    icon: User,
    slug: "private-driver",
    titleKey: "svcDriverTitle",
    descKey: "svcDriverDesc",
    ctaKey: "svcDriverCta",
    accent: "#0b1528",
  },
  {
    icon: Car,
    slug: "car-rental",
    titleKey: "svcRentalTitle",
    descKey: "svcRentalDesc",
    ctaKey: "svcRentalCta",
    accent: "#1E3A8A",
  },
  {
    icon: Bus,
    slug: "intercity",
    titleKey: "svcIntercityTitle",
    descKey: "svcIntercityDesc",
    ctaKey: "svcIntercityCta",
    accent: "#0b1528",
  },
  {
    icon: MapPin,
    slug: "nearby",
    titleKey: "svcNearbyTitle",
    descKey: "svcNearbyDesc",
    ctaKey: "svcNearbyCta",
    accent: "#1E3A8A",
  },
  {
    icon: Briefcase,
    slug: "my-bookings",
    titleKey: "svcMyTitle",
    descKey: "svcMyDesc",
    ctaKey: "svcMyCta",
    accent: "#e4bd55",
  },
]

const TRUST_ITEMS = [
  { icon: ShieldCheck, key: "trustVerified" },
  { icon: Zap, key: "trustInstant" },
  { icon: Clock3, key: "trustSupport" },
  { icon: Star, key: "trustRated" },
]

const STATS = [
  { value: "500+", labelKey: "statPartners" },
  { value: "50K+", labelKey: "statRides" },
  { value: "4.9★", labelKey: "statRating" },
  { value: "24/7", labelKey: "statSupport" },
]

export default function TransportationHubPage() {
  const { t } = useLanguage()
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-[#f3efe5] dark:bg-[#07111f]">
      {}
      <section className="relative min-h-[600px] flex items-end overflow-hidden">
        {}
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1600&h=900&fit=crop&auto=format&q=80"
            alt="Premium vehicle on Ethiopian road"
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
          {}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b1528] via-[#0b1528]/70 to-[#0b1528]/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0b1528]/60 to-transparent" />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 pb-16 pt-32">
          <div className="max-w-2xl">
            {}
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-[#e4bd55]">
              {t("transportation", "badge")}
            </p>

            {}
            <h1 className="font-serif text-5xl sm:text-6xl font-bold text-white leading-tight tracking-tight">
              {t("transportation", "hubHeroTitle")}
            </h1>
            <p className="mt-5 text-lg text-white/80 leading-relaxed max-w-xl">
              {t("transportation", "hubHeroSubtitle")}
            </p>

            {}
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/transportation/ride">
                <Button
                  size="lg"
                  variant="gold"
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  {t("transportation", "hubCta1")}
                </Button>
              </Link>
              {user && (
                <Link href="/transportation/my-bookings">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/30 text-white bg-white/10 hover:bg-white/20"
                  >
                    {t("transportation", "hubCta2")}
                  </Button>
                </Link>
              )}
            </div>

            {}
            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2">
              {[
                t("transportation", "trustFree"),
                t("transportation", "trustFixed"),
                t("transportation", "trustVerifiedProviders"),
              ].map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-2 text-sm text-white/75"
                >
                  <CheckCircle2 className="h-4 w-4 text-[#e4bd55] shrink-0" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {}
      <section className="relative z-10 -mt-8 mx-auto max-w-5xl px-4 sm:px-6">
        <div className="glass-panel rounded-3xl p-6 shadow-xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-[#e4bd55]">
            {t("transportation", "quickBook")}
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-500">
                {t("transportation", "serviceType")}
              </label>
              <select className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-[#182333] focus:outline-none focus:ring-2 focus:ring-[#e4bd55] dark:border-slate-700 dark:bg-slate-900 dark:text-white">
                <option value="airport">
                  {t("transportation", "svcAirportTitle")}
                </option>
                <option value="ride">
                  {t("transportation", "svcRideTitle")}
                </option>
                <option value="rental">
                  {t("transportation", "svcRentalTitle")}
                </option>
                <option value="driver">
                  {t("transportation", "svcDriverTitle")}
                </option>
                <option value="intercity">
                  {t("transportation", "svcIntercityTitle")}
                </option>
              </select>
            </div>
            {}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-500">
                {t("transportation", "pickupLocation")}
              </label>
              <input
                type="text"
                placeholder={t("transportation", "pickupExample")}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-[#182333] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#e4bd55] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>
            {}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-500">
                {t("transportation", "pickupDate")}
              </label>
              <input
                type="date"
                min={new Date().toISOString().slice(0, 10)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-[#182333] focus:outline-none focus:ring-2 focus:ring-[#e4bd55] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>
            {}
            <div className="flex items-end">
              <Link href="/transportation/ride" className="w-full">
                <Button variant="gold" className="w-full" size="md">
                  {t("transportation", "findTransport")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 mt-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {STATS.map((s) => (
            <div
              key={s.labelKey}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <p className="font-serif text-3xl font-bold text-[#0b1528] dark:text-white">
                {s.value}
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                {t("transportation", s.labelKey)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
        <div className="mb-10 border-b border-slate-200 pb-4 dark:border-slate-800">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#e4bd55]">
            {t("transportation", "servicesEyebrow")}
          </p>
          <h2 className="mt-2 font-serif text-3xl font-semibold text-[#0b1528] dark:text-white">
            {t("transportation", "servicesTitle")}
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {SERVICES.map((svc) => {
            const Icon = svc.icon
            const isMyBookings = svc.slug === "my-bookings"
            return (
              <Link
                key={svc.slug}
                href={`/transportation/${svc.slug}`}
                className={`group relative flex flex-col rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#e4bd55]/60 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 ${
                  isMyBookings ? "sm:col-span-2 lg:col-span-1" : ""
                }`}
              >
                {}
                <div
                  className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl"
                  style={{
                    background:
                      svc.accent === "#e4bd55"
                        ? "rgba(212,175,55,0.12)"
                        : "rgba(15,41,66,0.08)",
                  }}
                >
                  <Icon
                    className="h-6 w-6"
                    style={{
                      color: svc.accent === "#e4bd55" ? "#e4bd55" : "#0b1528",
                    }}
                  />
                </div>

                {}
                <h3 className="font-serif text-lg font-semibold text-[#0b1528] dark:text-white">
                  {t("transportation", svc.titleKey)}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  {t("transportation", svc.descKey)}
                </p>

                {}
                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
                  <span className="text-sm font-semibold text-[#0b1528] group-hover:text-[#e4bd55] transition-colors dark:text-white">
                    {t("transportation", svc.ctaKey)}
                  </span>
                  <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-[#e4bd55]" />
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {}
      <section className="bg-[#0b1528] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#e4bd55]">
              {t("transportation", "whyEyebrow")}
            </p>
            <h2 className="mt-3 font-serif text-3xl font-semibold text-white">
              {t("transportation", "whyTitle")}
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST_ITEMS.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.key}
                  className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#e4bd55]/15">
                    <Icon className="h-5 w-5 text-[#e4bd55]" />
                  </div>
                  <h3 className="font-semibold text-white">
                    {t("transportation", item.key)}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-white/60">
                    {t("transportation", `${item.key}Desc`)}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-20">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="grid lg:grid-cols-2">
            {}
            <div className="flex flex-col justify-center p-10 lg:p-14">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#e4bd55]">
                {t("transportation", "journeyEyebrow")}
              </p>
              <h2 className="mt-3 font-serif text-3xl font-semibold text-[#0b1528] dark:text-white">
                {t("transportation", "journeyTitle")}
              </h2>
              <p className="mt-4 text-slate-500 leading-7 dark:text-slate-400">
                {t("transportation", "journeyDesc")}
              </p>

              {}
              <ol className="mt-8 space-y-4">
                {[
                  t("transportation", "journeyStep1"),
                  t("transportation", "journeyStep2"),
                  t("transportation", "journeyStep3"),
                  t("transportation", "journeyStep4"),
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e4bd55]/15 text-xs font-bold text-[#e4bd55]">
                      {i + 1}
                    </span>
                    <span className="pt-0.5 text-sm text-slate-600 dark:text-slate-300">
                      {step}
                    </span>
                  </li>
                ))}
              </ol>

              <div className="mt-8">
                <Link href="/transportation/ride">
                  <Button
                    variant="primary"
                    rightIcon={<ArrowRight className="h-4 w-4" />}
                  >
                    {t("transportation", "startJourney")}
                  </Button>
                </Link>
              </div>
            </div>

            {}
            <div className="relative min-h-[320px] lg:min-h-0">
              <Image
                src="https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=800&h=700&fit=crop&auto=format&q=80"
                alt="Ethiopian travel experience"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-transparent dark:from-slate-900" />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
