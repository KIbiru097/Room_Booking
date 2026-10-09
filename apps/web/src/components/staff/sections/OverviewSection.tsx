"use client"

import React, { useMemo, useState } from "react"
import {
  Sparkles,
  Calendar,
  Banknote,
  Clock,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  BedDouble,
  Search,
  Check,
  LogOut,
  UserCheck,
  ListTodo,
} from "lucide-react"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { formatDate, formatMoney } from "../types"
import type { ActivityEvent } from "../types"
import { useStaffWorkspaceContext } from "../workspace-context"

const ACTIVITY_STYLE: Record<
  ActivityEvent["kind"],
  { icon: typeof Check; color: string }
> = {
  checkin: { icon: UserCheck, color: "text-[#497363]" },
  checkout: { icon: LogOut, color: "text-[#b66c36]" },
  room: { icon: BedDouble, color: "text-[#a47c3b]" },
  request: { icon: ListTodo, color: "text-[#a77c27]" },
  payment: { icon: Banknote, color: "text-[#497363]" },
  message: { icon: Calendar, color: "text-[#77746b]" },
  booking: { icon: Calendar, color: "text-[#a47c3b]" },
  task: { icon: ListTodo, color: "text-[#a74b45]" },
}

export function OverviewSection() {
  const {
    user,
    t,
    setTab,
    acting,
    operationalRooms,
    bookings,
    stats,
    ops,
    openSection,
    act,
    markCashPaid,
    openNoShowModal,
    setRelocateBooking,
    setRelocateNewRoomId,
    setWalkInModalOpen,
    setWalkInStep,
    selectedHotel,
  } = useStaffWorkspaceContext()

  const roomDistribution = useMemo(() => {
    const total = operationalRooms.length
    const occupied = operationalRooms.filter((r) => r.isOccupied).length
    const ready = operationalRooms.filter(
      (r) => !r.isOccupied && r.status === "AVAILABLE",
    ).length
    const cleaning = operationalRooms.filter(
      (r) => !r.isOccupied && r.status === "CLEANING",
    ).length
    const maintenance = operationalRooms.filter(
      (r) => !r.isOccupied && r.status === "MAINTENANCE",
    ).length
    const inspection = operationalRooms.filter(
      (r) => !r.isOccupied && r.status === "UNAVAILABLE",
    ).length
    const pct = (n: number) => (total ? (n / total) * 100 : 0)
    return {
      total,
      occupied,
      ready,
      cleaning,
      maintenance,
      inspection,
      pReady: pct(ready),
      pCleaning: pct(cleaning),
      pInspection: pct(inspection),
      pMaintenance: pct(maintenance),
    }
  }, [operationalRooms])

  const now = new Date()
  const currentTime = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })
  const currentDate = now
    .toLocaleDateString("en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
    })
    .toUpperCase()
  const greetingKey =
    now.getHours() < 12
      ? "greetingMorning"
      : now.getHours() < 18
        ? "greetingAfternoon"
        : "greetingEvening"
  const firstName = user?.fullName?.split(" ")[0] || "Staff"

  const donutStops =
    roomDistribution.total > 0
      ? `conic-gradient(
          #497363 0% ${roomDistribution.pReady}%,
          #a77c27 ${roomDistribution.pReady}% ${roomDistribution.pReady + roomDistribution.pCleaning}%,
          #949b95 ${roomDistribution.pReady + roomDistribution.pCleaning}% ${roomDistribution.pReady + roomDistribution.pCleaning + roomDistribution.pInspection}%,
          #a74b45 ${roomDistribution.pReady + roomDistribution.pCleaning + roomDistribution.pInspection}% ${roomDistribution.pReady + roomDistribution.pCleaning + roomDistribution.pInspection + roomDistribution.pMaintenance}%,
          #343a31 ${roomDistribution.pReady + roomDistribution.pCleaning + roomDistribution.pInspection + roomDistribution.pMaintenance}% 100%
        )`
      : "conic-gradient(#e4e0d7 0% 100%)"

  const legend: Array<{ label: string; value: number; color: string }> = [
    { label: t("staff", "roomStateReady"), value: roomDistribution.ready, color: "#497363" },
    { label: t("staff", "roomStateCleaning"), value: roomDistribution.cleaning, color: "#a77c27" },
    { label: t("staff", "roomStateInspection"), value: roomDistribution.inspection, color: "#949b95" },
    { label: t("staff", "roomStateOccupied"), value: roomDistribution.occupied, color: "#343a31" },
    { label: t("staff", "roomStateMaintenance"), value: roomDistribution.maintenance, color: "#a74b45" },
  ]

  const quickActions: Array<{
    key: string
    icon: React.ReactNode
    onClick: () => void
  }> = [
    {
      key: "quickWalkIn",
      icon: <span className="text-sm font-bold">+</span>,
      onClick: () => {
        setWalkInStep(1)
        setWalkInModalOpen(true)
      },
    },
    {
      key: "quickCheckIn",
      icon: <Check className="w-3.5 h-3.5" />,
      onClick: () => setTab("reservations"),
    },
    {
      key: "quickCheckOut",
      icon: <LogOut className="w-3.5 h-3.5" />,
      onClick: () => setTab("reservations"),
    },
    {
      key: "quickFindBooking",
      icon: <Search className="w-3.5 h-3.5" />,
      onClick: () => setTab("reservations"),
    },
    {
      key: "quickRoomStatus",
      icon: <BedDouble className="w-3.5 h-3.5" />,
      onClick: () => setTab("rooms"),
    },
    {
      key: "quickRecordPayment",
      icon: <Banknote className="w-3.5 h-3.5" />,
      onClick: () => setTab("payments"),
    },
  ]

  return (
    <div className="space-y-6">
      {/* ── 1. WELCOME & OPERATIONS PULSE ROW ────────────────────────────────────── */}
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-2 border-b border-[#e4e0d7] dark:border-[#393a35]">
        <div>
          <span className="text-[#a47c3b] dark:text-[#c09b61] text-[9px] font-bold tracking-[1.8px] uppercase block mb-1">
            {currentDate}
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#24231f] dark:text-[#f0eee7] tracking-tight m-0">
            {t("staff", "dashboardTitle")}
          </h1>
          <p className="text-[#77746b] dark:text-[#aaa79e] text-xs sm:text-sm mt-1.5 m-0">
            <strong className="text-[#24231f] dark:text-[#f0eee7] font-semibold">
              {t("staff", greetingKey, { name: firstName })}
            </strong>{" "}
            {t("staff", "overviewSubtitle", {
              hotel: selectedHotel?.name || "—",
            })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Live Operations Pulse Badge */}
          <div
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#fbfaf7] dark:bg-[#282926] border border-[#e4e0d7] dark:border-[#393a35] shadow-xs"
            aria-label={t("staff", "propertyStatusAria")}
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#497363] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#497363]"></span>
            </span>
            <div className="flex flex-col">
              <small className="text-[7.5px] uppercase font-bold tracking-wider text-[#77746b] dark:text-[#aaa79e] leading-none">
                {t("staff", "pulsePropertyStatus")}
              </small>
              <strong className="text-[10.5px] font-semibold text-[#24231f] dark:text-[#f0eee7] leading-tight">
                {ops.alerts.length > 0
                  ? t("staff", "pulseAlerts")
                  : t("staff", "pulseSmooth")}
              </strong>
            </div>
            <time className="border-l border-[#e4e0d7] dark:border-[#393a35] pl-2 text-[10px] font-mono text-[#77746b] dark:text-[#aaa79e]">
              {currentTime}
            </time>
          </div>

          {/* Operations Copilot AI Button */}
          <button
            type="button"
            onClick={() => setTab("ai")}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-gradient-to-br from-[#2b322c] to-[#1d211d] text-[#eff0ea] border border-[#40483f] shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#ceb379]" />
            <div className="flex flex-col text-left">
              <small className="text-[7.5px] uppercase font-bold tracking-[1.4px] text-[#9c9f98] leading-none">
                {t("staff", "copilotSmall")}
              </small>
              <span className="text-[11px] font-semibold text-white leading-tight">
                {t("staff", "copilotName")}
              </span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-[#ceb379] ml-1" />
          </button>
        </div>
      </section>

      {/* ── 2. METRICS COMMAND STRIP ─────────────────────────────────────────────── */}
      <section className="bg-[#fbfaf7] dark:bg-[#222320] border border-[#e4e0d7] dark:border-[#393a35] rounded-2xl shadow-sm overflow-hidden grid grid-cols-2 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-[#e4e0d7] dark:divide-[#393a35]">
        {/* Occupancy Card (wide) */}
        <div className="col-span-2 md:col-span-2 p-4.5 flex flex-col justify-between hover:bg-[#f0e8d9]/35 dark:hover:bg-[#3a3124]/30 transition-colors">
          <div className="flex items-center justify-between">
            <small className="text-[9px] uppercase font-bold tracking-[1.2px] text-[#77746b] dark:text-[#aaa79e]">
              {t("staff", "metricOccupancy")}
            </small>
            <span className="w-7 h-7 rounded-lg bg-[#f0e8d9] dark:bg-[#3a3124] text-[#a47c3b] flex items-center justify-center">
              <BedDouble className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="my-2">
            <strong className="font-mono text-2xl font-bold text-[#24231f] dark:text-[#f0eee7]">
              {ops.metrics.occupancyPct}%
            </strong>
            <div className="w-full h-1.5 bg-[#e4e0d7] dark:bg-[#393a35] rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-[#a47c3b] rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, ops.metrics.occupancyPct)}%` }}
              />
            </div>
          </div>
          <em className="text-[9px] font-normal text-[#a19d93] not-italic">
            {t("staff", "occupancyOfRooms", {
              occupied: ops.metrics.occupancy,
              total: roomDistribution.total,
            })}
          </em>
        </div>

        {/* Arrivals */}
        <div className="p-4.5 flex flex-col justify-between hover:bg-[#f0e8d9]/35 dark:hover:bg-[#3a3124]/30 transition-colors">
          <small className="text-[9px] uppercase font-bold tracking-[1.2px] text-[#77746b] dark:text-[#aaa79e]">
            {t("staff", "metricArrivals")}
          </small>
          <strong className="font-mono text-2xl font-bold text-[#24231f] dark:text-[#f0eee7] my-1">
            {ops.metrics.arrivals}
          </strong>
          <em className="text-[9px] text-[#497363] dark:text-[#78a692] font-semibold not-italic">
            {t("staff", "metricsAwaiting", {
              count: bookings.filter((b) => b.status === "CONFIRMED").length,
            })}
          </em>
        </div>

        {/* Departures */}
        <div className="p-4.5 flex flex-col justify-between hover:bg-[#f0e8d9]/35 dark:hover:bg-[#3a3124]/30 transition-colors">
          <small className="text-[9px] uppercase font-bold tracking-[1.2px] text-[#77746b] dark:text-[#aaa79e]">
            {t("staff", "metricDepartures")}
          </small>
          <strong className="font-mono text-2xl font-bold text-[#24231f] dark:text-[#f0eee7] my-1">
            {ops.metrics.departures}
          </strong>
          <em className="text-[9px] text-[#b66c36] dark:text-[#dc945f] font-semibold not-italic">
            {t("staff", "metricsInHouse", {
              count: bookings.filter((b) => b.status === "CHECKED_IN").length,
            })}
          </em>
        </div>

        {/* Active Guests */}
        <div className="p-4.5 flex flex-col justify-between hover:bg-[#f0e8d9]/35 dark:hover:bg-[#3a3124]/30 transition-colors">
          <small className="text-[9px] uppercase font-bold tracking-[1.2px] text-[#77746b] dark:text-[#aaa79e]">
            {t("staff", "metricActiveGuests")}
          </small>
          <strong className="font-mono text-2xl font-bold text-[#24231f] dark:text-[#f0eee7] my-1">
            {ops.metrics.activeGuests}
          </strong>
          <em className="text-[9px] text-[#a19d93] not-italic">
            {t("staff", "metricsAcrossRooms", {
              count: ops.metrics.occupancy,
            })}
          </em>
        </div>

        {/* Ready Rooms */}
        <div className="p-4.5 flex flex-col justify-between hover:bg-[#f0e8d9]/35 dark:hover:bg-[#3a3124]/30 transition-colors">
          <small className="text-[9px] uppercase font-bold tracking-[1.2px] text-[#77746b] dark:text-[#aaa79e]">
            {t("staff", "metricReadyRooms")}
          </small>
          <strong className="font-mono text-2xl font-bold text-[#24231f] dark:text-[#f0eee7] my-1">
            {ops.metrics.readyRooms}
          </strong>
          <em className="text-[9px] text-[#497363] dark:text-[#78a692] font-semibold not-italic">
            {t("staff", "metricsCleaningNow", {
              count: ops.metrics.cleaningRooms,
            })}
          </em>
        </div>

        {/* Open Tasks */}
        <div className="p-4.5 flex flex-col justify-between hover:bg-[#f0e8d9]/35 dark:hover:bg-[#3a3124]/30 transition-colors">
          <small className="text-[9px] uppercase font-bold tracking-[1.2px] text-[#77746b] dark:text-[#aaa79e]">
            {t("staff", "metricOpenTasks")}
          </small>
          <strong className="font-mono text-2xl font-bold text-[#24231f] dark:text-[#f0eee7] my-1">
            {ops.metrics.openTasks}
          </strong>
          <em className="text-[9px] text-[#a77c27] font-semibold not-italic">
            {t("staff", "metricsApprovalsFoot", {
              count: stats.pendingApprovals,
            })}
          </em>
        </div>
      </section>

      {/* ── 3. QUICK ACTIONS TOOLBAR ────────────────────────────────────────────── */}
      <section className="bg-[#fbfaf7] dark:bg-[#222320] border border-[#e4e0d7] dark:border-[#393a35] rounded-2xl overflow-hidden shadow-xs grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 divide-x divide-y sm:divide-y-0 divide-[#e4e0d7] dark:divide-[#393a35]">
        <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-[#2d332d] to-[#222722] text-[#f1eee8] p-3.5 flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-[#ceb379] shrink-0" />
          <span className="text-[10px] uppercase font-bold tracking-[0.8px] leading-tight">
            {t("staff", "quickActionsLabel")}
          </span>
        </div>

        {quickActions.map((action) => (
          <button
            key={action.key}
            type="button"
            onClick={action.onClick}
            className="p-3 flex items-center justify-center gap-2 text-xs font-semibold text-[#24231f] dark:text-[#f0eee7] hover:bg-[#f0e8d9] dark:hover:bg-[#3a3124] transition-colors cursor-pointer"
          >
            <span className="w-7 h-7 rounded-lg bg-[#f0eee8] dark:bg-[#30312d] text-[#a47c3b] flex items-center justify-center text-sm font-bold">
              {action.icon}
            </span>
            <span>{t("staff", action.key)}</span>
          </button>
        ))}
      </section>

      {/* ── 4. 2-COLUMN MAIN OPERATIONS DASHBOARD GRID ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: ACTION REQUIRED & TODAY'S ARRIVALS */}
        <div className="lg:col-span-7 space-y-6">
          {/* Needs Attention Panel */}
          <div className="sf-panel rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 sm:p-5 flex items-center justify-between border-b border-[#e4e0d7] dark:border-[#393a35] bg-gradient-to-r from-red-500/5 via-transparent to-transparent">
              <div>
                <span className="text-[8px] font-bold tracking-[1.5px] uppercase text-[#a74b45] dark:text-[#df776d] block mb-0.5">
                  {t("staff", "attentionEyebrow")}
                </span>
                <h2 className="font-serif text-lg font-semibold text-[#24231f] dark:text-[#f0eee7] m-0">
                  {t("staff", "attentionTitle")}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold font-mono text-[#a74b45] dark:text-[#df776d]">
                  {ops.attention.length}
                </span>
                <small className="text-[9px] text-[#77746b] dark:text-[#aaa79e] uppercase font-semibold">
                  {t("staff", "attentionCountFoot")}
                </small>
              </div>
            </div>

            {ops.attention.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle2 className="mx-auto h-8 w-8 text-[#497363]" />
                <p className="mt-2 text-sm font-semibold text-[#77746b] dark:text-[#aaa79e]">
                  {t("staff", "attentionEmpty")}
                </p>
                <p className="mt-1 text-xs text-[#a19d93]">
                  {t("staff", "attentionEmptyHint")}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-[#e4e0d7] dark:divide-[#393a35] m-0 p-0 list-none">
                {ops.attention.map((item) => (
                  <li
                    key={item.id}
                    className="p-4 sm:p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:translate-x-1 hover:bg-[#f0eee8]/40 dark:hover:bg-[#30312d]/30 transition-all"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <span
                        className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                          item.level === "urgent"
                            ? "bg-[#a74b45] shadow-[0_0_0_4px_rgba(167,75,69,0.15)] animate-pulse"
                            : item.level === "attention"
                              ? "bg-[#b66c36] shadow-[0_0_0_4px_rgba(182,108,54,0.15)]"
                              : "bg-[#a77c27] shadow-[0_0_0_4px_rgba(167,124,39,0.15)]"
                        }`}
                      />
                      <div className="min-w-0">
                        <small className="text-[8px] font-bold uppercase tracking-[1px] text-[#a74b45] dark:text-[#df776d]">
                          {item.level.toUpperCase()}
                        </small>
                        <h3 className="text-xs font-bold text-[#24231f] dark:text-[#f0eee7] m-0">
                          {item.title}
                        </h3>
                        <p className="text-[11px] text-[#77746b] dark:text-[#aaa79e] m-0 mt-0.5">
                          {item.detail}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => openSection(item.action.section)}
                      className="shrink-0 rounded-lg border border-[#e4e0d7] dark:border-[#393a35] bg-[#fbfaf7] dark:bg-[#282926] px-3.5 py-1.5 text-[10px] font-bold text-[#24231f] dark:text-[#f0eee7] hover:bg-[#24231f] hover:text-[#fbfaf7] transition-colors cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
                    >
                      <span>{item.actionLabel}</span>
                      <ArrowRight className="w-3 h-3 text-[#a47c3b]" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Today's Arrivals Timeline Feed */}
          <div className="sf-panel rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 sm:p-5 flex items-center justify-between border-b border-[#e4e0d7] dark:border-[#393a35] bg-[#f0eee8]/60 dark:bg-[#30312d]/40">
              <div>
                <span className="text-[8px] font-bold tracking-[1.5px] uppercase text-[#a47c3b] dark:text-[#c09b61] block mb-0.5">
                  {t("staff", "arrivalsEyebrow")}
                </span>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#a47c3b]" />
                  <h2 className="font-serif text-base font-semibold text-[#24231f] dark:text-[#f0eee7] m-0">
                    {t("staff", "todaysArrivalsTitle")}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTab("reservations")}
                className="text-[10px] uppercase font-bold text-[#77746b] dark:text-[#aaa79e] hover:text-[#a47c3b] transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>{t("staff", "viewAll", { count: bookings.length })}</span>
              </button>
            </div>

            <div className="divide-y divide-[#e4e0d7] dark:divide-[#393a35]">
              {bookings.slice(0, 5).map((booking, idx) => (
                <div
                  key={booking.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#f0eee8]/50 dark:hover:bg-[#30312d]/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${
                        idx % 3 === 0
                          ? "bg-[#d7c9b7] text-[#4e4236]"
                          : idx % 3 === 1
                            ? "bg-[#c7d1c9] text-[#3d5145]"
                            : "bg-[#c9ced5] text-[#3e4855]"
                      }`}
                    >
                      {booking.user?.fullName
                        ? booking.user.fullName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                        : "G"}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <strong className="text-xs font-bold text-[#24231f] dark:text-[#f0eee7]">
                          {booking.user?.fullName || "Walk-in Guest"}
                        </strong>
                        <span className="font-mono text-[9px] text-[#a19d93]">
                          #{booking.id.slice(-6)}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#77746b] dark:text-[#aaa79e] mt-0.5 flex items-center gap-2">
                        <span>{formatDate(booking.checkIn)}</span>
                        <span>•</span>
                        <span>{formatMoney(booking.totalPrice)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-auto">
                    <StatusBadge status={booking.status} size="sm" />
                    <button
                      type="button"
                      onClick={() => void markCashPaid(booking.id)}
                      className="px-3 py-1.5 rounded-lg border border-[#497363]/35 text-[#497363] dark:text-[#78a692] text-[10px] font-bold hover:bg-[#497363]/10 transition-colors cursor-pointer"
                    >
                      {t("staff", "btnCashPaid")}
                    </button>
                    {booking.status === "PENDING" && (
                      <>
                        <button
                          type="button"
                          disabled={acting === booking.id}
                          onClick={() => act(booking.id, "confirm")}
                          className="px-3 py-1.5 rounded-lg bg-[#a47c3b] hover:bg-[#8d6a32] text-white text-[10px] font-bold transition-all cursor-pointer"
                        >
                          {t("staff", "btnConfirm")}
                        </button>
                        <button
                          type="button"
                          disabled={acting === booking.id}
                          onClick={() => act(booking.id, "reject")}
                          className="px-3 py-1.5 rounded-lg border border-[#a74b45]/40 text-[#a74b45] dark:text-[#df776d] text-[10px] font-bold hover:bg-[#a74b45]/10 transition-colors cursor-pointer"
                        >
                          {t("staff", "btnReject")}
                        </button>
                      </>
                    )}
                    {booking.status === "CONFIRMED" && (
                      <>
                        <button
                          type="button"
                          disabled={acting === booking.id}
                          onClick={() => act(booking.id, "check-in")}
                          className="px-3 py-1.5 rounded-lg bg-[#497363] hover:bg-[#3d6154] text-white text-[10px] font-bold transition-all cursor-pointer"
                        >
                          {t("staff", "btnCheckIn")}
                        </button>
                        <button
                          type="button"
                          onClick={() => openNoShowModal(booking)}
                          className="px-3 py-1.5 rounded-lg border border-[#e4e0d7] dark:border-[#393a35] text-[#77746b] dark:text-[#aaa79e] text-[10px] font-bold hover:bg-[#f0eee8] dark:hover:bg-[#30312d] transition-colors cursor-pointer"
                        >
                          {t("staff", "btnNoShow")}
                        </button>
                      </>
                    )}
                    {booking.status === "CHECKED_IN" && (
                      <>
                        <button
                          type="button"
                          disabled={acting === booking.id}
                          onClick={() => act(booking.id, "check-out")}
                          className="px-3 py-1.5 rounded-lg bg-[#282d28] hover:bg-[#1e211d] text-white text-[10px] font-bold transition-all cursor-pointer"
                        >
                          {t("staff", "btnCheckOut")}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRelocateBooking(booking)
                            setRelocateNewRoomId("")
                          }}
                          className="px-3 py-1.5 rounded-lg border border-[#e4e0d7] dark:border-[#393a35] text-[#24231f] dark:text-[#f0eee7] text-[10px] font-bold hover:bg-[#f0eee8] dark:hover:bg-[#30312d] transition-colors cursor-pointer"
                        >
                          {t("staff", "btnRelocate")}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ROOM READINESS DONUT & LIVE ACTIVITY */}
        <div className="lg:col-span-5 space-y-6">
          {/* Room Readiness Donut Gauge Panel */}
          <div className="sf-panel rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 sm:p-5 flex items-center justify-between border-b border-[#e4e0d7] dark:border-[#393a35]">
              <div>
                <span className="text-[8px] font-bold tracking-[1.5px] uppercase text-[#a47c3b] dark:text-[#c09b61] block mb-0.5">
                  {t("staff", "readinessEyebrow")}
                </span>
                <h2 className="font-serif text-base font-semibold text-[#24231f] dark:text-[#f0eee7] m-0">
                  {t("staff", "readinessTitle")}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setTab("rooms")}
                className="text-[10px] uppercase font-bold text-[#77746b] dark:text-[#aaa79e] hover:text-[#a47c3b] transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>{t("staff", "readinessOpenRooms")}</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="p-5 flex items-center gap-6">
              {/* Conic Donut Chart */}
              <div
                className="w-28 h-28 shrink-0 rounded-full grid place-items-center relative shadow-sm"
                style={{ background: donutStops }}
              >
                <div className="w-20 h-20 rounded-full bg-[#fbfaf7] dark:bg-[#222320] flex flex-col items-center justify-center z-10">
                  <strong className="font-mono text-xl font-bold text-[#24231f] dark:text-[#f0eee7]">
                    {roomDistribution.total}
                  </strong>
                  <span className="text-[7.5px] font-bold uppercase tracking-wider text-[#77746b] dark:text-[#aaa79e]">
                    {t("staff", "readinessTotal")}
                  </span>
                </div>
              </div>

              {/* Legend */}
              <div className="flex-1 space-y-2">
                {legend.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="flex items-center gap-2 text-[#77746b] dark:text-[#aaa79e]">
                      <i
                        className="w-2 h-2 rounded-full"
                        style={{ background: row.color }}
                      />
                      {row.label}
                    </span>
                    <strong className="font-mono font-bold text-[#24231f] dark:text-[#f0eee7]">
                      {row.value}
                    </strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-5 py-3 border-t border-[#e4e0d7] dark:border-[#393a35] bg-[#f0eee8]/40 dark:bg-[#30312d]/30 flex items-center justify-between text-xs text-[#77746b] dark:text-[#aaa79e]">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#a47c3b]" />
                <span>
                  {t("staff", "readinessEta", {
                    count: roomDistribution.cleaning,
                  })}
                </span>
              </div>
              <ChevronRight className="w-3 h-3 text-[#a19d93]" />
            </div>
          </div>

          {/* Live Activity Timeline Feed */}
          <div className="sf-panel rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 sm:p-5 flex items-center justify-between border-b border-[#e4e0d7] dark:border-[#393a35]">
              <div>
                <span className="text-[8px] font-bold tracking-[1.5px] uppercase text-[#a47c3b] dark:text-[#c09b61] block mb-0.5">
                  {t("staff", "liveActivityEyebrow")}
                </span>
                <h2 className="font-serif text-base font-semibold text-[#24231f] dark:text-[#f0eee7] m-0">
                  {t("staff", "liveActivityTitle")}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setTab("activity")}
                className="text-[10px] uppercase font-bold text-[#77746b] dark:text-[#aaa79e] hover:text-[#a47c3b] transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>{t("staff", "liveActivityOpen")}</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {ops.activity.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#77746b] dark:text-[#aaa79e]">
                {t("staff", "activityEmpty")}
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {ops.activity.slice(0, 5).map((event) => {
                  const style =
                    ACTIVITY_STYLE[event.kind] ?? ACTIVITY_STYLE.task
                  const Icon = style.icon
                  const time = new Date(event.at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                  return (
                    <div key={event.id} className="flex items-start gap-3 text-xs">
                      <time className="w-14 shrink-0 font-mono text-[9px] text-[#a19d93] pt-0.5">
                        {time}
                      </time>
                      <span
                        className={`w-6 h-6 rounded-full bg-[#f0eee8] dark:bg-[#30312d] border border-[#e4e0d7] dark:border-[#393a35] flex items-center justify-center shrink-0 ${style.color}`}
                      >
                        <Icon className="w-3 h-3" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <strong className="block text-[11px] font-bold text-[#24231f] dark:text-[#f0eee7]">
                          {event.text}
                        </strong>
                        <small className="block text-[10px] text-[#77746b] dark:text-[#aaa79e] mt-0.5">
                          {event.actor}
                        </small>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
