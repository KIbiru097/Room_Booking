"use client" /* KPI Filter Cards */ /* Room lifecycle strip (spec §6) */ /* Filter & Search Bar */ /* Room Status Cards Grid */

import {
  ArrowRight,
  Sparkles,
  BedDouble,
  Wrench,
  CheckCircle2,
  RefreshCw,
  Search,
  User,
  Phone,
  DoorOpen,
  Filter,
  Users,
} from "lucide-react"
import { formatDate, formatMoney } from "../types"
import { useStaffWorkspaceContext } from "../workspace-context"

export function RoomsSection() {
  const {
    t,
    selectedHotelId,
    selectedHotel,
    operationalRooms,
    roomsLoading,
    roomTypeLabel,
    statusFilter,
    setStatusFilter,
    roomSearchQuery,
    setRoomSearchQuery,
    handleUpdateRoomStatus,
    updatingRoomId,
    refresh,
    ops,
  } = useStaffWorkspaceContext()

  const roomFilterLabels: Record<string, string> = {
    ALL: t("staff", "filterAll"),
    AVAILABLE: t("staff", "kpiAvailable"),
    CLEANING: t("staff", "kpiCleaning"),
    MAINTENANCE: t("staff", "kpiMaintenance"),
    OCCUPIED: t("staff", "kpiOccupied"),
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#182333] dark:text-white flex items-center gap-2">
              <span>{t("staff", "housekeepingTitle")}</span>
            </h1>
            <p className="text-[#64748B] dark:text-slate-400 text-xs sm:text-sm mt-0.5">
              {t("staff", "housekeepingSubtitle")}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              {selectedHotel?.name}
            </span>
            <button
              onClick={() => void refresh()}
              disabled={roomsLoading}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-[#182333] dark:text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  roomsLoading ? "animate-spin text-blue-600" : "text-slate-500"
                }`}
              />
              <span>{t("staff", "btnRefresh")}</span>
            </button>
          </div>
        </div>

        {}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`p-4 rounded-2xl border text-left transition-all ${
              statusFilter === "ALL"
                ? "bg-[#0b1528] text-white border-[#0b1528] shadow-md ring-2 ring-[#e4bd55]/30"
                : "bg-white dark:bg-slate-900 text-[#182333] dark:text-white border-[#E2E8F0] dark:border-slate-800 hover:border-slate-300 shadow-xs"
            }`}
          >
            <div className="text-[11px] font-semibold uppercase tracking-wider opacity-75">
              {t("staff", "kpiAllRooms")}
            </div>
            <div className="text-2xl font-bold mt-1">
              {operationalRooms.length}
            </div>
            <div className="text-[11px] opacity-70 mt-0.5">
              {t("staff", "kpiTotalInventory")}
            </div>
          </button>

          <button
            onClick={() => setStatusFilter("AVAILABLE")}
            className={`p-4 rounded-2xl border text-left transition-all ${
              statusFilter === "AVAILABLE"
                ? "bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-400/30"
                : "bg-white dark:bg-slate-900 text-[#182333] dark:text-white border-[#E2E8F0] dark:border-slate-800 hover:border-emerald-300 shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider">
              <span
                className={
                  statusFilter === "AVAILABLE"
                    ? "text-white"
                    : "text-emerald-700 dark:text-emerald-400"
                }
              >
                {t("staff", "kpiAvailable")}
              </span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold mt-1">
              {
                operationalRooms.filter(
                  (r) => r.status === "AVAILABLE" && !r.isOccupied,
                ).length
              }
            </div>
            <div className="text-[11px] opacity-70 mt-0.5">
              {t("staff", "kpiAvailableCaption")}
            </div>
          </button>

          <button
            onClick={() => setStatusFilter("CLEANING")}
            className={`p-4 rounded-2xl border text-left transition-all ${
              statusFilter === "CLEANING"
                ? "bg-amber-500 text-white border-amber-500 shadow-md ring-2 ring-amber-300/30"
                : "bg-white dark:bg-slate-900 text-[#182333] dark:text-white border-[#E2E8F0] dark:border-slate-800 hover:border-amber-300 shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider">
              <span
                className={
                  statusFilter === "CLEANING"
                    ? "text-white"
                    : "text-amber-700 dark:text-amber-400"
                }
              >
                {t("staff", "kpiCleaning")}
              </span>
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="text-2xl font-bold mt-1">
              {operationalRooms.filter((r) => r.status === "CLEANING").length}
            </div>
            <div className="text-[11px] opacity-70 mt-0.5">
              {t("staff", "kpiCleaningCaption")}
            </div>
          </button>

          <button
            onClick={() => setStatusFilter("MAINTENANCE")}
            className={`p-4 rounded-2xl border text-left transition-all ${
              statusFilter === "MAINTENANCE"
                ? "bg-rose-600 text-white border-rose-600 shadow-md ring-2 ring-rose-300/30"
                : "bg-white dark:bg-slate-900 text-[#182333] dark:text-white border-[#E2E8F0] dark:border-slate-800 hover:border-rose-300 shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider">
              <span
                className={
                  statusFilter === "MAINTENANCE"
                    ? "text-white"
                    : "text-rose-700 dark:text-rose-400"
                }
              >
                {t("staff", "kpiMaintenance")}
              </span>
              <Wrench className="w-3.5 h-3.5 text-rose-500" />
            </div>
            <div className="text-2xl font-bold mt-1">
              {
                operationalRooms.filter((r) => r.status === "MAINTENANCE")
                  .length
              }
            </div>
            <div className="text-[11px] opacity-70 mt-0.5">
              {t("staff", "kpiMaintenanceCaption")}
            </div>
          </button>

          <button
            onClick={() => setStatusFilter("OCCUPIED")}
            className={`p-4 rounded-2xl border text-left transition-all ${
              statusFilter === "OCCUPIED"
                ? "bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-300/30"
                : "bg-white dark:bg-slate-900 text-[#182333] dark:text-white border-[#E2E8F0] dark:border-slate-800 hover:border-indigo-300 shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider">
              <span
                className={
                  statusFilter === "OCCUPIED"
                    ? "text-white"
                    : "text-indigo-700 dark:text-indigo-400"
                }
              >
                {t("staff", "kpiOccupied")}
              </span>
              <User className="w-3.5 h-3.5 text-indigo-500" />
            </div>
            <div className="text-2xl font-bold mt-1">
              {operationalRooms.filter((r) => r.isOccupied).length}
            </div>
            <div className="text-[11px] opacity-70 mt-0.5">
              {t("staff", "kpiOccupiedCaption")}
            </div>
          </button>
        </div>

        {}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E2E8F0] dark:border-slate-800 shadow-xs p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t("staff", "lifecycleTitle")}
            </span>
            <span className="text-[11px] text-slate-400">
              {t("staff", "lifecycleHint")}
            </span>
          </div>

          {(() => {
            const turnover = operationalRooms.filter((room) => {
              if (
                room.isOccupied ||
                room.status !== "AVAILABLE" ||
                !room.checkOutDate
              )
                return false
              const delta = Date.now() - new Date(room.checkOutDate).getTime()
              return delta >= 0 && delta < 48 * 60 * 60 * 1000
            }).length

            const stages = [
              {
                key: "checkout",
                label: t("staff", "lifecycleCheckout"),
                count: ops.metrics.departures,
                tone: "text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800",
                filter: null,
              },
              {
                key: "dirty",
                label: t("staff", "lifecycleDirty"),
                count: turnover,
                tone: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40",
                filter: "AVAILABLE" as const,
              },
              {
                key: "cleaning",
                label: t("staff", "lifecycleCleaning"),
                count: ops.metrics.cleaningRooms,
                tone: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40",
                filter: "CLEANING" as const,
              },
              {
                key: "inspection",
                label: t("staff", "lifecycleInspection"),
                count: operationalRooms.filter(
                  (room) => room.status === "UNAVAILABLE",
                ).length,
                tone: "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40",
                filter: null,
              },
              {
                key: "ready",
                label: t("staff", "lifecycleReady"),
                count: ops.metrics.readyRooms,
                tone: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40",
                filter: "AVAILABLE" as const,
              },
              {
                key: "occupied",
                label: t("staff", "lifecycleOccupied"),
                count: ops.metrics.occupancy,
                tone: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40",
                filter: "OCCUPIED" as const,
              },
            ]

            return (
              <ol className="flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-0">
                {stages.map((stage, index) => (
                  <li key={stage.key} className="flex items-stretch sm:flex-1">
                    <button
                      type="button"
                      disabled={!stage.filter}
                      onClick={() =>
                        stage.filter && setStatusFilter(stage.filter)
                      }
                      aria-label={`${stage.label}: ${stage.count}`}
                      className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition-colors sm:flex-col sm:items-start sm:gap-1 ${
                        stage.filter
                          ? "hover:ring-1 hover:ring-[#2563EB]/40"
                          : "cursor-default"
                      }`}
                    >
                      <span
                        className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[11px] font-bold ${stage.tone}`}
                      >
                        {stage.count}
                      </span>
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                        {stage.label}
                      </span>
                    </button>
                    {index < stages.length - 1 && (
                      <span
                        className="hidden items-center px-1 text-slate-300 dark:text-slate-600 sm:flex"
                        aria-hidden="true"
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            )
          })()}

          <div className="mt-3 flex items-center justify-between rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/70 dark:bg-rose-950/30 px-3 py-2">
            <span className="flex items-center gap-2 text-[11px] font-bold text-rose-600 dark:text-rose-300">
              <Wrench className="h-3.5 w-3.5" />
              {t("staff", "lifecycleMaintenanceBranch")}
            </span>
            <button
              type="button"
              onClick={() => setStatusFilter("MAINTENANCE")}
              className="text-[11px] font-bold text-rose-600 dark:text-rose-300 hover:underline"
            >
              {t("staff", "lifecycleMaintenanceCount", {
                count: ops.metrics.maintenanceRooms,
              })}
            </button>
          </div>
        </div>

        {}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-4 border border-[#E2E8F0] dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={roomSearchQuery}
              onChange={(e) => setRoomSearchQuery(e.target.value)}
              placeholder={t("staff", "roomSearchPlaceholder")}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-[#182333] dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
            <span className="text-[11px] text-slate-500 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> {t("staff", "filterLabel")}
            </span>
            {([
              "ALL",
              "AVAILABLE",
              "CLEANING",
              "MAINTENANCE",
              "OCCUPIED",
            ] as const).map((filterKey) => (
              <button
                key={filterKey}
                onClick={() => setStatusFilter(filterKey)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  statusFilter === filterKey
                    ? "bg-[#0b1528] text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {roomFilterLabels[filterKey]}
              </button>
            ))}
          </div>
        </div>

        {}
        {roomsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs animate-pulse space-y-4"
              >
                <div className="flex justify-between items-center">
                  <div className="h-6 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
                  <div className="h-6 w-20 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                </div>
                <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded"></div>
                <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
              </div>
            ))}
          </div>
        ) : operationalRooms.filter((room) => {
            if (
              statusFilter === "AVAILABLE" &&
              (room.status !== "AVAILABLE" || room.isOccupied)
            )
              return false
            if (statusFilter === "CLEANING" && room.status !== "CLEANING")
              return false
            if (statusFilter === "MAINTENANCE" && room.status !== "MAINTENANCE")
              return false
            if (statusFilter === "OCCUPIED" && !room.isOccupied) return false
            if (roomSearchQuery.trim()) {
              const q = roomSearchQuery.toLowerCase()
              const matchNumber = room.roomNumber.toLowerCase().includes(q)
              const matchType = room.type.toLowerCase().includes(q)
              const matchGuest = room.currentGuest
                ? room.currentGuest.toLowerCase().includes(q)
                : false
              const matchRef = room.currentBookingRef
                ? room.currentBookingRef.toLowerCase().includes(q)
                : false
              return matchNumber || matchType || matchGuest || matchRef
            }
            return true
          }).length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-xs">
            <DoorOpen className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">
              {t("staff", "noRoomsTitle")}
            </h3>
            <p className="text-slate-500 text-xs mt-1">
              {roomSearchQuery
                ? t("staff", "noRoomsMatchQuery", { query: roomSearchQuery })
                : t("staff", "noRoomsMatchFilter")}
            </p>
            {(roomSearchQuery || statusFilter !== "ALL") && (
              <button
                onClick={() => {
                  setRoomSearchQuery("")
                  setStatusFilter("ALL")
                }}
                className="mt-4 px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
              >
                {t("staff", "btnClearFilters")}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {operationalRooms
              .filter((room) => {
                if (
                  statusFilter === "AVAILABLE" &&
                  (room.status !== "AVAILABLE" || room.isOccupied)
                )
                  return false
                if (statusFilter === "CLEANING" && room.status !== "CLEANING")
                  return false
                if (
                  statusFilter === "MAINTENANCE" &&
                  room.status !== "MAINTENANCE"
                )
                  return false
                if (statusFilter === "OCCUPIED" && !room.isOccupied)
                  return false
                if (roomSearchQuery.trim()) {
                  const q = roomSearchQuery.toLowerCase()
                  const matchNumber = room.roomNumber.toLowerCase().includes(q)
                  const matchType = room.type.toLowerCase().includes(q)
                  const matchGuest = room.currentGuest
                    ? room.currentGuest.toLowerCase().includes(q)
                    : false
                  const matchRef = room.currentBookingRef
                    ? room.currentBookingRef.toLowerCase().includes(q)
                    : false
                  return matchNumber || matchType || matchGuest || matchRef
                }
                return true
              })
              .map((room) => {
                const isMutating = updatingRoomId === room.id
                return (
                  <div
                    key={room.id}
                    className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all p-5 shadow-xs flex flex-col justify-between ${
                      room.status === "CLEANING"
                        ? "border-amber-300/80 ring-1 ring-amber-200/50 dark:border-amber-700"
                        : room.status === "MAINTENANCE"
                          ? "border-rose-300/80 ring-1 ring-rose-200/50 dark:border-rose-700"
                          : room.isOccupied
                            ? "border-indigo-300/80 ring-1 ring-indigo-200/50 dark:border-indigo-700"
                            : "border-[#E2E8F0] dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-serif font-bold text-lg text-[#182333] dark:text-white">
                              {t("staff", "roomNumberLabel", {
                                number: room.roomNumber,
                              })}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 tracking-wide">
                              {roomTypeLabel(room.type)}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                            <span className="inline-flex items-center gap-1">
                              <Users className="w-3 h-3 text-slate-400" />{" "}
                              {t("staff", "guestsCount", {
                                count: room.capacity,
                              })}
                            </span>
                            <span>·</span>
                            <span className="inline-flex items-center gap-1">
                              <BedDouble className="w-3 h-3 text-slate-400" />{" "}
                              {t("staff", "bedsCount", { count: room.beds })}
                            </span>
                            <span>·</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {t("staff", "pricePerNight", {
                                price: formatMoney(room.basePrice),
                              })}
                            </span>
                          </div>
                        </div>

                        <div>
                          {room.status === "AVAILABLE" && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                              <CheckCircle2 className="w-3 h-3" />{" "}
                              {t("staff", "badgeReady")}
                            </span>
                          )}
                          {room.status === "CLEANING" && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 animate-pulse">
                              <Sparkles className="w-3 h-3" />{" "}
                              {t("staff", "badgeCleaning")}
                            </span>
                          )}
                          {room.status === "MAINTENANCE" && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                              <Wrench className="w-3 h-3" />{" "}
                              {t("staff", "badgeMaintenance")}
                            </span>
                          )}
                          {room.status === "UNAVAILABLE" && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {t("staff", "badgeBlocked")}
                            </span>
                          )}
                        </div>
                      </div>

                      {room.isOccupied ? (
                        <div className="mb-4 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-xl p-3 text-xs">
                          <div className="flex items-center justify-between font-bold text-indigo-900 dark:text-indigo-300 mb-1">
                            <span className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                              <span>
                                {room.currentGuest ||
                                  t("staff", "checkedInGuestFallback")}
                              </span>
                            </span>
                            <span className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400">
                              #
                              {room.currentBookingRef?.slice(-6) ||
                                t("staff", "stayRefFallback")}
                            </span>
                          </div>
                          <div className="text-slate-600 dark:text-slate-400 space-y-0.5 text-[11px]">
                            {room.checkOutDate && (
                              <div>
                                {t("staff", "departureLabel")}{" "}
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                  {formatDate(room.checkOutDate)}
                                </span>
                              </div>
                            )}
                            {room.currentGuestPhone && (
                              <div className="flex items-center gap-1 text-slate-500">
                                <Phone className="w-3 h-3" />{" "}
                                {room.currentGuestPhone}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="mb-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2.5 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                          <DoorOpen className="w-3.5 h-3.5 text-slate-400" />
                          <span>{t("staff", "roomVacantLine")}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                        {t("staff", "housekeepingActions")}
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          disabled={isMutating || room.status === "AVAILABLE"}
                          onClick={() =>
                            handleUpdateRoomStatus(room.id, "AVAILABLE")
                          }
                          className={`px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                            room.status === "AVAILABLE"
                              ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 cursor-default opacity-90"
                              : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700"
                          }`}
                          title={t("staff", "titleMarkClean")}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{t("staff", "actionReady")}</span>
                        </button>

                        <button
                          disabled={isMutating || room.status === "CLEANING"}
                          onClick={() =>
                            handleUpdateRoomStatus(room.id, "CLEANING")
                          }
                          className={`px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                            room.status === "CLEANING"
                              ? "bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 cursor-default opacity-90"
                              : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-700"
                          }`}
                          title={t("staff", "titleSendHousekeeping")}
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>{t("staff", "actionCleaning")}</span>
                        </button>

                        <button
                          disabled={isMutating || room.status === "MAINTENANCE"}
                          onClick={() =>
                            handleUpdateRoomStatus(room.id, "MAINTENANCE")
                          }
                          className={`px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                            room.status === "MAINTENANCE"
                              ? "bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 cursor-default opacity-90"
                              : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700"
                          }`}
                          title={t("staff", "titleFlagMaintenance")}
                        >
                          <Wrench className="w-3 h-3" />
                          <span>{t("staff", "actionRepair")}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        )}
      </div>
    </>
  )
}
