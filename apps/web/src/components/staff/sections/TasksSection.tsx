"use client"

import { useState } from "react"
import {
  CheckCircle2,
  CircleDashed,
  Clock,
  Flame,
  Loader2,
  PlayCircle,
  Plus,
  Search,
  UserCheck,
} from "lucide-react"
import { formatDuration } from "../types"
import { useStaffWorkspaceContext } from "../workspace-context"

const PRIORITY_TONE: Record<string, string> = {
  URGENT:
    "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50",
  TODAY:
    "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50",
  UPCOMING:
    "text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-900/50",
}

const COLUMNS: Array<{
  key: "URGENT" | "TODAY" | "COMPLETED"
  titleKey: string
}> = [
  { key: "URGENT", titleKey: "tasksColumnUrgent" },
  { key: "TODAY", titleKey: "tasksColumnToday" },
  { key: "COMPLETED", titleKey: "tasksColumnCompleted" },
]

export function TasksSection() {
  const {
    t,
    ops,
    setTaskStatus,
    reassignTask,
    openSection,
    refresh,
    setError,
  } = useStaffWorkspaceContext()
  const [query, setQuery] = useState("")
  const [assignFor, setAssignFor] = useState<string | null>(null)

  const filtered = ops.tasks.filter((task) => {
    if (!query.trim()) return true
    const haystack =
      `${task.title} ${task.detail} ${task.room ?? ""} ${task.guest ?? ""} ${task.assignedTo}`.toLowerCase()
    return haystack.includes(query.toLowerCase())
  })

  const columns = {
    URGENT: filtered.filter(
      (task) => task.priority === "URGENT" && task.status !== "COMPLETED",
    ),
    TODAY: filtered.filter(
      (task) => task.priority !== "URGENT" && task.status !== "COMPLETED",
    ),
    COMPLETED: filtered.filter((task) => task.status === "COMPLETED"),
  }

  const minutesSince = (value: string) =>
    Math.max(0, (Date.now() - new Date(value).getTime()) / 60000)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#182333] dark:text-white">
            {t("staff", "tasksTitle")}
          </h1>
          <p className="text-[#64748B] dark:text-slate-400 text-xs sm:text-sm mt-0.5">
            {t("staff", "tasksSubtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("staff", "tasksSearchPlaceholder")}
              aria-label={t("staff", "tasksSearchPlaceholder")}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 pl-8 pr-3 text-xs outline-none focus:border-[#2563EB]"
            />
          </div>
          <button
            type="button"
            onClick={() => void refresh()}
            className="rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            {t("staff", "btnRefresh")}
          </button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {COLUMNS.map((column) => {
          const items = columns[column.key]
          return (
            <section key={column.key} className="min-w-0">
              <header className="mb-3 flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                  {t("staff", column.titleKey)}
                </h2>
                <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                  {items.length}
                </span>
              </header>

              <div className="space-y-3">
                {items.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center">
                    <CheckCircle2 className="mx-auto h-6 w-6 text-slate-300 dark:text-slate-600" />
                    <p className="mt-2 text-xs font-semibold text-slate-500">
                      {t("staff", "tasksColumnEmpty")}
                    </p>
                  </div>
                )}

                {items.map((task) => {
                  const started = task.status === "IN_PROGRESS"
                  return (
                    <article
                      key={task.id}
                      className="rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${PRIORITY_TONE[task.priority]}`}
                            >
                              {task.priority === "URGENT" ? (
                                <span className="inline-flex items-center gap-1">
                                  <Flame className="h-3 w-3" />
                                  {t("staff", "priorityUrgent")}
                                </span>
                              ) : task.priority === "TODAY" ? (
                                t("staff", "priorityToday")
                              ) : (
                                t("staff", "priorityUpcoming")
                              )}
                            </span>
                            <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                              {t("staff", `taskType${task.type}`)}
                            </span>
                          </div>
                          <h3 className="mt-2 text-sm font-bold text-[#182333] dark:text-white">
                            {task.title}
                          </h3>
                          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            {task.detail}
                          </p>
                        </div>
                        {task.status === "COMPLETED" && (
                          <CheckCircle2
                            className="h-5 w-5 shrink-0 text-emerald-500"
                            aria-label={t("staff", "taskStatusCompleted")}
                          />
                        )}
                        {started && (
                          <Loader2
                            className="h-5 w-5 shrink-0 animate-spin text-[#2563EB]"
                            aria-label={t("staff", "taskStatusInProgress")}
                          />
                        )}
                      </div>

                      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Clock className="h-3 w-3" />
                          <span>
                            {formatDuration(minutesSince(task.createdAt))}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <UserCheck className="h-3 w-3" />
                          <span className="truncate">{task.assignedTo}</span>
                        </div>
                        {task.room && (
                          <div className="text-slate-500">
                            <span className="font-bold text-slate-700 dark:text-slate-300">
                              {t("staff", "taskRoomLabel")}{" "}
                            </span>
                            {task.room}
                          </div>
                        )}
                        {task.guest && (
                          <div className="truncate text-slate-500">
                            <span className="font-bold text-slate-700 dark:text-slate-300">
                              {t("staff", "taskGuestLabel")}{" "}
                            </span>
                            {task.guest}
                          </div>
                        )}
                      </dl>

                      <div className="mt-3 flex flex-wrap gap-1.5 border-t border-slate-100 dark:border-slate-800 pt-3">
                        {task.status === "OPEN" && (
                          <button
                            type="button"
                            onClick={() =>
                              setTaskStatus(task.id, "IN_PROGRESS")
                            }
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#2563EB] px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-[#1D4ED8]"
                          >
                            <PlayCircle className="h-3.5 w-3.5" />
                            {t("staff", "taskActionStart")}
                          </button>
                        )}
                        {task.status !== "COMPLETED" && (
                          <button
                            type="button"
                            onClick={() => setTaskStatus(task.id, "COMPLETED")}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {t("staff", "taskActionComplete")}
                          </button>
                        )}
                        {task.status === "COMPLETED" && (
                          <button
                            type="button"
                            onClick={() => setTaskStatus(task.id, "OPEN")}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                          >
                            <CircleDashed className="h-3.5 w-3.5" />
                            {t("staff", "taskActionReopen")}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            setAssignFor(assignFor === task.id ? null : task.id)
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          {t("staff", "taskActionReassign")}
                        </button>
                        {task.bookingId && (
                          <button
                            type="button"
                            onClick={() => openSection("reservations")}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                          >
                            {t("staff", "taskActionOpenBooking")}
                          </button>
                        )}
                      </div>

                      {assignFor === task.id && (
                        <div className="mt-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3">
                          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                            {t("staff", "taskActionReassign")}
                            <select
                              autoFocus
                              defaultValue={task.assignedTo}
                              onChange={(event) => {
                                reassignTask(task.id, event.target.value)
                                setAssignFor(null)
                              }}
                              className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-xs"
                            >
                              {[
                                "Front desk",
                                "Housekeeping",
                                "Maintenance",
                                "Concierge",
                                "Cashier",
                              ].map((role) => (
                                <option key={role} value={role}>
                                  {role}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                      )}
                    </article>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>

      {filtered.length === 0 && query && (
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center text-sm text-slate-500">
          {t("staff", "tasksNoMatch", { query })}
          <button
            type="button"
            onClick={() => {
              setQuery("")
              setError("")
            }}
            className="ml-2 font-bold text-[#2563EB] hover:underline"
          >
            {t("staff", "btnClearFilters")}
          </button>
        </div>
      )}
    </div>
  )
}
