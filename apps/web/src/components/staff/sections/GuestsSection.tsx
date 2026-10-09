"use client" /* ── Header ── */ /* ── Toolbar: search + filters ── */ /* Search */ /* Filter pills */ /* ── Empty state ── */ /* ══════════════ LIST VIEW ══════════════ */ /* Name + avatar */ /* Contact */ /* Status */ /* Stays */ /* Total Spent */ /* Last Visit */ /* Notes — inline editor */ /* ══════════════ GRID VIEW ══════════════ */ /* Operational Notes */

import { Search, Filter, Users, LayoutGrid, List } from "lucide-react"
import { formatDate, formatMoney } from "../types"
import { useStaffWorkspaceContext } from "../workspace-context"

export function GuestsSection() {
  const {
    t,
    setSuccessBanner,
    guestViewMode,
    setGuestViewMode,
    guestSearchQuery,
    setGuestSearchQuery,
    guestFilterStatus,
    setGuestFilterStatus,
    filteredGuestProfiles,
    guestNotes,
    setGuestNotes,
    activeGuestNoteId,
    setActiveGuestNoteId,
    activeGuestNoteText,
    setActiveGuestNoteText,
  } = useStaffWorkspaceContext()

  return (
    <>
      <div className="space-y-5">
        {}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-bold text-[#182333] dark:text-white text-2xl mb-1">
              {t("staff", "guestsTitle")}
            </h1>
            <p className="text-[#64748B] dark:text-slate-400 text-xs sm:text-sm">
              {t("staff", "guestsSubtitle")}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setGuestViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                guestViewMode === "list"
                  ? "bg-[#2563EB] text-white border-[#2563EB] shadow-sm"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-[#E2E8F0] dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              {t("staff", "guestViewList")}
            </button>
            <button
              onClick={() => setGuestViewMode("grid")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                guestViewMode === "grid"
                  ? "bg-[#2563EB] text-white border-[#2563EB] shadow-sm"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-[#E2E8F0] dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              {t("staff", "guestViewGrid")}
            </button>
          </div>
        </div>

        {}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E2E8F0] dark:border-slate-800 p-3 sm:p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
          {}
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={guestSearchQuery}
              onChange={(e) => setGuestSearchQuery(e.target.value)}
              placeholder={t("staff", "searchPlaceholder")}
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
          {}
          <div className="flex items-center gap-2 shrink-0">
            {(["ALL", "IN_HOUSE", "PAST"] as const).map((f) => {
              const label =
                f === "ALL"
                  ? t("staff", "guestFilterAll")
                  : f === "IN_HOUSE"
                    ? t("staff", "guestFilterInHouse")
                    : t("staff", "guestFilterPast")
              return (
                <button
                  key={f}
                  onClick={() => setGuestFilterStatus(f)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    guestFilterStatus === f
                      ? "bg-[#2563EB] text-white border-[#2563EB]"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-[#E2E8F0] dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {}
        {filteredGuestProfiles.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
            <p className="font-semibold text-slate-500 dark:text-slate-400 text-sm">
              {t("staff", "guestNoResults")}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-600 mt-1">
              Try adjusting your search or filters.
            </p>
          </div>
        )}

        {}
        {guestViewMode === "list" && filteredGuestProfiles.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E2E8F0] dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {t("staff", "guestColName")}
                    </th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {t("staff", "guestColContact")}
                    </th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {t("staff", "guestColStatus")}
                    </th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {t("staff", "guestColStays")}
                    </th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {t("staff", "guestColTotalSpent")}
                    </th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {t("staff", "guestColLastVisit")}
                    </th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {t("staff", "guestColNotes")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredGuestProfiles.map((guest) => (
                    <tr
                      key={guest.email}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      {}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                            {guest.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-[#182333] dark:text-white truncate max-w-[120px]">
                              {guest.name}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate max-w-[120px]">
                              {guest.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      {}
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {guest.phone}
                      </td>
                      {}
                      <td className="px-4 py-3">
                        {guest.currentRoom ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                            Room {guest.currentRoom}
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600">
                            —
                          </span>
                        )}
                      </td>
                      {}
                      <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">
                        {guest.totalStays}
                      </td>
                      {}
                      <td className="px-4 py-3 font-bold text-emerald-600">
                        {formatMoney(guest.totalSpent)}
                      </td>
                      {}
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {formatDate(guest.lastVisit)}
                      </td>
                      {}
                      <td className="px-4 py-3 max-w-[180px]">
                        {activeGuestNoteId === guest.email ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              autoFocus
                              value={activeGuestNoteText}
                              onChange={(e) =>
                                setActiveGuestNoteText(e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  setGuestNotes((p) => ({
                                    ...p,
                                    [guest.email]: activeGuestNoteText,
                                  }))
                                  setActiveGuestNoteId(null)
                                  setSuccessBanner("Guest note saved.")
                                } else if (e.key === "Escape") {
                                  setActiveGuestNoteId(null)
                                }
                              }}
                              placeholder={t("staff", "guestAddNotesPh")}
                              className="flex-1 min-w-0 text-xs p-1.5 border border-blue-400 dark:border-blue-600 rounded-lg bg-white dark:bg-slate-800 outline-none text-slate-800 dark:text-slate-200"
                            />
                            <button
                              onClick={() => {
                                setGuestNotes((p) => ({
                                  ...p,
                                  [guest.email]: activeGuestNoteText,
                                }))
                                setActiveGuestNoteId(null)
                                setSuccessBanner("Guest note saved.")
                              }}
                              className="px-2 py-1 bg-[#2563EB] text-white text-[10px] font-bold rounded-lg shrink-0"
                            >
                              {t("staff", "guestSaveNotes")}
                            </button>
                            <button
                              onClick={() => setActiveGuestNoteId(null)}
                              className="px-2 py-1 text-[10px] text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg shrink-0"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => {
                              setActiveGuestNoteId(guest.email)
                              setActiveGuestNoteText(
                                guestNotes[guest.email] ?? guest.notes ?? "",
                              )
                            }}
                            className="truncate text-slate-600 dark:text-slate-400 cursor-pointer hover:text-[#2563EB] dark:hover:text-blue-400 transition-colors"
                            title={
                              guestNotes[guest.email] ??
                              guest.notes ??
                              t("staff", "guestAddNotesPh")
                            }
                          >
                            {guestNotes[guest.email] ?? guest.notes ?? (
                              <span className="text-slate-300 dark:text-slate-700 italic">
                                {t("staff", "guestAddNotesPh")}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {}
        {guestViewMode === "grid" && filteredGuestProfiles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGuestProfiles.map((guest) => (
              <div
                key={guest.email}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E2E8F0] dark:border-slate-800 p-5 shadow-xs space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                    {guest.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-sm text-[#182333] dark:text-white truncate">
                      {guest.name}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {guest.phone}
                    </div>
                  </div>
                  {guest.currentRoom && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                      Room {guest.currentRoom}
                    </span>
                  )}
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 text-xs space-y-1">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Stay Count:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {t("staff", "guestStaysCount", {
                        count: guest.totalStays,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Total Spent:</span>
                    <span className="font-bold text-emerald-600">
                      {formatMoney(guest.totalSpent)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Last Visit:</span>
                    <span>{formatDate(guest.lastVisit)}</span>
                  </div>
                </div>

                {}
                <div className="pt-2">
                  <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">
                    {t("staff", "guestProfileNotes")}
                  </div>
                  {activeGuestNoteId === guest.email ? (
                    <div className="space-y-2">
                      <textarea
                        rows={2}
                        value={activeGuestNoteText}
                        onChange={(e) => setActiveGuestNoteText(e.target.value)}
                        placeholder={t("staff", "guestAddNotesPh")}
                        className="w-full text-xs p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 outline-none"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setActiveGuestNoteId(null)}
                          className="px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-100 rounded-lg"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            setGuestNotes((p) => ({
                              ...p,
                              [guest.email]: activeGuestNoteText,
                            }))
                            setActiveGuestNoteId(null)
                            setSuccessBanner("Guest note saved.")
                          }}
                          className="px-3 py-1 bg-[#2563EB] text-white text-xs font-bold rounded-lg"
                        >
                          {t("staff", "guestSaveNotes")}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => {
                        setActiveGuestNoteId(guest.email)
                        setActiveGuestNoteText(
                          guestNotes[guest.email] ?? guest.notes ?? "",
                        )
                      }}
                      className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      {guestNotes[guest.email] ?? guest.notes ?? (
                        <span className="text-slate-400 italic">
                          {t("staff", "guestAddNotesPh")}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
