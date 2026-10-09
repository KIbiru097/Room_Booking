"use client"

import { useState } from "react"
import {
  History,
  Inbox,
  MessageSquare,
  CalendarCheck2,
  BedDouble,
  Wallet,
  ListTodo,
  User,
} from "lucide-react"
import { formatDuration } from "../types"
import { useStaffWorkspaceContext } from "../workspace-context"

const KIND_ICON = {
  checkin: CalendarCheck2,
  checkout: CalendarCheck2,
  room: BedDouble,
  request: Inbox,
  payment: Wallet,
  message: MessageSquare,
  booking: CalendarCheck2,
  task: ListTodo,
} as const

const FILTERS = [
  "ALL",
  "checkin",
  "checkout",
  "room",
  "request",
  "payment",
  "message",
  "booking",
  "task",
] as const

export function ActivitySection() {
  const { t, ops } = useStaffWorkspaceContext()
  const [filter, setFilter] = useState<typeof FILTERS[number]>("ALL")

  const events = ops.activity.filter(
    (event) => filter === "ALL" || event.kind === filter,
  )
  const minutesSince = (value: string) =>
    Math.max(0, (Date.now() - new Date(value).getTime()) / 60000)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#182333] dark:text-white">
          {t("staff", "activityTitle")}
        </h1>
        <p className="text-[#64748B] dark:text-slate-400 text-xs sm:text-sm mt-0.5">
          {t("staff", "activitySubtitle")}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            aria-pressed={filter === value}
            className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors ${
              filter === value
                ? "bg-[#2563EB] text-white shadow-sm"
                : "border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            {value === "ALL"
              ? t("staff", "filterAll")
              : t(
                  "staff",
                  `activityKind${value.charAt(0).toUpperCase()}${value.slice(1)}`,
                )}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-5">
        {events.length === 0 ? (
          <div className="py-12 text-center">
            <History className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="mt-3 text-sm font-semibold text-slate-500">
              {t("staff", "activityEmpty")}
            </p>
            <p className="text-xs text-slate-400">
              {t("staff", "activityEmptyHint")}
            </p>
          </div>
        ) : (
          <ol className="relative space-y-5 border-l border-slate-200 dark:border-slate-800 pl-6">
            {events.map((event) => {
              const Icon = KIND_ICON[event.kind] ?? History
              return (
                <li key={event.id} className="relative">
                  <span className="absolute -left-[33px] top-0 grid h-6 w-6 place-items-center rounded-full bg-[#2563EB]/12 text-[#2563EB]">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-xs font-bold text-[#182333] dark:text-white">
                      {new Date(event.at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {formatDuration(minutesSince(event.at))}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {event.text}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-400">
                    <User className="h-3 w-3" />
                    {event.actor}
                  </p>
                </li>
              )
            })}
          </ol>
        )}
      </div>
    </div>
  )
}
