"use client" /* Breadcrumb */ /* ── LEFT: Booking form ── */ /* Heading */ /* Location inputs */ /* Date + passengers */ /* Vehicle type cards */ /* Notes */ /* Price summary + CTA */ /* ── RIGHT: Map ── */ /* Drivers nearby card */ /* Confirm modal */

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Luggage,
  MapPin,
  ShieldCheck,
  User,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { toast } from "@/components/ui/Toast"
import { useAuth } from "@/lib/auth-store"
import { useLanguage } from "@/lib/i18n"
import { transportationApi } from "@/lib/services"
import { useRouter } from "next/navigation"

const TransportRouteMap = dynamic(() => import("../TransportRouteMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[500px] w-full items-center justify-center rounded-3xl bg-slate-100 text-sm font-medium text-slate-500 dark:bg-slate-800">
      Loading map…
    </div>
  ),
})

type Service = Awaited<ReturnType<typeof transportationApi.services>>["items"][number]

const VEHICLE_TYPES = [
  {
    key: "economy",
    label: "Economy",
    desc: "Affordable, comfortable sedan",
    pax: 4,
    eta: "3–5 min",
    multiplier: 1,
    img: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400&h=220&fit=crop&auto=format&q=70",
  },
  {
    key: "comfort",
    label: "Comfort",
    desc: "Premium sedan, extra legroom",
    pax: 4,
    eta: "5–8 min",
    multiplier: 1.4,
    img: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400&h=220&fit=crop&auto=format&q=70",
  },
  {
    key: "premium",
    label: "Premium",
    desc: "Luxury vehicle, meet-and-greet",
    pax: 4,
    eta: "8–12 min",
    multiplier: 2,
    img: "https://images.unsplash.com/photo-1563720223809-b2cb2e6c3510?w=400&h=220&fit=crop&auto=format&q=70",
  },
  {
    key: "suv",
    label: "SUV",
    desc: "Spacious, ideal for groups",
    pax: 7,
    eta: "6–10 min",
    multiplier: 1.7,
    img: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=400&h=220&fit=crop&auto=format&q=70",
  },
]

function minDT() {
  return new Date(Date.now() + 30 * 60_000).toISOString().slice(0, 16)
}

export default function RidePage() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const router = useRouter()

  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVehicle, setSelectedVehicle] = useState("comfort")
  const [pickup, setPickup] = useState("")
  const [dropoff, setDropoff] = useState("")
  const [pickupAt, setPickupAt] = useState(minDT())
  const [passengers, setPassengers] = useState(1)
  const [luggage, setLuggage] = useState(0)
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    transportationApi
      .services({ serviceType: "AIRPORT_PICKUP", limit: 20 })
      .then((r) => setServices(r.items))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const basePrice = useMemo(() => {
    const svc = services[0]
    if (!svc) return 450
    return Number(svc.fixedPrice)
  }, [services])

  const selectedType =
    VEHICLE_TYPES.find((v) => v.key === selectedVehicle) ?? VEHICLE_TYPES[1]
  const estimatedPrice = Math.round(basePrice * selectedType.multiplier)

  const handleRouteSelect = useCallback((p: string, d: string) => {
    setPickup(p)
    setDropoff(d)
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) {
      toast.error("Sign in required", "Please sign in to request a ride.")
      router.push("/auth?mode=login")
      return
    }
    if (!pickup.trim() || !dropoff.trim()) {
      toast.error("Locations required", "Enter both pickup and destination.")
      return
    }
    const svc = services[0]
    if (!svc) {
      toast.error("No services available", "Please try again later.")
      return
    }
    setSubmitting(true)
    try {
      const result = await transportationApi.createBooking({
        serviceId: svc.id,
        pickupAt: new Date(pickupAt).toISOString(),
        pickupLocation: pickup.trim(),
        dropoffLocation: dropoff.trim(),
        passengers,
        luggageCount: luggage,
        customerNotes: notes.trim() || undefined,
      })
      setShowConfirm(false)
      toast.success(
        "Ride requested!",
        `Reference: ${(result as any).bookingRef ?? "—"}`,
      )
      router.push("/transportation/my-bookings")
    } catch (err) {
      toast.error(
        "Request failed",
        err instanceof Error ? err.message : "Please try again.",
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f3efe5] dark:bg-[#07111f]">
      {}
      <div className="bg-[#0b1528] px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center gap-2 text-sm">
          <Link
            href="/transportation"
            className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Transportation
          </Link>
          <span className="text-white/30">/</span>
          <span className="text-[#e4bd55] font-semibold">Ride</span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-[420px_1fr]">
          {}
          <div className="space-y-5">
            {}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#e4bd55]">
                Book a Ride
              </p>
              <h1 className="mt-1 font-serif text-3xl font-semibold text-[#0b1528] dark:text-white">
                Where are you going?
              </h1>
            </div>

            {}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
              <div className="relative">
                <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </div>
                <input
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  placeholder="Current location"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 text-sm text-[#182333] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#e4bd55] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div className="ml-2.5 h-4 w-px bg-slate-200 dark:bg-slate-700" />
              <div className="relative">
                <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                  <MapPin className="h-3.5 w-3.5 text-[#e4bd55]" />
                </div>
                <input
                  value={dropoff}
                  onChange={(e) => setDropoff(e.target.value)}
                  placeholder="Where to?"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 text-sm text-[#182333] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#e4bd55] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            {}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-500">
                  Pickup date & time
                </label>
                <input
                  type="datetime-local"
                  value={pickupAt}
                  min={minDT()}
                  onChange={(e) => setPickupAt(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-[#182333] focus:outline-none focus:ring-2 focus:ring-[#e4bd55] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-500">
                    Passengers
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPassengers(Math.max(1, passengers - 1))}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:border-[#e4bd55] hover:text-[#0b1528] transition-colors"
                    >
                      −
                    </button>
                    <span className="flex-1 text-center text-sm font-semibold text-[#182333] dark:text-white">
                      {passengers}
                    </span>
                    <button
                      onClick={() =>
                        setPassengers(
                          Math.min(selectedType.pax, passengers + 1),
                        )
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:border-[#e4bd55] hover:text-[#0b1528] transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-500">
                    Luggage
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setLuggage(Math.max(0, luggage - 1))}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:border-[#e4bd55] hover:text-[#0b1528] transition-colors"
                    >
                      −
                    </button>
                    <span className="flex-1 text-center text-sm font-semibold text-[#182333] dark:text-white">
                      {luggage}
                    </span>
                    <button
                      onClick={() => setLuggage(luggage + 1)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:border-[#e4bd55] hover:text-[#0b1528] transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {}
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">
                Vehicle type
              </p>
              <div className="grid grid-cols-2 gap-3">
                {VEHICLE_TYPES.map((v) => (
                  <button
                    key={v.key}
                    onClick={() => setSelectedVehicle(v.key)}
                    className={`flex flex-col rounded-2xl border p-3 text-left transition-all ${
                      selectedVehicle === v.key
                        ? "border-[#e4bd55] bg-[#FEF9E7] shadow-md"
                        : "border-slate-200 bg-white hover:border-[#e4bd55]/50 dark:border-slate-700 dark:bg-slate-900"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-semibold text-sm text-[#0b1528] dark:text-white">
                        {v.label}
                      </span>
                      {selectedVehicle === v.key && (
                        <CheckCircle2 className="h-4 w-4 text-[#e4bd55]" />
                      )}
                    </div>
                    <span className="text-xs text-slate-500">{v.desc}</span>
                    <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {v.pax}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock3 className="h-3 w-3" />
                        {v.eta}
                      </span>
                    </div>
                    <p className="mt-2 font-bold text-[#0b1528] dark:text-white">
                      from ETB{" "}
                      {Math.round(basePrice * v.multiplier).toLocaleString()}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-500">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Special instructions for your driver…"
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-[#182333] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#e4bd55] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            {}
            <div className="rounded-3xl bg-[#0b1528] p-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/60">Estimated fare</p>
                  <p className="font-serif text-2xl font-bold">
                    ETB {estimatedPrice.toLocaleString()}
                  </p>
                  <p className="text-xs text-white/50 mt-0.5">
                    {selectedType.label} · {passengers} pax
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#e4bd55]">ETA</p>
                  <p className="font-semibold">{selectedType.eta}</p>
                </div>
              </div>
              <Button
                onClick={() => setShowConfirm(true)}
                variant="gold"
                size="lg"
                className="mt-4 w-full"
                loading={loading}
              >
                Request Ride
              </Button>
              {!user && (
                <p className="mt-2 text-center text-xs text-white/50">
                  <Link
                    href="/auth?mode=login"
                    className="text-[#e4bd55] underline"
                  >
                    Sign in
                  </Link>{" "}
                  to request a ride
                </p>
              )}
            </div>
          </div>

          {}
          <div className="sticky top-24 h-fit space-y-4">
            <TransportRouteMap onSelectRoute={handleRouteSelect} />

            {}
            <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white px-5 py-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-1.5">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="h-8 w-8 rounded-full border-2 border-white bg-[#0b1528] flex items-center justify-center text-[10px] font-bold text-[#e4bd55]"
                    >
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#0b1528] dark:text-white">
                    3 drivers nearby
                  </p>
                  <p className="text-xs text-slate-500">Avg wait: 4 minutes</p>
                </div>
              </div>
              <Badge variant="success" size="sm">
                Available
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {}
      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#e4bd55]">
                  Confirm Ride
                </p>
                <h2 className="mt-0.5 font-serif text-2xl font-semibold text-[#0b1528] dark:text-white">
                  Review your trip
                </h2>
              </div>
              <button
                onClick={() => setShowConfirm(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
              <Row label="Vehicle" value={selectedType.label} />
              <Row label="From" value={pickup || "Current location"} />
              <Row label="To" value={dropoff || "—"} />
              <Row label="Passengers" value={String(passengers)} />
              <Row label="Luggage" value={String(luggage)} />
              <Row
                label="Estimated fare"
                value={`ETB ${estimatedPrice.toLocaleString()}`}
                bold
              />
            </div>
            <div className="mt-5 flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowConfirm(false)}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                variant="gold"
                onClick={handleSubmit as any}
                loading={submitting}
                className="flex-1"
              >
                Confirm Ride
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({
  label,
  value,
  bold,
}: {
  label: string
  value: string
  bold?: boolean
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span
        className={
          bold
            ? "text-lg font-bold text-[#0b1528] dark:text-white"
            : "font-medium text-[#182333] dark:text-white"
        }
      >
        {value}
      </span>
    </div>
  )
}
