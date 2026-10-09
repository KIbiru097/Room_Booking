"use client"

// Form state
/* Hero */ /* ── LEFT: Booking form ── */ /* Airport */ /* Date + Time */ /* Flight number */ /* Destination */ /* Passengers + Luggage */ /* Vehicle selector */ /* ── RIGHT: Summary + Why ── */ /* Transfer summary card */ /* Why book */

import { FormEvent, useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Luggage,
  MapPin,
  Plane,
  ShieldCheck,
  Star,
  User,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import { toast } from "@/components/ui/Toast"
import { useAuth } from "@/lib/auth-store"
import { useLanguage } from "@/lib/i18n"
import { transportationApi } from "@/lib/services"
import { useRouter } from "next/navigation"

type Service = Awaited<ReturnType<typeof transportationApi.services>>["items"][number]

function minDT(
  offsetMs = 60 *
    60_000,
) {
  return new Date(
    Date.now() +
      offsetMs,
  )
    .toISOString()
    .slice(0, 16)
}

const WHY_ITEMS = [
  {
    icon: ShieldCheck,
    title: "Verified partners",
    desc: "All drivers and vehicles are vetted and approved by YayeTech.",
  },
  {
    icon: MapPin,
    title: "Hotel-connected",
    desc: "Pickup is automatically connected to your hotel address.",
  },
  {
    icon: CheckCircle2,
    title: "Clear ETB pricing",
    desc: "Fixed price in Ethiopian Birr — no surprises on arrival.",
  },
  {
    icon: Clock3,
    title: "Trip notifications",
    desc: "You get SMS and app notifications at every step.",
  },
]

export default function AirportPickupPage() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const router = useRouter()

  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [airport, setAirport] = useState("Bole International Airport (ADD)")
  const [arrivalDate, setArrivalDate] = useState("")
  const [arrivalTime, setArrivalTime] = useState("")
  const [flightNumber, setFlightNumber] = useState("")
  const [destination, setDestination] = useState("")
  const [passengers, setPassengers] = useState(1)
  const [luggage, setLuggage] = useState(2)
  const [submitting, setSubmitting] = useState(false)
  const [showSummary, setShowSummary] = useState(false)

  useEffect(() => {
    transportationApi
      .services({ serviceType: "AIRPORT_PICKUP", limit: 10 })
      .then((r) => {
        setServices(r.items)
        if (r.items[0]) setSelectedService(r.items[0])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) {
      toast.error("Sign in required", "Please sign in to book a transfer.")
      router.push("/auth?mode=login")
      return
    }
    if (!destination.trim() || !arrivalDate || !arrivalTime) {
      toast.error(
        "Missing details",
        "Please fill in destination, date, and time.",
      )
      return
    }
    if (!selectedService) {
      toast.error("No service selected", "Please choose a vehicle.")
      return
    }
    setSubmitting(true)
    try {
      const pickupAt = new Date(`${arrivalDate}T${arrivalTime}`).toISOString()
      const result = await transportationApi.createBooking({
        serviceId: selectedService.id,
        pickupAt,
        pickupLocation: airport,
        dropoffLocation: destination.trim(),
        passengers,
        luggageCount: luggage,
        customerNotes: flightNumber ? `Flight: ${flightNumber}` : undefined,
      })
      toast.success(
        "Airport pickup booked!",
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
      <section className="relative h-[420px] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1400&h=700&fit=crop&auto=format&q=80"
            alt="Bole International Airport"
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b1528] via-[#0b1528]/55 to-[#0b1528]/10" />
        </div>
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 pb-12">
          <Link
            href="/transportation"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Transportation
          </Link>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#e4bd55]">
            Airport Transfer
          </p>
          <h1 className="mt-2 font-serif text-4xl sm:text-5xl font-bold text-white">
            Arrive. Relax.
            <br />
            We've Got the Ride.
          </h1>
          <p className="mt-3 max-w-lg text-white/75">
            Reliable airport transfers connected to your hotel — verified
            drivers, fixed ETB pricing, zero stress.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
          {}
          <div className="space-y-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#e4bd55]">
                Book Your Transfer
              </p>
              <h2 className="mt-1 font-serif text-2xl font-semibold text-[#0b1528] dark:text-white">
                Flight details
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
                {}
                <FieldGroup
                  label="Airport"
                  icon={<Plane className="h-4 w-4 text-[#e4bd55]" />}
                >
                  <input
                    value={airport}
                    onChange={(e) => setAirport(e.target.value)}
                    placeholder="Bole International Airport (ADD)"
                    className={inputCls}
                  />
                </FieldGroup>

                {}
                <div className="grid gap-4 sm:grid-cols-2">
                  <FieldGroup label="Arrival date">
                    <input
                      type="date"
                      required
                      value={arrivalDate}
                      min={new Date().toISOString().slice(0, 10)}
                      onChange={(e) => setArrivalDate(e.target.value)}
                      className={inputCls}
                    />
                  </FieldGroup>
                  <FieldGroup label="Arrival time">
                    <input
                      type="time"
                      required
                      value={arrivalTime}
                      onChange={(e) => setArrivalTime(e.target.value)}
                      className={inputCls}
                    />
                  </FieldGroup>
                </div>

                {}
                <FieldGroup label="Flight number (optional)">
                  <input
                    value={flightNumber}
                    onChange={(e) => setFlightNumber(e.target.value)}
                    placeholder="e.g. ET352"
                    maxLength={15}
                    className={inputCls}
                  />
                </FieldGroup>

                {}
                <FieldGroup
                  label="Destination / Hotel"
                  icon={<MapPin className="h-4 w-4 text-[#e4bd55]" />}
                >
                  <input
                    required
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="e.g. Sheraton Addis, Kazanchis"
                    className={inputCls}
                  />
                </FieldGroup>

                {}
                <div className="grid gap-4 sm:grid-cols-2">
                  <FieldGroup label="Passengers">
                    <div className="flex items-center gap-2">
                      <CountBtn
                        onClick={() =>
                          setPassengers(Math.max(1, passengers - 1))
                        }
                      >
                        −
                      </CountBtn>
                      <span className="flex-1 text-center font-semibold text-[#182333] dark:text-white">
                        {passengers}
                      </span>
                      <CountBtn
                        onClick={() =>
                          setPassengers(Math.min(50, passengers + 1))
                        }
                      >
                        +
                      </CountBtn>
                    </div>
                  </FieldGroup>
                  <FieldGroup label="Luggage pieces">
                    <div className="flex items-center gap-2">
                      <CountBtn
                        onClick={() => setLuggage(Math.max(0, luggage - 1))}
                      >
                        −
                      </CountBtn>
                      <span className="flex-1 text-center font-semibold text-[#182333] dark:text-white">
                        {luggage}
                      </span>
                      <CountBtn onClick={() => setLuggage(luggage + 1)}>
                        +
                      </CountBtn>
                    </div>
                  </FieldGroup>
                </div>
              </div>

              {}
              {!loading && services.length > 0 && (
                <div>
                  <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">
                    Choose vehicle
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {services.slice(0, 4).map((svc) => (
                      <button
                        type="button"
                        key={svc.id}
                        onClick={() => setSelectedService(svc)}
                        className={`rounded-2xl border p-4 text-left transition-all ${
                          selectedService?.id === svc.id
                            ? "border-[#e4bd55] bg-[#FEF9E7] shadow-md"
                            : "border-slate-200 bg-white hover:border-[#e4bd55]/50 dark:border-slate-700 dark:bg-slate-900"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-sm text-[#0b1528] dark:text-white">
                            {svc.name}
                          </p>
                          {selectedService?.id === svc.id && (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#e4bd55]" />
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {svc.provider.businessName}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" /> {svc.passengerLimit}{" "}
                            pax
                          </span>
                          {svc.luggageLimit != null && (
                            <span className="flex items-center gap-1">
                              <Luggage className="h-3 w-3" /> {svc.luggageLimit}
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-base font-bold text-[#0b1528] dark:text-white">
                          ETB {Number(svc.fixedPrice).toLocaleString()}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <Button
                type="submit"
                variant="gold"
                size="lg"
                className="w-full"
                loading={submitting}
              >
                Book Airport Pickup
              </Button>
            </form>
          </div>

          {}
          <div className="space-y-5">
            {}
            {selectedService && (
              <div className="rounded-3xl border border-[#e4bd55]/30 bg-white p-6 shadow-sm dark:bg-slate-900">
                <p className="mb-4 text-xs font-bold uppercase tracking-widest text-[#e4bd55]">
                  Your Transfer
                </p>
                <div className="space-y-3">
                  <SummaryRow
                    icon={<Plane className="h-4 w-4 text-[#e4bd55]" />}
                    label="Airport"
                    value={airport}
                  />
                  <SummaryRow
                    icon={<MapPin className="h-4 w-4 text-[#e4bd55]" />}
                    label="Destination"
                    value={destination || "—"}
                  />
                  <SummaryRow
                    icon={<Clock3 className="h-4 w-4 text-[#e4bd55]" />}
                    label="Pickup"
                    value={
                      arrivalDate && arrivalTime
                        ? `${arrivalDate} at ${arrivalTime}`
                        : "—"
                    }
                  />
                  <SummaryRow
                    icon={<User className="h-4 w-4 text-[#e4bd55]" />}
                    label="Passengers"
                    value={String(passengers)}
                  />
                  <SummaryRow
                    icon={<Luggage className="h-4 w-4 text-[#e4bd55]" />}
                    label="Luggage"
                    value={String(luggage)}
                  />
                  <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">
                        Total price
                      </span>
                      <span className="font-serif text-xl font-bold text-[#0b1528] dark:text-white">
                        ETB{" "}
                        {Number(selectedService.fixedPrice).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="mb-4 text-xs font-bold uppercase tracking-widest text-[#e4bd55]">
                Why book with YayeTech?
              </p>
              <div className="space-y-4">
                {WHY_ITEMS.map((item) => {
                  const Icon = item.icon
                  return (
                    <div key={item.title} className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#e4bd55]/10">
                        <Icon className="h-4 w-4 text-[#e4bd55]" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#0b1528] dark:text-white">
                          {item.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const inputCls =
  "h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-[#182333] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#e4bd55] dark:border-slate-700 dark:bg-slate-800 dark:text-white"

function FieldGroup({
  label,
  icon,
  children,
}: {
  label: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
        {icon}
        {label}
      </label>
      {children}
    </div>
  )
}

function CountBtn({
  children,
  onClick,
}: {
  children: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:border-[#e4bd55] hover:text-[#0b1528] transition-colors"
    >
      {children}
    </button>
  )
}

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-slate-500">{label}</span>
      </div>
      <span className="text-right text-sm font-medium text-[#0b1528] dark:text-white max-w-[60%]">
        {value}
      </span>
    </div>
  )
}
