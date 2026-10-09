"use client" /* Status and Search Filter Bar */ /* Bookings List Cards */

import { Search, Phone, Calendar, Banknote } from "lucide-react"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { formatDate, formatMoney } from "../types"
import { useStaffWorkspaceContext } from "../workspace-context"

export function ReservationsSection() {
  const {
    t,
    acting,
    bookings,
    statusLabel,
    bookingStatusFilter,
    setBookingStatusFilter,
    bookingDateFilter,
    setBookingDateFilter,
    bookingRoomFilter,
    setBookingRoomFilter,
    bookingSearchQuery,
    setBookingSearchQuery,
    act,
    markCashPaid,
    openNoShowModal,
    setRelocateBooking,
    setRelocateNewRoomId,
    setRejectingBooking,
    setRejectReason,
    setTimeAdjustBooking,
    setWalkInModalOpen,
    setWalkInStep,
  } = useStaffWorkspaceContext()

  const roomOptions = Array.from(
    new Map(
      bookings.flatMap((booking) =>
        (booking.details ?? [])
          .filter((detail) => detail.room?.id && detail.room.roomNumber)
          .map((detail) => [detail.room!.id, detail.room!.roomNumber] as const),
      ),
    ).entries(),
  ).sort((a, b) => a[1].localeCompare(b[1], undefined, { numeric: true }))

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const sameDay = (value: string) => {
    const date = new Date(value)
    date.setHours(0, 0, 0, 0)
    return date.getTime() === today.getTime()
  }
  const beforeToday = (value: string) => new Date(value).getTime() < today.getTime()

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-bold text-[#182333] dark:text-white text-2xl mb-0.5">
              {t("staff", "bookingsTitle")}
            </h1>
            <p className="text-[#64748B] dark:text-slate-400 text-xs sm:text-sm">
              {t("staff", "bookingsSubtitle", { count: bookings.length })}
            </p>
          </div>
          <button
            onClick={() => {
              setWalkInStep(1)
              setWalkInModalOpen(true)
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm"
          >
            {t("staff", "btnWalkIn")}
          </button>
        </div>

        {}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-[#E2E8F0] dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={bookingSearchQuery}
              onChange={(e) => setBookingSearchQuery(e.target.value)}
              placeholder="Search by guest, ref, room, phone..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto">
            {([
              "ALL",
              "PENDING",
              "CONFIRMED",
              "CHECKED_IN",
              "CHECKED_OUT",
              "NO_SHOW",
              "CANCELLED",
              "REJECTED",
            ] as const).map((st) => (
              <button
                key={st}
                onClick={() => setBookingStatusFilter(st)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  bookingStatusFilter === st
                    ? "bg-[#2563EB] text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {statusLabel(st)}
              </button>
            ))}
          </div>

          <div className="flex w-full flex-wrap items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800 md:border-t-0 md:pt-0 md:justify-end">
            <label className="sr-only" htmlFor="staff-booking-date-filter">
              {t("staff", "bookingDateFilterLabel")}
            </label>
            <select
              id="staff-booking-date-filter"
              value={bookingDateFilter}
              onChange={(event) =>
                setBookingDateFilter(
                  event.target.value as typeof bookingDateFilter,
                )
              }
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-600 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <option value="ALL">{t("staff", "bookingDateAll")}</option>
              <option value="TODAY">{t("staff", "bookingDateToday")}</option>
              <option value="UPCOMING">{t("staff", "bookingDateUpcoming")}</option>
              <option value="PAST">{t("staff", "bookingDatePast")}</option>
            </select>

            <label className="sr-only" htmlFor="staff-booking-room-filter">
              {t("staff", "bookingRoomFilterLabel")}
            </label>
            <select
              id="staff-booking-room-filter"
              value={bookingRoomFilter}
              onChange={(event) => setBookingRoomFilter(event.target.value)}
              className="max-w-[180px] rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-600 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <option value="ALL">{t("staff", "bookingRoomAll")}</option>
              {roomOptions.map(([roomId, roomNumber]) => (
                <option key={roomId} value={roomId}>
                  {t("staff", "bookingRoomOption", { room: roomNumber })}
                </option>
              ))}
            </select>
          </div>
        </div>

        {}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E2E8F0] dark:border-slate-800 shadow-xs overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
          {bookings
            .filter((b) => {
              if (
                bookingStatusFilter !== "ALL" &&
                b.status !== bookingStatusFilter
              )
                return false
              if (bookingDateFilter === "TODAY" && !sameDay(b.checkIn))
                return false
              if (
                bookingDateFilter === "UPCOMING" &&
                (beforeToday(b.checkIn) || sameDay(b.checkOut))
              )
                return false
              if (
                bookingDateFilter === "PAST" &&
                !beforeToday(b.checkOut)
              )
                return false
              if (
                bookingRoomFilter !== "ALL" &&
                !(b.details ?? []).some(
                  (detail) => detail.room?.id === bookingRoomFilter,
                )
              )
                return false
              if (bookingSearchQuery.trim()) {
                const q = bookingSearchQuery.toLowerCase()
                const roomTxt =
                  b.details
                    ?.map((d) => `${d.room?.roomNumber} ${d.room?.type}`)
                    .join(" ") || ""
                return [
                  b.id,
                  b.bookingRef,
                  b.user?.fullName,
                  b.user?.phone,
                  roomTxt,
                ].some((v) =>
                  String(v ?? "")
                    .toLowerCase()
                    .includes(q),
                )
              }
              return true
            })
            .map((booking) => (
              <div
                key={booking.id}
                className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div>
                  <div className="font-bold text-sm text-[#182333] dark:text-white flex items-center gap-2">
                    <span>
                      {booking.user?.fullName ||
                        t("staff", "walkInGuestFallback")}
                    </span>
                    <span className="font-mono font-normal text-xs text-slate-400">
                      #{booking.id.slice(-8)}
                    </span>
                  </div>
                  <div className="text-xs text-[#64748B] dark:text-slate-400 mt-1 flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        {formatDate(booking.checkIn)} →{" "}
                        {formatDate(booking.checkOut)}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Banknote className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{formatMoney(booking.totalPrice)}</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        {booking.user?.phone || t("staff", "directWalkIn")}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={booking.status} size="sm" />

                  <button
                    onClick={() => markCashPaid(booking.id)}
                    className="px-3 py-1.5 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    <Banknote className="w-3.5 h-3.5" />{" "}
                    {t("staff", "btnMarkCashPaid")}
                  </button>

                  {booking.status === "PENDING" && (
                    <>
                      <button
                        disabled={acting === booking.id}
                        onClick={() => act(booking.id, "confirm")}
                        className="px-3 py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
                      >
                        {t("staff", "btnConfirm")}
                      </button>
                      <button
                        disabled={acting === booking.id}
                        onClick={() => {
                          setRejectingBooking(booking)
                          setRejectReason("")
                        }}
                        className="px-3 py-1.5 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded-lg text-xs font-semibold hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        {t("staff", "btnReject")}
                      </button>
                    </>
                  )}

                  {booking.status === "CONFIRMED" && (
                    <>
                      <button
                        disabled={acting === booking.id}
                        onClick={() => act(booking.id, "check-in")}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
                      >
                        {t("staff", "btnCheckIn")}
                      </button>
                      <button
                        onClick={() => openNoShowModal(booking)}
                        className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold"
                      >
                        {t("staff", "btnNoShow")}
                      </button>
                      <button
                        onClick={() =>
                          setTimeAdjustBooking({ booking, type: "EARLY_IN" })
                        }
                        className="px-2.5 py-1.5 border border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg text-xs font-semibold"
                      >
                        Early In
                      </button>
                    </>
                  )}

                  {booking.status === "CHECKED_IN" && (
                    <>
                      <button
                        disabled={acting === booking.id}
                        onClick={() => act(booking.id, "check-out")}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
                      >
                        {t("staff", "btnCheckOut")}
                      </button>
                      <button
                        onClick={() => {
                          setRelocateBooking(booking)
                          setRelocateNewRoomId("")
                        }}
                        className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        {t("staff", "btnRelocate")}
                      </button>
                      <button
                        onClick={() =>
                          setTimeAdjustBooking({ booking, type: "LATE_OUT" })
                        }
                        className="px-2.5 py-1.5 border border-indigo-200 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg text-xs font-semibold"
                      >
                        Late Out
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
    </>
  )
}
