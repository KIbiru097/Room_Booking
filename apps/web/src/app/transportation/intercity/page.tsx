"use client" /* Hero */ /* Search panel */ /* Results */ /* Popular routes */

import { FormEvent, useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowRight,
  Bus,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Luggage,
  MapPin,
  ShieldCheck,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { toast } from "@/components/ui/Toast"
import { useAuth } from "@/lib/auth-store"
import { transportationApi } from "@/lib/services"
import { useRouter } from "next/navigation"

type Service = Awaited<ReturnType<typeof transportationApi.services>>["items"][number]

const ETHIOPIAN_CITIES = [
  "Addis Ababa",
  "Gondar",
  "Lalibela",
  "Bahir Dar",
  "Axum",
  "Harar",
  "Dire Dawa",
  "Hawassa",
  "Jimma",
  "Mekelle",
  "Adama (Nazret)",
  "Shashamane",
]

const POPULAR_ROUTES = [
  { from: "Addis Ababa", to: "Gondar", duration: "~10h", distance: "738 km" },
  { from: "Addis Ababa", to: "Bahir Dar", duration: "~8h", distance: "565 km" },
  { from: "Addis Ababa", to: "Hawassa", duration: "~3h", distance: "275 km" },
  { from: "Addis Ababa", to: "Lalibela", duration: "~12h", distance: "702 km" },
  { from: "Addis Ababa", to: "Harar", duration: "~9h", distance: "524 km" },
  { from: "Addis Ababa", to: "Axum", duration: "~13h", distance: "1,000 km" },
]

export default function IntercityPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const [from, setFrom] = useState("Addis Ababa")
  const [to, setTo] = useState("")
  const [date, setDate] = useState("")
  const [passengers, setPassengers] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)

  async function handleSearch(e: FormEvent) {
    e.preventDefault()
    if (!to.trim() || !date) {
      toast.error("Missing details", "Enter destination and date.")
      return
    }
    setLoading(true)
    setSearched(true)
    try {
      const r = await transportationApi.services({ limit: 20 })
      setServices(r.items)
    } catch (err) {
      toast.error(
        "Search failed",
        err instanceof Error ? err.message : "Try again.",
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleBook(svc: Service) {
    if (!user) {
      router.push("/auth?mode=login")
      return
    }
    setSubmitting(true)
    try {
      const result = await transportationApi.createBooking({
        serviceId: svc.id,
        pickupAt: new Date(`${date}T07:00`).toISOString(),
        pickupLocation: from,
        dropoffLocation: to,
        passengers,
      })
      toast.success("Trip booked!", `Ref: ${(result as any).bookingRef ?? "—"}`)
      router.push("/transportation/my-bookings")
    } catch (err) {
      toast.error(
        "Booking failed",
        err instanceof Error ? err.message : "Try again.",
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f3efe5] dark:bg-[#07111f]">
      {}
      <section className="relative h-[420px] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&h=700&fit=crop&auto=format&q=80"
            alt="Ethiopian road landscape"
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b1528] via-[#0b1528]/55 to-transparent" />
        </div>
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 pb-12">
          <Link
            href="/transportation"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Transportation
          </Link>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#e4bd55]">
            Intercity
          </p>
          <h1 className="mt-2 font-serif text-4xl sm:text-5xl font-bold text-white">
            Travel Beyond the City
          </h1>
          <p className="mt-3 max-w-lg text-white/75">
            Trusted intercity transportation between Ethiopian cities — comfort
            buses, private shuttles, and chartered vehicles.
          </p>
        </div>
      </section>

      {}
      <section className="relative z-10 -mt-8 mx-auto max-w-5xl px-4 sm:px-6">
        <form
          onSubmit={handleSearch}
          className="glass-panel rounded-3xl p-6 shadow-xl"
        >
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-[#e4bd55]">
            Find Transport
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className={labelCls}>From</label>
              <select
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className={inputCls}
              >
                {ETHIOPIAN_CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>To</label>
              <select
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className={inputCls}
              >
                <option value="">Select city</option>
                {ETHIOPIAN_CITIES.filter((c) => c !== from).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Date</label>
              <input
                type="date"
                required
                value={date}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setDate(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Passengers</label>
              <input
                type="number"
                min={1}
                max={50}
                value={passengers}
                onChange={(e) => setPassengers(Number(e.target.value))}
                className={inputCls}
              />
            </div>
            <div className="flex items-end">
              <Button
                type="submit"
                variant="gold"
                className="w-full h-11"
                loading={loading}
              >
                Find Transport
              </Button>
            </div>
          </div>
        </form>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 space-y-12">
        {}
        {searched && (
          <section>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#e4bd55]">
                  Results
                </p>
                <h2 className="font-serif text-2xl font-semibold text-[#0b1528] dark:text-white">
                  {from} → {to || "—"}
                </h2>
              </div>
              {date && (
                <p className="text-sm text-slate-500">
                  {new Date(date).toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              )}
            </div>

            {loading && (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-28 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800"
                  />
                ))}
              </div>
            )}

            {!loading && services.length === 0 && (
              <div className="flex flex-col items-center rounded-3xl bg-white py-16 text-center shadow-sm dark:bg-slate-900">
                <Bus className="mb-3 h-12 w-12 text-slate-300" />
                <p className="font-semibold text-slate-600">
                  No services found for this route
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  Try a different date or contact us for private charter
                  options.
                </p>
              </div>
            )}

            {!loading &&
              services.map((svc) => (
                <div
                  key={svc.id}
                  className="mb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-[#e4bd55]/40 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0b1528]/8">
                      <Bus className="h-6 w-6 text-[#0b1528] dark:text-[#e4bd55]" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#0b1528] dark:text-white">
                        {svc.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {svc.provider.businessName}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-2">
                        <Badge variant="success" size="sm">
                          <ShieldCheck className="mr-1 h-3 w-3" />
                          Verified
                        </Badge>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <User className="h-3 w-3" /> up to{" "}
                          {svc.passengerLimit} pax
                        </span>
                        {svc.durationMinutes && (
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Clock3 className="h-3 w-3" />~{svc.durationMinutes}{" "}
                            min
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 ml-auto">
                    <div className="text-right">
                      <p className="font-serif text-xl font-bold text-[#0b1528] dark:text-white">
                        ETB {Number(svc.fixedPrice).toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-500">per person</p>
                    </div>
                    <Button
                      variant="gold"
                      size="sm"
                      loading={submitting}
                      onClick={() => handleBook(svc)}
                    >
                      Select Trip
                    </Button>
                  </div>
                </div>
              ))}
          </section>
        )}

        {}
        <section>
          <div className="mb-6 border-b border-slate-200 pb-4 dark:border-slate-800">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#e4bd55]">
              Most travelled
            </p>
            <h2 className="mt-1 font-serif text-2xl font-semibold text-[#0b1528] dark:text-white">
              Popular Routes
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {POPULAR_ROUTES.map((route) => (
              <button
                key={`${route.from}-${route.to}`}
                onClick={() => {
                  setFrom(route.from)
                  setTo(route.to)
                }}
                className="group flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#e4bd55]/50 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#0b1528] dark:text-white">
                    <MapPin className="h-3.5 w-3.5 text-[#e4bd55]" />{" "}
                    {route.from}
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                    {route.to}
                  </div>
                  <div className="mt-1.5 flex gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock3 className="h-3 w-3" />
                      {route.duration}
                    </span>
                    <span>{route.distance}</span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-[#e4bd55]" />
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

const labelCls =
  "mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400"
const inputCls =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-[#182333] focus:outline-none focus:ring-2 focus:ring-[#e4bd55] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
