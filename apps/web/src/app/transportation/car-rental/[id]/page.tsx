"use client" /* Breadcrumb */ /* ── LEFT ── */ /* Gallery */ /* Main image */ /* Thumbnails */ /* Info */ /* Specs */ /* Rental information */ /* ── RIGHT: Reserve form ── */ /* Price summary */

import { FormEvent, useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Gauge,
  Luggage,
  MapPin,
  ShieldCheck,
  Star,
  User,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { toast } from "@/components/ui/Toast"
import { useAuth } from "@/lib/auth-store"
import { transportationApi } from "@/lib/services"

type Service = Awaited<ReturnType<typeof transportationApi.services>>["items"][number]

const GALLERY_IMAGES = [
  "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=900&h=560&fit=crop&auto=format&q=80",
  "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=900&h=560&fit=crop&auto=format&q=80",
  "https://images.unsplash.com/photo-1563720223809-b2cb2e6c3510?w=900&h=560&fit=crop&auto=format&q=80",
  "https://images.unsplash.com/photo-1571607388263-1044f9ea01dd?w=900&h=560&fit=crop&auto=format&q=80",
]

function diffDays(start: string, end: string) {
  if (!start || !end) return 0
  const d = new Date(end).getTime() - new Date(start).getTime()
  return Math.max(1, Math.ceil(d / 86_400_000))
}

export default function CarDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const router = useRouter()

  const [service, setService] = useState<Service | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeImg, setActiveImg] = useState(0)
  const [pickupDate, setPickupDate] = useState("")
  const [returnDate, setReturnDate] = useState("")
  const [pickupLocation, setPickupLocation] = useState("")
  const [dropoffLocation, setDropoffLocation] = useState("")
  const [passengers, setPassengers] = useState(1)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    transportationApi
      .services({ serviceType: "CAR_RENTAL", limit: 50 })
      .then((r) => {
        const found = r.items.find((s) => s.id === id) ?? r.items[0] ?? null
        setService(found)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  const days = diffDays(pickupDate, returnDate)
  const dailyRate = service
    ? Number(service.dailyRate ?? service.fixedPrice)
    : 0
  const deposit = service?.depositAmount ? Number(service.depositAmount) : 0
  const total = dailyRate * Math.max(1, days)

  async function handleReserve(e: FormEvent) {
    e.preventDefault()
    if (!user) {
      toast.error("Sign in required", "")
      router.push("/auth?mode=login")
      return
    }
    if (!service) return
    if (!pickupDate || !returnDate || !pickupLocation.trim()) {
      toast.error("Missing details", "Please fill in all required fields.")
      return
    }
    setSubmitting(true)
    try {
      const result = await transportationApi.createBooking({
        serviceId: service.id,
        pickupAt: new Date(`${pickupDate}T08:00`).toISOString(),
        pickupLocation: pickupLocation.trim(),
        dropoffLocation: dropoffLocation.trim() || pickupLocation.trim(),
        passengers,
        rentalStartDate: new Date(`${pickupDate}T08:00`).toISOString(),
        rentalEndDate: new Date(`${returnDate}T23:59`).toISOString(),
      })
      toast.success(
        "Car reserved!",
        `Ref: ${(result as any).bookingRef ?? "—"}`,
      )
      router.push("/transportation/my-bookings")
    } catch (err) {
      toast.error(
        "Reservation failed",
        err instanceof Error ? err.message : "Try again.",
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3efe5] dark:bg-[#07111f]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#e4bd55] border-t-transparent" />
      </div>
    )
  }

  if (!service) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f3efe5] dark:bg-[#07111f]">
        <p className="text-lg font-semibold text-slate-600">
          Vehicle not found
        </p>
        <Link href="/transportation/car-rental">
          <Button variant="primary">Browse Rentals</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f3efe5] dark:bg-[#07111f]">
      {}
      <div className="bg-[#0b1528] px-4 py-4 sm:px-6">
        <nav className="mx-auto flex max-w-7xl items-center gap-2 text-sm">
          <Link
            href="/transportation"
            className="text-white/60 hover:text-white transition-colors"
          >
            Transportation
          </Link>
          <span className="text-white/30">/</span>
          <Link
            href="/transportation/car-rental"
            className="text-white/60 hover:text-white transition-colors"
          >
            Car Rental
          </Link>
          <span className="text-white/30">/</span>
          <span className="text-[#e4bd55] font-semibold truncate max-w-[200px]">
            {service.name}
          </span>
        </nav>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
          {}
          <div className="space-y-8">
            {}
            <div className="space-y-3">
              {}
              <div className="relative h-[380px] overflow-hidden rounded-3xl bg-slate-100 dark:bg-slate-800">
                <Image
                  src={GALLERY_IMAGES[activeImg]}
                  alt={service.name}
                  fill
                  priority
                  className="object-cover transition-opacity duration-300"
                  sizes="(max-width:1024px) 100vw, 65vw"
                />
                <button
                  onClick={() =>
                    setActiveImg(
                      (p) =>
                        (p - 1 + GALLERY_IMAGES.length) % GALLERY_IMAGES.length,
                    )
                  }
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg hover:bg-white transition-colors"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-5 w-5 text-[#0b1528]" />
                </button>
                <button
                  onClick={() =>
                    setActiveImg((p) => (p + 1) % GALLERY_IMAGES.length)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg hover:bg-white transition-colors"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-5 w-5 text-[#0b1528]" />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {GALLERY_IMAGES.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImg(i)}
                      className={`h-1.5 rounded-full transition-all ${
                        i === activeImg
                          ? "w-6 bg-[#e4bd55]"
                          : "w-1.5 bg-white/60"
                      }`}
                      aria-label={`Image ${i + 1}`}
                    />
                  ))}
                </div>
              </div>
              {}
              <div className="grid grid-cols-4 gap-2">
                {GALLERY_IMAGES.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`relative h-20 overflow-hidden rounded-2xl border-2 transition-all ${
                      i === activeImg
                        ? "border-[#e4bd55]"
                        : "border-transparent"
                    }`}
                  >
                    <Image
                      src={src}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="120px"
                    />
                  </button>
                ))}
              </div>
            </div>

            {}
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#e4bd55]">
                    {service.provider.businessName}
                  </p>
                  <h1 className="mt-1 font-serif text-3xl font-semibold text-[#0b1528] dark:text-white">
                    {service.name}
                  </h1>
                  <div className="mt-2 flex items-center gap-3">
                    <Badge variant="success" size="sm">
                      <ShieldCheck className="mr-1 h-3 w-3" /> Verified Partner
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Star className="h-3.5 w-3.5 fill-[#e4bd55] text-[#e4bd55]" />{" "}
                      4.8 · 94 trips
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Daily rate</p>
                  <p className="font-serif text-2xl font-bold text-[#0b1528] dark:text-white">
                    ETB {dailyRate.toLocaleString()}
                  </p>
                </div>
              </div>

              {service.description && (
                <p className="mt-5 leading-7 text-slate-600 dark:text-slate-300">
                  {service.description}
                </p>
              )}
            </div>

            {}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                {
                  icon: <User className="h-5 w-5 text-[#e4bd55]" />,
                  label: "Seats",
                  value: `${service.passengerLimit} passengers`,
                },
                {
                  icon: <Luggage className="h-5 w-5 text-[#e4bd55]" />,
                  label: "Luggage",
                  value:
                    service.luggageLimit != null
                      ? `${service.luggageLimit} bags`
                      : "Flexible",
                },
                {
                  icon: <Gauge className="h-5 w-5 text-[#e4bd55]" />,
                  label: "Mileage",
                  value:
                    service.mileagePolicyKm != null
                      ? `${service.mileagePolicyKm} km/day`
                      : "Unlimited",
                },
                {
                  icon: <Clock3 className="h-5 w-5 text-[#e4bd55]" />,
                  label: "Advance",
                  value:
                    service.advanceBookingMinutes != null
                      ? `${service.advanceBookingMinutes} min`
                      : "Flexible",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
                >
                  {s.icon}
                  <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {s.label}
                  </p>
                  <p className="mt-0.5 font-semibold text-sm text-[#0b1528] dark:text-white">
                    {s.value}
                  </p>
                </div>
              ))}
            </div>

            {}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-5">
              <h2 className="font-serif text-xl font-semibold text-[#0b1528] dark:text-white">
                Rental information
              </h2>
              <InfoSection
                title="Cancellation policy"
                body="Free cancellation up to 24 hours before rental start. 50% refund 12–24h before. Non-refundable within 12 hours."
              />
              <InfoSection
                title="Fuel policy"
                body="Vehicles are provided with a full tank. Return with a full tank or a refueling fee applies."
              />
              <InfoSection
                title="Required documents"
                body="Valid national ID or passport. Valid driver's licence. Credit or debit card for deposit hold."
              />
              <div>
                <p className="mb-2 text-sm font-semibold text-[#0b1528] dark:text-white">
                  Partner information
                </p>
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
                  <p className="font-semibold text-[#0b1528] dark:text-white">
                    {service.provider.businessName}
                  </p>
                  <p className="text-sm text-slate-500">
                    {service.provider.phone}
                  </p>
                  {service.provider.city && (
                    <p className="text-sm text-slate-500">
                      {service.provider.city.name}
                    </p>
                  )}
                  {service.provider.description && (
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                      {service.provider.description}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="success" size="sm">
                      <ShieldCheck className="mr-1 h-3 w-3" />
                      Business verified
                    </Badge>
                    <Badge variant="success" size="sm">
                      <ShieldCheck className="mr-1 h-3 w-3" />
                      Vehicles verified
                    </Badge>
                    <Badge variant="success" size="sm">
                      <ShieldCheck className="mr-1 h-3 w-3" />
                      YayeTech partner
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {}
          <div className="lg:sticky lg:top-24 lg:h-fit space-y-4">
            <form
              onSubmit={handleReserve}
              className="rounded-3xl border border-[#e4bd55]/30 bg-white p-6 shadow-sm dark:bg-slate-900 space-y-4"
            >
              <p className="text-xs font-bold uppercase tracking-widest text-[#e4bd55]">
                Reserve this car
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Pickup date</label>
                  <input
                    required
                    type="date"
                    value={pickupDate}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Return date</label>
                  <input
                    required
                    type="date"
                    value={returnDate}
                    min={pickupDate || new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Pickup location</label>
                <input
                  required
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  placeholder="Hotel or address"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Return location (optional)</label>
                <input
                  value={dropoffLocation}
                  onChange={(e) => setDropoffLocation(e.target.value)}
                  placeholder="Same as pickup"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Passengers</label>
                <input
                  type="number"
                  min={1}
                  max={service.passengerLimit}
                  value={passengers}
                  onChange={(e) => setPassengers(Number(e.target.value))}
                  className={inputCls}
                />
              </div>

              {}
              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">
                    ETB {dailyRate.toLocaleString()} × {Math.max(1, days)} day
                    {Math.max(1, days) !== 1 ? "s" : ""}
                  </span>
                  <span className="font-semibold text-[#0b1528] dark:text-white">
                    ETB {total.toLocaleString()}
                  </span>
                </div>
                {deposit > 0 && (
                  <div className="flex justify-between text-xs text-amber-700 dark:text-amber-400">
                    <span>Security deposit (refundable)</span>
                    <span>ETB {deposit.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-200 pt-2 dark:border-slate-700">
                  <span className="font-semibold text-[#0b1528] dark:text-white">
                    Total
                  </span>
                  <span className="font-bold text-lg text-[#0b1528] dark:text-white">
                    ETB {(total + deposit).toLocaleString()}
                  </span>
                </div>
              </div>

              <Button
                type="submit"
                variant="gold"
                size="lg"
                className="w-full"
                loading={submitting}
              >
                Reserve Car
              </Button>
              {!user && (
                <p className="text-center text-xs text-slate-400">
                  <Link
                    href="/auth?mode=login"
                    className="text-[#e4bd55] underline"
                  >
                    Sign in
                  </Link>{" "}
                  to reserve
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoSection({ title, body }: { title: string ;body: string }) {
  return (
    <div>
      <p className="mb-1 text-sm font-semibold text-[#0b1528] dark:text-white">
        {title}
      </p>
      <p className="text-sm text-slate-500 leading-6">{body}</p>
    </div>
  )
}

const labelCls = "mb-1.5 block text-xs font-semibold text-slate-500"
const inputCls =
  "h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-[#182333] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#e4bd55] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
