"use client" /* Header */ /* Tabs */ /* Top colour strip based on status */ /* Icon + Info */ /* Price + actions */ /* Book more CTA */

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  Bus,
  Car,
  Clock3,
  MapPin,
  Plane,
  User,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { toast } from "@/components/ui/Toast"
import { useAuth } from "@/lib/auth-store"
import { useLanguage } from "@/lib/i18n"
import { transportationApi } from "@/lib/services"

type Booking = Awaited<ReturnType<typeof transportationApi.myBookings>>[number]

type TabKey = "upcoming" | "active" | "completed" | "cancelled"

const TABS: { key: TabKey ;label: string }[] = [
  { key: "upcoming", label: "Upcoming" },
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
]

const STATUS_MAP: Record<string, TabKey> = {
  REQUESTED: "upcoming",
  ACCEPTED: "upcoming",
  ASSIGNED: "upcoming",
  IN_PROGRESS: "active",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  REJECTED: "cancelled",
  NO_SHOW: "cancelled",
}

const STATUS_STYLES: Record<string, string> = {
  REQUESTED: "bg-amber-50 text-amber-700 border-amber-200",
  ACCEPTED: "bg-sky-50 text-sky-700 border-sky-200",
  ASSIGNED: "bg-blue-50 text-blue-700 border-blue-200",
  IN_PROGRESS: "bg-indigo-50 text-indigo-700 border-indigo-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-slate-100 text-slate-500 border-slate-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
  NO_SHOW: "bg-orange-50 text-orange-700 border-orange-200",
}

function svcIcon(type: string) {
  if (type === "AIRPORT_PICKUP" || type === "AIRPORT_DROP_OFF") return Plane
  if (type === "CAR_RENTAL") return Car
  if (type === "PRIVATE_DRIVER") return User
  return Bus
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function MyTransportationPage() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabKey>("upcoming")
  const [cancelling, setCancelling] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      router.push("/auth?mode=login")
      return
    }
    transportationApi
      .myBookings()
      .then(setBookings)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user, router])

  async function handleCancel(id: string) {
    if (
      !confirm(
        "Cancel this booking? This may be non-refundable depending on timing.",
      )
    )
      return
    setCancelling(id)
    try {
      await transportationApi.cancelBooking(id)
      toast.success("Booking cancelled")
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: "CANCELLED" } : b)),
      )
    } catch (err) {
      toast.error(
        "Could not cancel",
        err instanceof Error ? err.message : "Try again.",
      )
    } finally {
      setCancelling(null)
    }
  }

  const filteredBookings = bookings.filter(
    (b) => (STATUS_MAP[b.status] ?? "upcoming") === activeTab,
  )

  const tabCounts: Record<TabKey, number> = bookings.reduce(
    (acc, b) => {
      const key = STATUS_MAP[b.status] ?? "upcoming"
      acc[key] = (acc[key] ?? 0) + 1
      return acc
    },
    { upcoming: 0, active: 0, completed: 0, cancelled: 0 },
  )

  return (
    <div className="min-h-screen bg-[#f3efe5] dark:bg-[#07111f]">
      {}
      <div className="bg-[#0b1528] px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <Link
            href="/transportation"
            className="mb-3 inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Transportation
          </Link>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#e4bd55]">
            Dashboard
          </p>
          <h1 className="mt-1 font-serif text-3xl sm:text-4xl font-semibold text-white">
            My Transportation
          </h1>
          <p className="mt-2 text-white/70">
            Manage your upcoming rides, transfers, rentals and intercity
            bookings.
          </p>

          {}
          <div className="mt-6 flex flex-wrap gap-2">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                  activeTab === tab.key
                    ? "bg-[#e4bd55] text-[#07111f] shadow-md"
                    : "bg-white/10 text-white/75 hover:bg-white/15"
                }`}
              >
                {tab.label}
                {tabCounts[tab.key] > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${
                      activeTab === tab.key ? "bg-[#07111f]/15" : "bg-white/20"
                    }`}
                  >
                    {tabCounts[tab.key]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-3xl bg-slate-200 dark:bg-slate-800"
              />
            ))}
          </div>
        ) : filteredBookings.length === 0 ? (
          <EmptyState tab={activeTab} />
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => {
              const Icon = svcIcon(booking.service.serviceType)
              const isRental = booking.service.serviceType === "CAR_RENTAL"
              const canCancel = ["REQUESTED", "ACCEPTED"].includes(
                booking.status,
              )

              return (
                <div
                  key={booking.id}
                  className="rounded-3xl border border-slate-200/80 bg-white shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900 overflow-hidden"
                >
                  {}
                  <div
                    className={`h-1 w-full ${
                      booking.status === "COMPLETED"
                        ? "bg-emerald-400"
                        : booking.status === "IN_PROGRESS"
                          ? "bg-indigo-400"
                          : booking.status === "CANCELLED" ||
                              booking.status === "REJECTED"
                            ? "bg-slate-300"
                            : "bg-[#e4bd55]"
                    }`}
                  />

                  <div className="p-5 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      {}
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0b1528]/8 dark:bg-white/5">
                          <Icon className="h-6 w-6 text-[#0b1528] dark:text-[#e4bd55]" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-[#0b1528] dark:text-white">
                              {booking.service.name}
                            </p>
                            <span className="font-mono text-xs text-slate-400">
                              {booking.bookingRef}
                            </span>
                            <span
                              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${STATUS_STYLES[booking.status] ?? ""}`}
                            >
                              {booking.status.replace(/_/g, " ")}
                            </span>
                          </div>

                          {isRental ? (
                            <p className="mt-1 text-sm text-slate-500">
                              <MapPin className="mr-1 inline h-3.5 w-3.5 text-[#e4bd55]" />
                              {booking.pickupLocation}
                              {booking.rentalEndDate
                                ? ` · ${formatDate(booking.pickupAt)} → ${formatDate(booking.rentalEndDate)}`
                                : ` · from ${formatDate(booking.pickupAt)}`}
                            </p>
                          ) : (
                            <p className="mt-1 text-sm text-slate-500">
                              <Clock3 className="mr-1 inline h-3.5 w-3.5 text-[#e4bd55]" />
                              {formatDate(booking.pickupAt)} at{" "}
                              {formatTime(booking.pickupAt)}
                              <span className="mx-1 text-slate-300">·</span>
                              {booking.pickupLocation} →{" "}
                              {booking.dropoffLocation}
                            </p>
                          )}

                          {booking.driver && (
                            <p className="mt-1 text-xs text-slate-500">
                              Driver: {booking.driver.name} ·{" "}
                              {booking.driver.phone}
                            </p>
                          )}
                          {booking.vehicle && (
                            <p className="mt-0.5 text-xs text-slate-500">
                              {booking.vehicle.vehicleType}{" "}
                              {booking.vehicle.make ?? ""}{" "}
                              {booking.vehicle.model ?? ""} ·{" "}
                              {booking.vehicle.plateNumber}
                            </p>
                          )}
                        </div>
                      </div>

                      {}
                      <div className="flex flex-col items-end gap-2 ml-auto">
                        <p className="font-serif text-xl font-bold text-[#0b1528] dark:text-white">
                          ETB {Number(booking.priceAmount).toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-400">
                          Payment: {booking.paymentStatus}
                        </p>
                        <div className="flex gap-2">
                          <Link href={`/transportation/booking/${booking.id}`}>
                            <Button
                              size="sm"
                              variant="outline"
                              rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                            >
                              View Details
                            </Button>
                          </Link>
                          {canCancel && (
                            <Button
                              size="sm"
                              variant="ghost"
                              loading={cancelling === booking.id}
                              onClick={() => handleCancel(booking.id)}
                              className="text-red-500 hover:bg-red-50 hover:text-red-600"
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {}
        <div className="mt-12 rounded-3xl bg-[#0b1528] p-8 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-[#e4bd55]">
            Need a ride?
          </p>
          <h2 className="mt-2 font-serif text-2xl font-semibold text-white">
            Ready to book your next trip?
          </h2>
          <p className="mt-2 text-white/65 text-sm">
            Explore all transportation services available on YayeTech.
          </p>
          <Link href="/transportation" className="mt-6 inline-block">
            <Button
              variant="gold"
              size="lg"
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Explore Transportation
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ tab }: { tab: TabKey }) {
  const messages: Record<TabKey, {
    icon: React.ReactNode
    title: string
    sub: string
  }> = {
    upcoming: {
      icon: <Car className="h-12 w-12 text-slate-300" />,
      title: "Your Journey Starts Here",
      sub: "You don't have any upcoming transport bookings yet.",
    },
    active: {
      icon: <Car className="h-12 w-12 text-slate-300" />,
      title: "No active bookings",
      sub: "Active rides and transfers will appear here.",
    },
    completed: {
      icon: <Car className="h-12 w-12 text-slate-300" />,
      title: "No completed trips yet",
      sub: "Completed trips and transfers will appear here.",
    },
    cancelled: {
      icon: <X className="h-12 w-12 text-slate-300" />,
      title: "No cancelled bookings",
      sub: "Cancelled and rejected bookings will appear here.",
    },
  }
  const m = messages[tab]
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl bg-white py-20 text-center shadow-sm dark:bg-slate-900">
      {m.icon}
      <h3 className="mt-4 font-serif text-xl font-semibold text-[#0b1528] dark:text-white">
        {m.title}
      </h3>
      <p className="mt-2 text-sm text-slate-500 max-w-sm">{m.sub}</p>
      <Link href="/transportation" className="mt-6">
        <Button variant="gold">Explore Transportation</Button>
      </Link>
    </div>
  )
}
