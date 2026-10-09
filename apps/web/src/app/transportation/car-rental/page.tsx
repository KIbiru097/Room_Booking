"use client"

// Filters
/* Header */ /* Search bar */ /* ── Sidebar filters ── */ /* ── Results grid ── */ /* Toolbar */ /* Image */ /* Body */ /* Specs */ /* Price */

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowRight,
  Car,
  Filter,
  Gauge,
  Luggage,
  ShieldCheck,
  SlidersHorizontal,
  User,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { useLanguage } from "@/lib/i18n"
import { transportationApi } from "@/lib/services"

type Service = Awaited<ReturnType<typeof transportationApi.services>>["items"][number]

const VEHICLE_TYPE_OPTS = ["", "SEDAN", "SUV", "MINIVAN", "MINIBUS", "BUS"]
const SORT_OPTS = [
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "pax_desc", label: "Most Passengers" },
]

function diffDays(start: string, end: string) {
  if (!start || !end) return 1
  const diff =
    new Date(end).getTime() -
    new Date(start).getTime()
  return Math.max(
    1,
    Math.ceil(
      diff /
        86_400_000,
    ),
  )
}

export default function CarRentalPage() {
  const { t } = useLanguage()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pickupLocation, setPickupLocation] = useState("")
  const [pickupDate, setPickupDate] = useState("")
  const [returnDate, setReturnDate] = useState("")
  const [withDriver, setWithDriver] = useState<boolean | null>(null)
  const [vehicleType, setVehicleType] = useState("")
  const [maxPrice, setMaxPrice] = useState("")
  const [minPax, setMinPax] = useState("")
  const [sort, setSort] = useState("price_asc")
  const [filtersOpen, setFiltersOpen] = useState(false)

  const days = diffDays(pickupDate, returnDate)

  useEffect(() => {
    setLoading(true)
    transportationApi
      .services({
        serviceType: "CAR_RENTAL",
        passengers: minPax ? Number(minPax) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        limit: 50,
      })
      .then((r) => setServices(r.items))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [minPax, maxPrice])

  const filtered = useMemo(() => {
    let list = [...services]
    if (vehicleType)
      list = list.filter(
        (s) =>
          s.name.toUpperCase().includes(vehicleType) ||
          s.description?.toUpperCase().includes(vehicleType),
      )
    if (sort === "price_asc")
      list.sort(
        (a, b) =>
          Number(a.dailyRate ?? a.fixedPrice) -
          Number(b.dailyRate ?? b.fixedPrice),
      )
    if (sort === "price_desc")
      list.sort(
        (a, b) =>
          Number(b.dailyRate ?? b.fixedPrice) -
          Number(a.dailyRate ?? a.fixedPrice),
      )
    if (sort === "pax_desc")
      list.sort((a, b) => b.passengerLimit - a.passengerLimit)
    return list
  }, [services, vehicleType, sort])

  return (
    <div className="min-h-screen bg-[#f3efe5] dark:bg-[#07111f]">
      {}
      <section className="bg-[#0b1528] px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <Link
            href="/transportation"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Transportation
          </Link>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#e4bd55]">
            Car Rental
          </p>
          <h1 className="mt-2 font-serif text-4xl sm:text-5xl font-bold text-white">
            Your Car. Your Journey. Your Way.
          </h1>
          <p className="mt-3 max-w-2xl text-white/75">
            Choose from verified vehicles across Ethiopia. Transparent pricing,
            no hidden fees.
          </p>

          {}
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            <input
              value={pickupLocation}
              onChange={(e) => setPickupLocation(e.target.value)}
              placeholder="Pickup location"
              className="h-11 rounded-xl border border-white/20 bg-white/10 px-3 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[#e4bd55] lg:col-span-2"
            />
            <input
              type="date"
              value={pickupDate}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setPickupDate(e.target.value)}
              className="h-11 rounded-xl border border-white/20 bg-white/10 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#e4bd55]"
            />
            <input
              type="date"
              value={returnDate}
              min={pickupDate || new Date().toISOString().slice(0, 10)}
              onChange={(e) => setReturnDate(e.target.value)}
              className="h-11 rounded-xl border border-white/20 bg-white/10 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#e4bd55]"
            />
            <Button variant="gold" className="h-11">
              Search Cars
            </Button>
          </div>
          {days > 1 && (
            <p className="mt-3 text-sm text-[#e4bd55]">
              Showing prices for {days} day{days > 1 ? "s" : ""}
            </p>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          {}
          <aside className="w-full lg:w-64 shrink-0">
            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between mb-4">
                <p className="flex items-center gap-2 text-sm font-bold text-[#0b1528] dark:text-white">
                  <Filter className="h-4 w-4 text-[#e4bd55]" /> Filters
                </p>
                <button
                  onClick={() => {
                    setVehicleType("")
                    setMaxPrice("")
                    setMinPax("")
                    setWithDriver(null)
                  }}
                  className="text-xs text-slate-400 hover:text-[#0b1528] transition-colors"
                >
                  Clear all
                </button>
              </div>

              <FilterSection title="Vehicle type">
                {VEHICLE_TYPE_OPTS.filter(Boolean).map((vt) => (
                  <label
                    key={vt}
                    className="flex cursor-pointer items-center gap-2 py-1 text-sm text-slate-600 dark:text-slate-300"
                  >
                    <input
                      type="radio"
                      name="vehicleType"
                      value={vt}
                      checked={vehicleType === vt}
                      onChange={() => setVehicleType(vt)}
                      className="accent-[#e4bd55]"
                    />
                    {vt.charAt(0) + vt.slice(1).toLowerCase()}
                  </label>
                ))}
              </FilterSection>

              <FilterSection title="Max price (ETB/day)">
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="e.g. 3000"
                  className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#e4bd55] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </FilterSection>

              <FilterSection title="Min passengers">
                <input
                  type="number"
                  min={1}
                  value={minPax}
                  onChange={(e) => setMinPax(e.target.value)}
                  placeholder="e.g. 4"
                  className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#e4bd55] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </FilterSection>

              <FilterSection title="Driver">
                {[
                  { val: null, label: "All options" },
                  { val: true, label: "With driver" },
                  { val: false, label: "Self-drive" },
                ].map((opt) => (
                  <label
                    key={String(opt.val)}
                    className="flex cursor-pointer items-center gap-2 py-1 text-sm text-slate-600 dark:text-slate-300"
                  >
                    <input
                      type="radio"
                      name="driver"
                      checked={withDriver === opt.val}
                      onChange={() => setWithDriver(opt.val)}
                      className="accent-[#e4bd55]"
                    />
                    {opt.label}
                  </label>
                ))}
              </FilterSection>
            </div>
          </aside>

          {}
          <div className="flex-1">
            {}
            <div className="mb-5 flex items-center justify-between">
              <p className="text-sm text-slate-500">
                <span className="font-semibold text-[#0b1528] dark:text-white">
                  {filtered.length}
                </span>{" "}
                vehicles available
              </p>
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-slate-400" />
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#e4bd55] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                >
                  {SORT_OPTS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {loading && (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="h-72 animate-pulse rounded-3xl bg-slate-200 dark:bg-slate-800"
                  />
                ))}
              </div>
            )}

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
                {error}
              </div>
            )}

            {!loading && !error && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-3xl bg-white py-20 text-center shadow-sm dark:bg-slate-900">
                <Car className="mb-3 h-12 w-12 text-slate-300" />
                <p className="font-semibold text-slate-600 dark:text-slate-300">
                  No vehicles found
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  Try adjusting your filters
                </p>
              </div>
            )}

            {!loading && !error && (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((svc) => {
                  const dailyRate = Number(svc.dailyRate ?? svc.fixedPrice)
                  const totalForDays = dailyRate * days
                  return (
                    <Link
                      key={svc.id}
                      href={`/transportation/car-rental/${svc.id}`}
                      className="group flex flex-col rounded-3xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#e4bd55]/60 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden"
                    >
                      {}
                      <div className="relative h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                        <Image
                          src="https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&h=340&fit=crop&auto=format&q=70"
                          alt={svc.name}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="400px"
                        />
                        <div className="absolute top-3 left-3">
                          <Badge variant="success" size="sm">
                            <ShieldCheck className="mr-1 h-2.5 w-2.5" />{" "}
                            Verified
                          </Badge>
                        </div>
                      </div>

                      {}
                      <div className="flex flex-1 flex-col p-5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#e4bd55]">
                          {svc.provider.businessName}
                        </p>
                        <h3 className="mt-0.5 font-serif text-lg font-semibold text-[#0b1528] dark:text-white">
                          {svc.name}
                        </h3>

                        {}
                        <div className="mt-3 flex flex-wrap gap-2">
                          <SpecPill
                            icon={<User className="h-3 w-3" />}
                            label={`${svc.passengerLimit} seats`}
                          />
                          {svc.luggageLimit != null && (
                            <SpecPill
                              icon={<Luggage className="h-3 w-3" />}
                              label={`${svc.luggageLimit} bags`}
                            />
                          )}
                          {svc.mileagePolicyKm != null && (
                            <SpecPill
                              icon={<Gauge className="h-3 w-3" />}
                              label={`${svc.mileagePolicyKm} km/day`}
                            />
                          )}
                        </div>

                        {}
                        <div className="mt-auto flex items-end justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                          <div>
                            <p className="text-xs text-slate-500">
                              {days > 1 ? `${days} days total` : "per day"}
                            </p>
                            <p className="font-serif text-xl font-bold text-[#0b1528] dark:text-white">
                              ETB{" "}
                              {(days > 1
                                ? totalForDays
                                : dailyRate
                              ).toLocaleString()}
                            </p>
                            {days > 1 && (
                              <p className="text-[10px] text-slate-400">
                                ETB {dailyRate.toLocaleString()} /day
                              </p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="gold"
                            rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function FilterSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="mb-4 border-t border-slate-100 pt-4 dark:border-slate-800">
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
        {title}
      </p>
      {children}
    </div>
  )
}

function SpecPill({ icon, label }: { icon: React.ReactNode ;label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
      {icon}
      {label}
    </span>
  )
}
