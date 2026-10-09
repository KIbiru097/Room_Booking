"use client" /* Success card */ /* Gold top accent */ /* Checkmark */ /* Reference */ /* Details */ /* Actions */ /* What's next */

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import {
  ArrowRight,
  CalendarCheck,
  Car,
  CheckCircle2,
  MapPin,
  Share2,
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"

function ConfirmationContent() {
  const params = useSearchParams()
  const ref =
    params.get("ref") ?? "YT-TR-" + Math.floor(10000 + Math.random() * 90000)
  const service = params.get("service") ?? "Transportation"
  const date = params.get("date") ?? new Date().toLocaleDateString()
  const from = params.get("from") ?? "Pickup location"
  const to = params.get("to") ?? "Destination"
  const amount = params.get("amount") ?? "850"

  return (
    <div className="min-h-screen bg-[#f3efe5] dark:bg-[#07111f] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {}
        <div className="rounded-3xl border border-[#e4bd55]/30 bg-white shadow-xl dark:bg-slate-900 overflow-hidden">
          {}
          <div className="h-2 bg-gradient-to-r from-[#e4bd55] to-[#9b7428]" />

          <div className="p-8 text-center">
            {}
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 ring-8 ring-emerald-50/50 dark:bg-emerald-900/20 dark:ring-emerald-900/10">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            </div>

            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#e4bd55]">
              Booking confirmed
            </p>
            <h1 className="mt-2 font-serif text-3xl font-semibold text-[#0b1528] dark:text-white">
              Your Transportation is Confirmed
            </h1>
            <p className="mt-3 text-slate-500">
              Your booking has been received and is awaiting partner
              confirmation. You'll receive a notification shortly.
            </p>

            {}
            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#FEF9E7] px-4 py-2 text-sm font-bold text-[#0b1528]">
              <span className="text-[#e4bd55]">REF:</span>
              <span className="font-mono">{ref}</span>
            </div>
          </div>

          {}
          <div className="border-t border-slate-100 dark:border-slate-800 px-8 py-6 space-y-3">
            <ConfRow
              icon={<Car className="h-4 w-4 text-[#e4bd55]" />}
              label="Service"
              value={service}
            />
            <ConfRow
              icon={<CalendarCheck className="h-4 w-4 text-[#e4bd55]" />}
              label="Date"
              value={date}
            />
            <ConfRow
              icon={<MapPin className="h-4 w-4 text-emerald-500" />}
              label="From"
              value={from}
            />
            <ConfRow
              icon={<MapPin className="h-4 w-4 text-[#e4bd55]" />}
              label="To"
              value={to}
            />
            <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
              <span className="font-semibold text-[#0b1528] dark:text-white">
                Total paid
              </span>
              <span className="font-serif text-xl font-bold text-[#0b1528] dark:text-white">
                ETB {Number(amount).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Payment status</span>
              <Badge variant="warning" size="sm">
                Pending confirmation
              </Badge>
            </div>
          </div>

          {}
          <div className="border-t border-slate-100 dark:border-slate-800 px-8 pb-8 pt-5 space-y-3">
            <Link href="/transportation/my-bookings" className="block">
              <Button
                variant="gold"
                size="lg"
                className="w-full"
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                View My Transportation
              </Button>
            </Link>
            <Link href="/trips" className="block">
              <Button variant="outline" size="lg" className="w-full">
                Add to My Trip
              </Button>
            </Link>
            <button
              onClick={() => {
                const url = window.location.href
                navigator.clipboard
                  ?.writeText(url)
                  .then(() => alert("Link copied!"))
                  .catch(() => {})
              }}
              className="flex w-full items-center justify-center gap-2 text-sm font-medium text-slate-400 hover:text-[#0b1528] transition-colors"
            >
              <Share2 className="h-4 w-4" /> Share booking details
            </button>
          </div>
        </div>

        {}
        <div className="mt-6 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-[#e4bd55]">
            What happens next?
          </p>
          <div className="space-y-3">
            {[
              {
                step: "1",
                text: "Our partner will review and confirm your booking within 1 hour.",
              },
              {
                step: "2",
                text: "You'll receive an SMS and app notification with driver details.",
              },
              {
                step: "3",
                text: "Your driver will arrive at the pickup location at the scheduled time.",
              },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#e4bd55]/15 text-xs font-bold text-[#e4bd55]">
                  {item.step}
                </span>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function ConfRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <div className="flex items-center gap-2 text-slate-500 shrink-0">
        {icon}
        {label}
      </div>
      <span className="text-right font-medium text-[#0b1528] dark:text-white max-w-[60%] truncate">
        {value}
      </span>
    </div>
  )
}

export default function ConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#e4bd55] border-t-transparent" />
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  )
}
