"use client" /* Strict Staff Boundary Banner */ /* Transactions Ledger Cards */

import { AlertCircle, Banknote } from "lucide-react"
import { formatDate, formatMoney } from "../types"
import { useStaffWorkspaceContext } from "../workspace-context"

type FrontDeskPaymentState = "PAID" | "PARTIALLY_PAID" | "UNPAID" | "PENDING"

function paymentState(booking: {
  totalPrice: number | string
  status: string
  payment?: { status?: string; amount?: number | string | null } | null
}): FrontDeskPaymentState {
  const paymentStatus = booking.payment?.status?.toUpperCase()
  const amount = Number(booking.payment?.amount ?? 0)
  const total = Number(booking.totalPrice ?? 0)

  if (paymentStatus === "SUCCEEDED" || paymentStatus === "PAID") {
    if (amount > 0 && total > 0 && amount < total) return "PARTIALLY_PAID"
    return "PAID"
  }
  if (paymentStatus === "PENDING" || paymentStatus === "PROCESSING")
    return "PENDING"
  if (paymentStatus === "FAILED" || paymentStatus === "REFUNDED")
    return "UNPAID"
  if (booking.status === "CONFIRMED" || booking.status === "CHECKED_IN")
    return "PAID"
  return "UNPAID"
}

export function PaymentsSection() {
  const {
    t,
    bookings,
    markCashPaid,
    statusLabel,
    paymentStatusFilter,
    setPaymentStatusFilter,
  } = useStaffWorkspaceContext()

  const visibleBookings = bookings.filter((booking) => {
    if (paymentStatusFilter === "ALL") return true
    return paymentState(booking) === paymentStatusFilter
  })

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-bold text-[#182333] dark:text-white text-2xl mb-1">
              {t("staff", "paymentsTitle")}
            </h1>
            <p className="text-[#64748B] dark:text-slate-400 text-xs sm:text-sm">
              {t("staff", "paymentsSubtitle")}
            </p>
          </div>
        </div>

        {}
        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>{t("staff", "paymentsNoRefundNotice")}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {[
            ["ALL", t("staff", "paymentsFilterAll")],
            ["PAID", t("staff", "paymentsFilterPaid")],
            ["PARTIALLY_PAID", t("staff", "paymentsFilterPartial")],
            ["UNPAID", t("staff", "paymentsFilterUnpaid")],
            ["PENDING", t("staff", "statusPending")],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setPaymentStatusFilter(value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                paymentStatusFilter === value
                  ? "bg-[#497363] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E2E8F0] dark:border-slate-800 shadow-xs overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
          {visibleBookings.map((booking) => {
            const state = paymentState(booking)
            const stateClass =
              state === "PAID"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : state === "PARTIALLY_PAID"
                  ? "bg-sky-50 text-sky-700 border-sky-200"
                  : state === "PENDING"
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-slate-100 text-slate-600 border-slate-200"
            return (
            <div
              key={booking.id}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div>
                <div className="font-bold text-sm text-[#182333] dark:text-white flex items-center gap-2">
                  <span>
                    {booking.user?.fullName ||
                      t("staff", "walkInGuestFallback")}
                  </span>
                  <span className="font-mono text-xs text-slate-400">
                    #{booking.id.slice(-8)}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                  <span>Stay: {formatDate(booking.checkIn)}</span>
                  <span>·</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatMoney(booking.totalPrice)}
                  </span>
                  {booking.payment?.method && (
                    <span className="uppercase tracking-wide">
                      {booking.payment.method}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${stateClass}`}>
                  {statusLabel(state)}
                </span>
                {state !== "PAID" && (
                  <button
                    onClick={() => markCashPaid(booking.id)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    <span>{t("staff", "paymentsCashReceivedBtn")}</span>
                  </button>
                )}
              </div>
            </div>
            )
          })}
          {visibleBookings.length === 0 && (
            <div className="p-10 text-center text-xs text-slate-500 dark:text-slate-400">
              {t("staff", "paymentsEmptyFilter")}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
