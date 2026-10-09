"use client" /* Hero */ /* ── LEFT ── */ /* Duration */ /* Vehicle */ /* Booking details */ /* ── RIGHT: Price summary ── */

import { FormEvent, useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Luggage,
  MapPin,
  ShieldCheck,
  User,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import { toast } from "@/components/ui/Toast"
import { useAuth } from "@/lib/auth-store"
import { transportationApi } from "@/lib/services"
import { useRouter } from "next/navigation"

type Service = Awaited<ReturnType<typeof transportationApi.services>>["items"][number]

const DURATIONS = [
  {
    key: "4h",
    label: "4 Hours",
    desc: "Perfect for city tours or business meetings",
    hours: 4,
  },
  {
    key: "8h",
    label: "8 Hours",
    desc: "A full working day with your driver",
    hours: 8,
  },
  {
    key: "full",
    label: "Full Day",
    desc: "Up to 12 hours, ideal for excursions",
    hours: 12,
  },
]

const VEHICLES = [
  {
    key: "sedan",
    label: "Sedan",
    desc: "Toyota Corolla or similar",
    pax: 4,
    luggage: 2,
    img: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&h=340&fit=crop&auto=format&q=70",
    multiplier: 1,
  },
  {
    key: "suv",
    label: "SUV",
    desc: "Toyota Land Cruiser or similar",
    pax: 6,
    luggage: 4,
    img: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=600&h=340&fit=crop&auto=format&q=70",
    multiplier: 1.6,
  },
  {
    key: "premium",
    label: "Premium",
    desc: "Luxury sedan with amenities",
    pax: 4,
    luggage: 3,
    img: "https://images.unsplash.com/photo-1563720223809-b2cb2e6c3510?w=600&h=340&fit=crop&auto=format&q=70",
    multiplier: 2.2,
  },
]

function minDate() {
  return new Date().toISOString().slice(0, 10)
}

export default function PrivateDriverPage() {
  const { user } = useAuth()
  const router = useRouter()

  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDuration, setSelectedDuration] = useState("4h")
  const [selectedVehicle, setSelectedVehicle] = useState("sedan")
  const [date, setDate] = useState("")
  const [startTime, setStartTime] = useState("08:00")
  const [pickupLocation, setPickupLocation] = useState("")
  const [passengers, setPassengers] = useState(1)
  const [purpose, setPurpose] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    transportationApi
      .services({ serviceType: "PRIVATE_DRIVER", limit: 5 })
      .then((r) => setServices(r.items))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const baseRate = services[0] ? Number(services[0].fixedPrice) : 1200
  const durationObj =
    DURATIONS.find((d) => d.key === selectedDuration) ?? DURATIONS[0]
  const vehicleObj =
    VEHICLES.find((v) => v.key === selectedVehicle) ?? VEHICLES[0]
  const totalPrice = Math.round(
    baseRate * vehicleObj.multiplier * (durationObj.hours / 4),
  )

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) {
      toast.error("Sign in required", "Please sign in to hire a driver.")
      router.push("/auth?mode=login")
      return
    }
    if (!pickupLocation.trim() || !date) {
      toast.error("Missing details", "Please fill in pickup location and date.")
      return
    }
    const svc = services[0]
    if (!svc) {
      toast.error("No service available", "Try again later.")
      return
    }
    setSubmitting(true)
    try {
      const result = await transportationApi.createBooking({
        serviceId: svc.id,
        pickupAt: new Date(`${date}T${startTime}`).toISOString(),
        pickupLocation: pickupLocation.trim(),
        dropoffLocation: pickupLocation.trim(),
        passengers,
        customerNotes: [
          `Vehicle: ${vehicleObj.label}`,
          `Duration: ${durationObj.label}`,
          purpose ? `Purpose: ${purpose}` : "",
        ]
          .filter(Boolean)
          .join(" | "),
      })
      toast.success(
        "Driver hired!",
        `Reference: ${(result as any).bookingRef ?? "—"}`,
      )
      router.push("/transportation/my-bookings")
    } catch (err) {
      toast.error(
        "Booking failed",
        err instanceof Error ? err.message : "Please try again.",
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f3efe5] dark:bg-[#07111f]">
      {}
      <section className="relative h-[380px] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1400&h=600&fit=crop&auto=format&q=80"
            alt="Private driver in luxury vehicle"
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b1528] via-[#0b1528]/60 to-transparent" />
        </div>
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 pb-12">
          <Link
            href="/transportation"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Transportation
          </Link>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#e4bd55]">
            Private Driver
          </p>
          <h1 className="mt-2 font-serif text-4xl sm:text-5xl font-bold text-white">
            A Driver for Your Journey
          </h1>
          <p className="mt-3 max-w-lg text-white/75">
            Travel comfortably with a professional private driver — hire by the
            hour, half-day, or full day.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <form
          onSubmit={handleSubmit}
          className="grid gap-10 lg:grid-cols-[1fr_360px]"
        >
          {}
          <div className="space-y-8">
            {}
            <div>
              <SectionLabel eyebrow="Step 1" title="Choose duration" />
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                {DURATIONS.map((d) => (
                  <button
                    type="button"
                    key={d.key}
                    onClick={() => setSelectedDuration(d.key)}
                    className={`rounded-2xl border p-5 text-left transition-all ${
                      selectedDuration === d.key
                        ? "border-[#e4bd55] bg-[#FEF9E7] shadow-md"
                        : "border-slate-200 bg-white hover:border-[#e4bd55]/50 dark:border-slate-700 dark:bg-slate-900"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-serif text-lg font-semibold text-[#0b1528] dark:text-white">
                        {d.label}
                      </span>
                      {selectedDuration === d.key && (
                        <CheckCircle2 className="h-4 w-4 text-[#e4bd55]" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500">{d.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {}
            <div>
              <SectionLabel eyebrow="Step 2" title="Choose vehicle" />
              <div className="mt-4 grid gap-5 sm:grid-cols-3">
                {VEHICLES.map((v) => (
                  <button
                    type="button"
                    key={v.key}
                    onClick={() => setSelectedVehicle(v.key)}
                    className={`rounded-3xl border overflow-hidden text-left transition-all ${
                      selectedVehicle === v.key
                        ? "border-[#e4bd55] shadow-lg ring-1 ring-[#e4bd55]/30"
                        : "border-slate-200/80 bg-white hover:border-[#e4bd55]/40 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
                    }`}
                  >
                    <div className="relative h-40 w-full overflow-hidden">
                      <Image
                        src={v.img}
                        alt={v.label}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="300px"
                      />
                      {selectedVehicle === v.key && (
                        <div className="absolute top-2 right-2 rounded-full bg-[#e4bd55] p-1">
                          <CheckCircle2 className="h-3.5 w-3.5 text-[#07111f]" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="font-serif font-semibold text-[#0b1528] dark:text-white">
                        {v.label}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{v.desc}</p>
                      <div className="mt-2 flex gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {v.pax}
                        </span>
                        <span className="flex items-center gap-1">
                          <Luggage className="h-3 w-3" />
                          {v.luggage}
                        </span>
                      </div>
                      <p className="mt-2 font-bold text-[#0b1528] dark:text-white">
                        from ETB{" "}
                        {Math.round(baseRate * v.multiplier).toLocaleString()}
                        <span className="text-xs font-normal text-slate-500">
                          {" "}
                          /4h
                        </span>
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {}
            <div>
              <SectionLabel eyebrow="Step 3" title="Booking details" />
              <div className="mt-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-500">
                      Date
                    </label>
                    <input
                      type="date"
                      required
                      value={date}
                      min={minDate()}
                      onChange={(e) => setDate(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-500">
                      Start time
                    </label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-500">
                    Pickup location
                  </label>
                  <input
                    required
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                    placeholder="Hotel name or address"
                    className={inputCls}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-500">
                      Passengers
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={vehicleObj.pax}
                      value={passengers}
                      onChange={(e) => setPassengers(Number(e.target.value))}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-500">
                      Purpose (optional)
                    </label>
                    <input
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      placeholder="Business, tour, leisure…"
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {}
          <div className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
            <div className="rounded-3xl bg-[#0b1528] p-6 text-white">
              <p className="text-xs font-bold uppercase tracking-widest text-[#e4bd55]">
                Booking summary
              </p>
              <div className="mt-4 space-y-2.5 text-sm">
                <PriceRow label="Vehicle" value={vehicleObj.label} />
                <PriceRow label="Duration" value={durationObj.label} />
                <PriceRow label="Date" value={date || "—"} />
                <PriceRow label="Start time" value={startTime} />
                <PriceRow label="Passengers" value={String(passengers)} />
              </div>
              <div className="mt-4 border-t border-white/15 pt-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-white/60">Total estimate</span>
                  <span className="font-serif text-2xl font-bold">
                    ETB {totalPrice.toLocaleString()}
                  </span>
                </div>
              </div>
              <Button
                type="submit"
                variant="gold"
                size="lg"
                className="mt-5 w-full"
                loading={submitting}
              >
                Choose Driver
              </Button>
            </div>

            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-bold uppercase tracking-widest text-[#e4bd55] mb-3">
                Includes
              </p>
              {[
                "Professional licensed driver",
                "Fuel included",
                "Water provided",
                "English-speaking driver",
                "Free wait time (30 min)",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 py-1.5 text-sm text-slate-600 dark:text-slate-300"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

function SectionLabel({ eyebrow, title }: { eyebrow: string ;title: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-widest text-[#e4bd55]">
        {eyebrow}
      </p>
      <h2 className="mt-0.5 font-serif text-xl font-semibold text-[#0b1528] dark:text-white">
        {title}
      </h2>
    </div>
  )
}

function PriceRow({ label, value }: { label: string ;value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-white/60">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

const inputCls =
  "h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-[#182333] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#e4bd55] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
