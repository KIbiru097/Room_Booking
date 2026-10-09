"use client"

import { useState } from "react"
import {
  ArrowRightLeft,
  Banknote,
  CheckCircle2,
  ClipboardList,
  LogIn,
  LogOut,
  Moon,
  Sunrise,
  UserCheck,
} from "lucide-react"
import { formatMoney } from "../types"
import { useStaffWorkspaceContext } from "../workspace-context"

export function ShiftSection() {
  const {
    t,
    shift,
    startShift,
    endShift,
    updateHandover,
    ops,
    stats,
    bookings,
    selectedHotel,
    localActivity,
  } = useStaffWorkspaceContext()
  const [handoverDraft, setHandoverDraft] = useState(shift.handover)
  const [cashDraft, setCashDraft] = useState(String(shift.collectedCash))

  const active = Boolean(shift.startedAt) && !shift.endedAt
  const completedCheckIns = bookings.filter(
    (booking) => booking.status === "CHECKED_IN",
  ).length
  const completedCheckOuts = bookings.filter(
    (booking) => booking.status === "CHECKED_OUT",
  ).length
  const openTasks = ops.metrics.openTasks
  const completedTasks = ops.tasks.filter(
    (task) => task.status === "COMPLETED",
  ).length
  const urgent = ops.tasks.filter(
    (task) => task.priority === "URGENT" && task.status !== "COMPLETED",
  )
  const cashCollected = Number(cashDraft || 0) || shift.collectedCash

  const summary = [
    {
      label: t("staff", "shiftCheckIns"),
      value: stats.todaysCheckIns || completedCheckIns,
      icon: LogIn,
    },
    {
      label: t("staff", "shiftCheckOuts"),
      value: stats.todaysCheckOuts || completedCheckOuts,
      icon: LogOut,
    },
    {
      label: t("staff", "shiftCash"),
      value: formatMoney(cashCollected),
      icon: Banknote,
    },
    {
      label: t("staff", "shiftTasksCompleted"),
      value: completedTasks,
      icon: CheckCircle2,
    },
    {
      label: t("staff", "shiftOpenTasks"),
      value: openTasks,
      icon: ClipboardList,
    },
    {
      label: t("staff", "shiftMaintenance"),
      value: ops.metrics.maintenanceRooms,
      icon: ArrowRightLeft,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#182333] dark:text-white">
          {t("staff", "shiftTitle")}
        </h1>
        <p className="text-[#64748B] dark:text-slate-400 text-xs sm:text-sm mt-0.5">
          {t("staff", "shiftSubtitle")}
        </p>
      </div>

      <div className="rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="flex flex-col gap-4 bg-gradient-to-r from-[#0b1528] to-[#12233a] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">
              {t("staff", "shiftCurrentProperty")}
            </p>
            <p className="font-serif text-xl font-bold text-white">
              {selectedHotel?.name || t("staff", "switcherNoHotel")}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-white/70">
              {active ? (
                <Sunrise className="h-3.5 w-3.5" />
              ) : (
                <Moon className="h-3.5 w-3.5" />
              )}
              {shift.startedAt
                ? t("staff", "shiftStartedAt", {
                    time: new Date(shift.startedAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    }),
                  })
                : t("staff", "shiftNotStarted")}
              {active && shift.endedAt === null && shift.startedAt ? "" : ""}
            </p>
            {shift.endedAt && (
              <p className="mt-0.5 text-xs text-white/70">
                {t("staff", "shiftEndedAt", {
                  time: new Date(shift.endedAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                })}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            {!active ? (
              <button
                type="button"
                onClick={startShift}
                className="rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-[#0b1528] hover:bg-white/90 transition-colors"
              >
                {t("staff", "shiftActionStart")}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => endShift(handoverDraft, cashCollected)}
                className="rounded-xl bg-rose-500 px-5 py-2.5 text-xs font-bold text-white hover:bg-rose-600 transition-colors"
              >
                {t("staff", "shiftActionEnd")}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3 lg:grid-cols-6">
          {summary.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.label}
                className="rounded-xl border border-slate-100 dark:border-slate-800 p-3"
              >
                <Icon className="h-4 w-4 text-[#2563EB]" />
                <div className="mt-2 text-lg font-bold text-[#182333] dark:text-white">
                  {item.value}
                </div>
                <div className="text-[11px] text-slate-500">{item.label}</div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-5">
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-[#2563EB]" />
            <h2 className="text-sm font-bold text-[#182333] dark:text-white">
              {t("staff", "shiftHandoverTitle")}
            </h2>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            {t("staff", "shiftHandoverHint")}
          </p>

          <ul className="mt-4 space-y-2">
            {urgent.length === 0 && ops.attention.length === 0 && (
              <li className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300">
                {t("staff", "shiftHandoverClear")}
              </li>
            )}
            {urgent.slice(0, 5).map((task) => (
              <li
                key={task.id}
                className="flex items-start gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 px-3 py-2 text-xs text-rose-700 dark:text-rose-300"
              >
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                {task.title}
              </li>
            ))}
            {ops.attention
              .filter((item) => item.level !== "info")
              .slice(0, 5)
              .map((item) => (
                <li
                  key={item.id}
                  className="flex items-start gap-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 px-3 py-2 text-xs text-amber-700 dark:text-amber-300"
                >
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                  {item.title} — {item.detail}
                </li>
              ))}
          </ul>

          <label className="mt-4 block text-xs font-bold text-slate-600 dark:text-slate-300">
            {t("staff", "shiftHandoverLabel")}
            <textarea
              rows={4}
              value={handoverDraft}
              onChange={(event) => setHandoverDraft(event.target.value)}
              placeholder={t("staff", "shiftHandoverPlaceholder")}
              className="mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-3 text-xs outline-none focus:border-[#2563EB]"
            />
          </label>
          <button
            type="button"
            onClick={() => updateHandover(handoverDraft)}
            className="mt-2 rounded-xl bg-[#2563EB] px-4 py-2 text-xs font-bold text-white hover:bg-[#1D4ED8]"
          >
            {t("staff", "btnSave")}
          </button>
        </section>

        <section className="rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-5">
          <div className="flex items-center gap-2">
            <Banknote className="h-4 w-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-[#182333] dark:text-white">
              {t("staff", "shiftSummaryTitle")}
            </h2>
          </div>

          <label className="mt-4 block text-xs font-bold text-slate-600 dark:text-slate-300">
            {t("staff", "shiftCashLabel")}
            <input
              type="number"
              min={0}
              value={cashDraft}
              onChange={(event) => setCashDraft(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-3 text-xs outline-none focus:border-[#2563EB]"
            />
          </label>

          <dl className="mt-4 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {summary.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between py-2"
              >
                <dt className="text-slate-500">{item.label}</dt>
                <dd className="font-bold text-[#182333] dark:text-white">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 text-[11px] text-slate-500">
            {t("staff", "shiftLocalNote", { count: localActivity.length })}
          </div>
        </section>
      </div>
    </div>
  )
}
