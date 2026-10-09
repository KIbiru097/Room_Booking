"use client"

import { useState } from "react"
import { Bell, BellOff, CheckCheck, Inbox } from "lucide-react"
import { useStaffWorkspaceContext } from "../workspace-context"

export function NotificationsSection() {
  const {
    t,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    unreadNotifications,
  } = useStaffWorkspaceContext()
  const [filter, setFilter] = useState<"ALL" | "UNREAD">("ALL")

  const visible = notifications.filter(
    (item) => filter === "ALL" || !item.readAt,
  )

  const titleOf = (payload: unknown, type: string) => {
    const record = payload as { title?: string ;message?: string } | null
    if (record?.title) return record.title
    if (record?.message) return record.message
    return type
  }

  const bodyOf = (payload: unknown) => {
    const record = payload as { message?: string } | null
    return record?.message ?? ""
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#182333] dark:text-white">
            {t("staff", "notificationsTitle")}
          </h1>
          <p className="text-[#64748B] dark:text-slate-400 text-xs sm:text-sm mt-0.5">
            {t("staff", "notificationsSubtitle")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-800 p-1">
            {(["ALL", "UNREAD"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                aria-pressed={filter === value}
                className={`rounded-lg px-3 py-1.5 text-[11px] font-bold transition-colors ${
                  filter === value
                    ? "bg-[#2563EB] text-white"
                    : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                {value === "ALL"
                  ? t("staff", "filterAll")
                  : t("staff", "filterUnread")}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={markAllNotificationsRead}
            disabled={unreadNotifications === 0}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            {t("staff", "notifMarkAllRead")}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        {visible.length === 0 ? (
          <div className="py-16 text-center">
            {filter === "UNREAD" ? (
              <CheckCheck className="mx-auto h-9 w-9 text-emerald-500" />
            ) : (
              <Inbox className="mx-auto h-9 w-9 text-slate-300 dark:text-slate-600" />
            )}
            <p className="mt-3 text-sm font-semibold text-slate-500">
              {filter === "UNREAD"
                ? t("staff", "notifUnreadEmpty")
                : t("staff", "notifEmpty")}
            </p>
            <p className="text-xs text-slate-400">
              {t("staff", "notifEmptyHint")}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {visible.map((item) => {
              const unread = !item.readAt
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => markNotificationRead(item)}
                    className={`flex w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                      unread ? "bg-[#2563EB]/[0.04]" : ""
                    }`}
                  >
                    <span
                      className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                        unread
                          ? "bg-[#2563EB] text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                      }`}
                    >
                      <Bell className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-3">
                        <span className="truncate text-sm font-bold text-[#182333] dark:text-white">
                          {titleOf(item.payload, item.type)}
                        </span>
                        <span className="shrink-0 text-[11px] text-slate-400">
                          {new Date(item.createdAt).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </span>
                      {bodyOf(item.payload) && (
                        <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                          {bodyOf(item.payload)}
                        </span>
                      )}
                      <span className="mt-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {item.channel} · {item.type}
                      </span>
                    </span>
                    {unread && (
                      <span
                        className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#2563EB]"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <p className="flex items-center gap-2 text-[11px] text-slate-400">
        <BellOff className="h-3.5 w-3.5" />
        {t("staff", "notificationsHint", { count: unreadNotifications })}
      </p>
    </div>
  )
}
