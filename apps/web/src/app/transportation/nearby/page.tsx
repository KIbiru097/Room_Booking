"use client" /* Header */ /* ── LEFT: Map ── */ /* Nearby live services */ /* ── RIGHT: Category cards ── */

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowRight,
  Bus,
  Car,
  MapPin,
  Navigation,
  Plane,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { useLanguage } from "@/lib/i18n"
import { transportationApi } from "@/lib/services"

type Service = Awaited<ReturnType<typeof transportationApi.services>>["items"][number]

const TransportRouteMap = dynamic(() => import("../TransportRouteMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[500px] w-full items-center justify-center rounded-3xl bg-slate-100 text-sm text-slate-500 dark:bg-slate-800">
      Loading map…
    </div>
  ),
})

const NEARBY_MOCK = [
  {
    icon: Car,
    type: "Ride",
    distance: "1.2 km",
    status: "Available",
    from: "ETB 250",
    slug: "ride",
    color: "bg-[#0b1528]/8",
    iconColor: "text-[#0b1528]",
  },
  {
    icon: Plane,
    type: "Airport Transfer",
    distance: "3.5 km",
    status: "Available",
    from: "ETB 700",
    slug: "airport-pickup",
    color: "bg-blue-50",
    iconColor: "text-blue-700",
  },
  {
    icon: User,
    type: "Private Driver",
    distance: "2.1 km",
    status: "Available today",
    from: "ETB 1,200",
    slug: "private-driver",
    color: "bg-[#FEF9E7]",
    iconColor: "text-[#e4bd55]",
  },
  {
    icon: Car,
    type: "Car Rental",
    distance: "4.0 km",
    status: "Available",
    from: "ETB 1,500/day",
    slug: "car-rental",
    color: "bg-emerald-50",
    iconColor: "text-emerald-700",
  },
  {
    icon: Bus,
    type: "Intercity",
    distance: "8.2 km",
    status: "Departs 07:00",
    from: "ETB 450",
    slug: "intercity",
    color: "bg-amber-50",
    iconColor: "text-amber-700",
  },
]

export default function NearbyTransportationPage() {
  const { t } = useLanguage()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [hotelName] = useState("Sheraton Addis")

  useEffect(() => {
    transportationApi
      .services({ limit: 10 })
      .then((r) => setServices(r.items))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-[#f3efe5] dark:bg-[#07111f]">
      {}
      <div className="bg-[#0b1528] px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <Link
            href="/transportation"
            className="mb-3 inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Transportation
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#e4bd55]">
                Nearby
              </p>
              <h1 className="mt-1 font-serif text-3xl font-bold text-white">
                Nearby Transportation
              </h1>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-white/70">
                <Navigation className="h-3.5 w-3.5 text-[#e4bd55]" />
                Transportation near your hotel · {hotelName}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          {}
          <div className="space-y-4">
            <TransportRouteMap />

            {}
            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-widest text-[#e4bd55]">
                Available now · near {hotelName}
              </p>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="h-20 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800"
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {services.slice(0, 5).map((svc) => (
                    <Link
                      key={svc.id}
                      href={`/transportation/${
                        svc.serviceType === "CAR_RENTAL"
                          ? "car-rental"
                          : svc.serviceType === "PRIVATE_DRIVER"
                            ? "private-driver"
                            : "ride"
                      }`}
                      className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all hover:border-[#e4bd55]/50 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0b1528]/8 dark:bg-white/5">
                          <Car className="h-5 w-5 text-[#0b1528] dark:text-[#e4bd55]" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-[#0b1528] dark:text-white">
                            {svc.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {svc.provider.businessName} ·{" "}
                            {svc.provider.city?.name ?? "Addis Ababa"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-bold text-sm text-[#0b1528] dark:text-white">
                            ETB {Number(svc.fixedPrice).toLocaleString()}
                          </p>
                          <Badge variant="success" size="sm">
                            Available
                          </Badge>
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-300" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {}
          <div className="space-y-3 lg:sticky lg:top-24 lg:h-fit">
            <p className="text-xs font-bold uppercase tracking-widest text-[#e4bd55]">
              Service categories
            </p>
            {NEARBY_MOCK.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.slug}
                  href={`/transportation/${item.slug}`}
                  className="group flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#e4bd55]/50 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.color}`}
                    >
                      <Icon className={`h-5 w-5 ${item.iconColor}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-[#0b1528] dark:text-white">
                        {item.type}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                        <MapPin className="h-3 w-3" />
                        {item.distance}
                        <span className="text-emerald-600">{item.status}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">from</p>
                    <p className="font-bold text-sm text-[#0b1528] dark:text-white">
                      {item.from}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
