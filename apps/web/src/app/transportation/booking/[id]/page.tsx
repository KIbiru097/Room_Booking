"use client" /* Header */ /* ── LEFT ── */ /* Status timeline */ /* Connector line */ /* Trip details */ /* Map */ /* Actions */ /* ── RIGHT: Driver + vehicle ── */ /* Driver card */ /* Provider card */

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Car,
  CheckCircle2,
  Clock3,
  Luggage,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Star,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { toast } from "@/components/ui/Toast"
import { useAuth } from "@/lib/auth-store"
import { transportationApi } from "@/lib/services"

type Booking = Awaited<ReturnType<typeof transportationApi.myBookings>>[number]

const TransportRouteMap = dynamic(() => import("../../TransportRouteMap"), {
  ssr: false,
  loading: () => (
    <div className="h-72 rounded-3xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
  ),
})

const STATUS_TIMELINE = [
  "Requested",
  "Confirmed",
  "Driver on the way",
  "Driver arrived",
  "Ride started",
  "Completed",
]

const STATUS_INDEX: Record<string, number> = {
  REQUESTED: 0,
  ACCEPTED: 1,
  ASSIGNED: 2,
  IN_PROGRESS: 4,
  COMPLETED: 5,
  CANCELLED: -1,
}

const STATUS_STYLES: Record<string, string> = {
  REQUESTED: "bg-amber-50 text-amber-700 border-amber-200",
  ACCEPTED: "bg-sky-50 text-sky-700 border-sky-200",
  ASSIGNED: "bg-blue-50 text-blue-700 border-blue-200",
  IN_PROGRESS: "bg-indigo-50 text-indigo-700 border-indigo-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-slate-100 text-slate-500 border-slate-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const router = useRouter()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push("/auth?mode=login")
      return
    }
    transportationApi
      .myBookings()
      .then((list) => setBooking(list.find((b) => b.id === id) ?? null))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id, user, router])

  async function handleCancel() {
    if (!booking || !confirm("Cancel this booking?")) return
    setCancelling(true)
    try {
      await transportationApi.cancelBooking(booking.id)
      toast.success("Booking cancelled")
      setBooking((b) => (b ? { ...b, status: "CANCELLED" } : b))
    } catch (err) {
      toast.error("Could not cancel", err instanceof Error ? err.message : "")
    } finally {
      setCancelling(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3efe5] dark:bg-[#07111f]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#e4bd55] border-t-transparent" />
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f3efe5] dark:bg-[#07111f]">
        <p className="font-semibold text-slate-600">Booking not found</p>
        <Link href="/transportation/my-bookings">
          <Button variant="primary">My Bookings</Button>
        </Link>
      </div>
    )
  }

  const currentStep = STATUS_INDEX[booking.status] ?? 0
  const isCancelled =
    booking.status === "CANCELLED" || booking.status === "REJECTED"
  const isRental = booking.service.serviceType === "CAR_RENTAL"
  const canCancel = ["REQUESTED", "ACCEPTED"].includes(booking.status)

  return (
    <div className="min-h-screen bg-[#f3efe5] dark:bg-[#07111f]">
      {}
      <div className="bg-[#0b1528] px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/transportation/my-bookings"
            className="mb-3 inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> My Transportation
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-white">
              {booking.service.name}
            </h1>
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${STATUS_STYLES[booking.status] ?? ""}`}
            >
              {booking.status.replace(/_/g, " ")}
            </span>
          </div>
          <p className="mt-1.5 font-mono text-sm text-[#e4bd55]">
            {booking.bookingRef}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          {}
          <div className="space-y-6">
            {}
            {!isCancelled && (
              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <p className="mb-5 text-xs font-bold uppercase tracking-widest text-[#e4bd55]">
                  Trip progress
                </p>
                <div className="relative">
                  {}
                  <div className="absolute left-4 top-5 bottom-5 w-0.5 bg-slate-100 dark:bg-slate-800" />
                  <div className="space-y-5">
                    {STATUS_TIMELINE.map((step, i) => {
                      const done = i < currentStep
                      const active = i === currentStep
                      return (
                        <div
                          key={step}
                          className="relative flex items-start gap-4 pl-0"
                        >
                          <div
                            className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                              done
                                ? "border-[#e4bd55] bg-[#e4bd55]"
                                : active
                                  ? "border-[#e4bd55] bg-white dark:bg-slate-900 shadow-[0_0_0_4px_rgba(212,175,55,0.2)]"
                                  : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
                            }`}
                          >
                            {done ? (
                              <CheckCircle2 className="h-4 w-4 text-[#07111f]" />
                            ) : (
                              <span
                                className={`text-xs font-bold ${
                                  active ? "text-[#e4bd55]" : "text-slate-400"
                                }`}
                              >
                                {i + 1}
                              </span>
                            )}
                          </div>
                          <div className="pt-0.5">
                            <p
                              className={`text-sm font-semibold ${
                                done || active
                                  ? "text-[#0b1528] dark:text-white"
                                  : "text-slate-400"
                              }`}
                            >
                              {step}
                            </p>
                            {active && (
                              <p className="text-xs text-[#e4bd55] font-medium mt-0.5">
                                Current status
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="mb-4 text-xs font-bold uppercase tracking-widest text-[#e4bd55]">
                Trip details
              </p>
              <div className="space-y-3 text-sm">
                {!isRental ? (
                  <>
                    <DetailRow
                      icon={<Clock3 className="h-4 w-4 text-[#e4bd55]" />}
                      label="Pickup time"
                      value={formatDate(booking.pickupAt)}
                    />
                    <DetailRow
                      icon={<MapPin className="h-4 w-4 text-emerald-500" />}
                      label="From"
                      value={booking.pickupLocation}
                    />
                    <DetailRow
                      icon={<MapPin className="h-4 w-4 text-[#e4bd55]" />}
                      label="To"
                      value={booking.dropoffLocation}
                    />
                  </>
                ) : (
                  <>
                    <DetailRow
                      icon={<Clock3 className="h-4 w-4 text-[#e4bd55]" />}
                      label="Rental start"
                      value={formatDate(booking.pickupAt)}
                    />
                    {booking.rentalEndDate && (
                      <DetailRow
                        icon={<Clock3 className="h-4 w-4 text-[#e4bd55]" />}
                        label="Return by"
                        value={formatDate(booking.rentalEndDate)}
                      />
                    )}
                    <DetailRow
                      icon={<MapPin className="h-4 w-4 text-[#e4bd55]" />}
                      label="Pickup location"
                      value={booking.pickupLocation}
                    />
                  </>
                )}
                <DetailRow
                  icon={<User className="h-4 w-4 text-[#e4bd55]" />}
                  label="Passengers"
                  value={String(booking.passengers)}
                />
                <DetailRow
                  icon={<Car className="h-4 w-4 text-[#e4bd55]" />}
                  label="Payment status"
                  value={booking.paymentStatus}
                />
                <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                  <span className="font-semibold text-[#0b1528] dark:text-white">
                    Total
                  </span>
                  <span className="font-serif text-xl font-bold text-[#0b1528] dark:text-white">
                    ETB {Number(booking.priceAmount).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {}
            <TransportRouteMap />

            {}
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" rightIcon={<Car className="h-4 w-4" />}>
                Track Ride
              </Button>
              {canCancel && (
                <Button
                  variant="danger"
                  onClick={handleCancel}
                  loading={cancelling}
                >
                  Cancel Booking
                </Button>
              )}
            </div>
          </div>

          {}
          <div className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
            {}
            {booking.driver ? (
              <div className="rounded-3xl border border-[#e4bd55]/30 bg-white p-6 shadow-sm dark:bg-slate-900">
                <p className="mb-4 text-xs font-bold uppercase tracking-widest text-[#e4bd55]">
                  Your driver
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0b1528] text-xl font-bold text-[#e4bd55]">
                    {booking.driver.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-lg text-[#0b1528] dark:text-white">
                      {booking.driver.name}
                    </p>
                    <div className="flex items-center gap-1 text-sm text-slate-500">
                      <Star className="h-3.5 w-3.5 fill-[#e4bd55] text-[#e4bd55]" />{" "}
                      4.9
                    </div>
                  </div>
                </div>
                {booking.vehicle && (
                  <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm dark:bg-slate-800">
                    <p className="font-semibold text-[#0b1528] dark:text-white">
                      {booking.vehicle.vehicleType} {booking.vehicle.make ?? ""}{" "}
                      {booking.vehicle.model ?? ""}
                    </p>
                    <p className="font-mono text-slate-500">
                      {booking.vehicle.plateNumber}
                    </p>
                  </div>
                )}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <a href={`tel:${booking.driver.phone}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      leftIcon={<Phone className="h-4 w-4" />}
                    >
                      Call
                    </Button>
                  </a>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    leftIcon={<MessageCircle className="h-4 w-4" />}
                  >
                    Message
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                  <User className="h-6 w-6 text-slate-400" />
                </div>
                <p className="font-semibold text-slate-600 dark:text-slate-300">
                  Driver not yet assigned
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  You'll be notified when a driver is assigned.
                </p>
              </div>
            )}

            {}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#e4bd55]">
                Provider
              </p>
              <p className="font-semibold text-[#0b1528] dark:text-white">
                {booking.service.name}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="success" size="sm">
                  <ShieldCheck className="mr-1 h-3 w-3" />
                  Verified partner
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function DetailRow({
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
      <div className="flex items-center gap-2 text-slate-500 shrink-0">
        {icon}
        <span>{label}</span>
      </div>
      <span className="text-right font-medium text-[#0b1528] dark:text-white max-w-[60%]">
        {value}
      </span>
    </div>
  )
}
