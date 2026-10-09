"use client"

import { BellRing, CheckCheck, Inbox, X } from "lucide-react"
import type { Notification } from "@/lib/types"
import { formatDuration } from "./types"
import { useStaffWorkspaceContext } from "./workspace-context"

const minutesSince = (value: string) =>
  (Date.now() - new Date(value).getTime()) / 60000

export function NotificationDrawer() {
  const {
    notifications,
    unreadNotifications,
    notificationsOpen,
    setNotificationsOpen,
    markNotificationRead,
    markAllNotificationsRead,
    t,
    openSection,
  } = useStaffWorkspaceContext()

  if (!notificationsOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <button
        type="button"
        aria-label={t("staff", "btnClose")}
        onClick={() => setNotificationsOpen(false)}
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
      />
      <aside
        aria-label={t("staff", "notificationDrawerLabel")}
        className="relative flex h-full w-full max-w-md flex-col bg-white dark:bg-[#0B132B] shadow-2xl border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right"
      >
        <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-5 py-4">
          <div>
            <h2 className="text-sm font-bold text-[#182333] dark:text-white">
              {t("staff", "notificationDrawerTitle")}
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {t("staff", "notificationUnreadCount", {
                count: unreadNotifications,
              })}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={markAllNotificationsRead}
              className="rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-[#2563EB] hover:bg-[#2563EB]/10 transition-colors"
            >
              {t("staff", "notificationMarkAll")}
            </button>
            <button
              type="button"
              onClick={() => setNotificationsOpen(false)}
              aria-label={t("staff", "btnClose")}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
          {notifications.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
              <Inbox className="h-8 w-8 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                {t("staff", "notificationEmpty")}
              </p>
              <p className="text-xs text-slate-400">
                {t("staff", "notificationEmptyHint")}
              </p>
            </div>
          )}

          {notifications.map((notification) => {
            const unread = !notification.readAt
            const title =
              (typeof notification.payload?.title === "string" &&
                notification.payload.title) ||
              (typeof notification.payload?.message === "string" &&
                notification.payload.message) ||
              notification.type
            const description =
              typeof notification.payload?.body === "string"
                ? notification.payload.body
                : notification.channel
            return (
              <div
                key={notification.id}
                className={`group flex gap-3 px-5 py-4 ${
                  unread ? "bg-[#2563EB]/[0.04]" : ""
                }`}
              >
                <span
                  className={`mt-1 h-8 w-8 shrink-0 rounded-lg flex items-center justify-center ${
                    unread
                      ? "bg-[#2563EB]/15 text-[#2563EB]"
                      : "bg-slate-100 text-slate-400 dark:bg-slate-800"
                  }`}
                >
                  <BellRing className="h-4 w-4" />
                </span>
                <button
                  type="button"
                  onClick={() => markNotificationRead(notification)}
                  className="min-w-0 flex-1 text-left"
                >
                  <span className="block text-xs font-bold text-[#182333] dark:text-white">
                    {title}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-slate-500 dark:text-slate-400">
                    {description}
                  </span>
                  <span className="mt-1 block text-[10px] text-slate-400">
                    {formatDuration(minutesSince(notification.createdAt))}
                  </span>
                </button>
                {unread && (
                  <span
                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#2563EB]"
                    aria-hidden="true"
                  />
                )}
              </div>
            )
          })}
        </div>

        <footer className="border-t border-slate-200 dark:border-slate-800 px-5 py-3">
          <button
            type="button"
            onClick={() => {
              setNotificationsOpen(false)
              openSection("notifications")
            }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0b1528] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#12233a] transition-colors"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            {t("staff", "notificationOpenCenter")}
          </button>
        </footer>
      </aside>
    </div>
  )
}
