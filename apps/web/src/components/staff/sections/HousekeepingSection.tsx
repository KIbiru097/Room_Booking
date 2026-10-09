"use client"

import {
  CheckCircle2,
  ClipboardCheck,
  BedDouble,
  DoorOpen,
  Sparkles,
  Timer,
} from "lucide-react"
import type { OperationalRoom } from "@/lib/types"
import { useStaffWorkspaceContext } from "../workspace-context"

interface Lane {
  key: string
  titleKey: string
  icon: typeof Sparkles
  tone: string
  rooms: OperationalRoom[]
}

export function HousekeepingSection() {
  const {
    t,
    operationalRooms,
    handleUpdateRoomStatus,
    updatingRoomId,
    roomTypeLabel,
    openSection,
  } = useStaffWorkspaceContext()

  const turnoverPending = (room: OperationalRoom) => {
    if (room.isOccupied || room.status !== "AVAILABLE") return false
    if (!room.checkOutDate) return false
    const delta = Date.now() - new Date(room.checkOutDate).getTime()
    return delta >= 0 && delta < 48 * 60 * 60 * 1000
  }

  const lanes: Lane[] = [
    {
      key: "queue",
      titleKey: "hkLaneQueue",
      icon: Timer,
      tone: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40",
      rooms: operationalRooms.filter(turnoverPending),
    },
    {
      key: "cleaning",
      titleKey: "hkLaneCleaning",
      icon: Sparkles,
      tone: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40",
      rooms: operationalRooms.filter((room) => room.status === "CLEANING"),
    },
    {
      key: "inspection",
      titleKey: "hkLaneInspection",
      icon: ClipboardCheck,
      tone: "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40",
      rooms: operationalRooms.filter((room) => room.status === "UNAVAILABLE"),
    },
    {
      key: "ready",
      titleKey: "hkLaneReady",
      icon: CheckCircle2,
      tone: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40",
      rooms: operationalRooms.filter(
        (room) =>
          room.status === "AVAILABLE" &&
          !room.isOccupied &&
          !turnoverPending(room),
      ),
    },
    {
      key: "occupied",
      titleKey: "hkLaneOccupied",
      icon: BedDouble,
      tone: "text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800",
      rooms: operationalRooms.filter((room) => room.isOccupied),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#182333] dark:text-white">
            {t("staff", "housekeepingWorkspaceTitle")}
          </h1>
          <p className="text-[#64748B] dark:text-slate-400 text-xs sm:text-sm mt-0.5">
            {t("staff", "housekeepingWorkspaceSubtitle")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => openSection("rooms")}
          className="self-start rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-xs font-bold text-[#2563EB] hover:bg-[#2563EB]/10"
        >
          {t("staff", "housekeepingOpenBoard")}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {lanes.map((lane) => {
          const Icon = lane.icon
          return (
            <section
              key={lane.key}
              className="rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs"
            >
              <header className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-4 py-3">
                <span className="flex items-center gap-2 text-xs font-bold text-[#182333] dark:text-white">
                  <span
                    className={`grid h-7 w-7 place-items-center rounded-lg ${lane.tone}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  {t("staff", lane.titleKey)}
                </span>
                <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                  {lane.rooms.length}
                </span>
              </header>

              <ul className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto">
                {lane.rooms.length === 0 && (
                  <li className="px-4 py-6 text-center text-xs text-slate-400">
                    {t("staff", "hkLaneEmpty")}
                  </li>
                )}
                {lane.rooms.map((room) => (
                  <li key={room.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#182333] dark:text-white">
                          {t("staff", "roomNumberLabel", {
                            number: room.roomNumber,
                          })}
                        </p>
                        <p className="truncate text-[11px] text-slate-500">
                          {roomTypeLabel(room.type)}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">
                          <span className="font-semibold text-slate-600 dark:text-slate-300">
                            {t("staff", "hkGuestLabel")}
                          </span>{" "}
                          {room.currentGuest || t("staff", "hkNoGuest")}
                        </p>
                        {room.checkOutDate && (
                          <p className="flex items-center gap-1 text-[11px] text-slate-400">
                            <DoorOpen className="h-3 w-3" />
                            {t("staff", "hkCheckoutLabel")}{" "}
                            {new Date(room.checkOutDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-col gap-1.5">
                        {lane.key === "queue" && (
                          <button
                            type="button"
                            disabled={updatingRoomId === room.id}
                            onClick={() =>
                              void handleUpdateRoomStatus(room.id, "CLEANING")
                            }
                            className="rounded-lg bg-[#2563EB] px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-[#1D4ED8] disabled:opacity-60"
                          >
                            {t("staff", "hkActionStartCleaning")}
                          </button>
                        )}
                        {(lane.key === "cleaning" ||
                          lane.key === "inspection") && (
                          <button
                            type="button"
                            disabled={updatingRoomId === room.id}
                            onClick={() =>
                              void handleUpdateRoomStatus(room.id, "AVAILABLE")
                            }
                            className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                          >
                            {lane.key === "inspection"
                              ? t("staff", "hkActionMarkReady")
                              : t("staff", "hkActionComplete")}
                          </button>
                        )}
                        {lane.key !== "occupied" && (
                          <button
                            type="button"
                            disabled={updatingRoomId === room.id}
                            onClick={() =>
                              void handleUpdateRoomStatus(
                                room.id,
                                "MAINTENANCE",
                              )
                            }
                            className="rounded-lg border border-rose-200 dark:border-rose-900 px-2.5 py-1.5 text-[11px] font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 disabled:opacity-60"
                          >
                            {t("staff", "hkActionReport")}
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>
    </div>
  )
}
