"use client"

import { useEffect, useRef, useState } from "react"
import {
  Building2,
  ChevronDown,
  CheckCircle2,
  DoorOpen,
  Wrench,
  ListTodo,
} from "lucide-react"
import { useStaffWorkspaceContext } from "./workspace-context"

export function HotelSwitcher({
  compact = false,
  variant = "sidebar",
}: {
  compact?: boolean
  variant?: "sidebar" | "topbar"
}) {
  const { hotels, hotelPulse, selectedHotelId, setSelectedHotelId, t } =
    useStaffWorkspaceContext()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const pulse = hotelPulse.find((item) => item.hotelId === selectedHotelId)
  const current =
    hotels.find((hotel) => hotel.id === selectedHotelId) || hotels[0]

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("mousedown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  if (!current) return null

  if (variant === "topbar") {
    return (
      <div ref={containerRef} className="relative hidden lg:block">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={`${t("staff", "switcherLabel", { hotel: current.name })} — ${t("staff", "topbarTagline")}`}
          className="inline-flex max-w-[220px] items-center gap-2 rounded-xl border border-[#e4e0d7] bg-[#fbfaf7] px-3 py-2 text-left text-[#24231f] shadow-xs transition-colors hover:border-[#b69864]/60 dark:border-[#393a35] dark:bg-[#282926] dark:text-[#f0eee7]"
        >
          <Building2 className="h-4 w-4 shrink-0 text-[#a47c3b]" />
          <span className="min-w-0">
            <span className="block truncate text-[11px] font-bold">
              {current.name}
            </span>
            <span className="block truncate text-[9px] text-[#77746b] dark:text-[#aaa79e]">
              {current.city?.name || current.address || t("staff", "switcherNoLocation")}
            </span>
          </span>
          <ChevronDown
            className={`h-3.5 w-3.5 shrink-0 text-[#77746b] transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>

        {open && (
          <div
            role="listbox"
            aria-label={t("staff", "switcherListLabel")}
            className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-xl border border-[#e4e0d7] bg-[#fbfaf7] shadow-xl dark:border-[#41473e] dark:bg-[#252925]"
          >
            {hotelPulse.map((item) => {
              const active = item.hotelId === selectedHotelId
              return (
                <button
                  key={item.hotelId}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    setSelectedHotelId(item.hotelId)
                    setOpen(false)
                  }}
                  className={`flex w-full items-start gap-3 px-3.5 py-3 text-left transition-colors ${
                    active
                      ? "bg-[#cbb07b]/15"
                      : "hover:bg-[#f0eee8] dark:hover:bg-white/5"
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] font-semibold text-[#24231f] dark:text-[#f8f4eb]">
                      {item.hotelName}
                    </span>
                    <span className="mt-0.5 block text-[10px] text-[#77746b] dark:text-[#979c92]">
                      {t("staff", "switcherSummary", {
                        occupancy: `${item.occupancyPct}%`,
                        arrivals: item.arrivals,
                        tasks: item.openTasks,
                      })}
                    </span>
                  </span>
                  {active && (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[#a47c3b]" />
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="text-[8px] font-bold uppercase tracking-[1.8px] text-[#777d72] mb-1.5 px-1">
        {t("staff", "switcherCurrentProperty")}
      </div>

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("staff", "switcherLabel", { hotel: current.name })}
        className="sf-property-card w-full text-left p-2.5 hover:border-[#b69864]/50 transition-all"
      >
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 h-11 w-11 shrink-0 rounded-lg bg-gradient-to-br from-[#497363] to-[#2d332d] flex items-center justify-center shadow-sm">
            <Building2 className="h-4.5 w-4.5 text-[#d6bd8c]" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12px] font-bold text-[#f8f4eb]">
              {current.name}
            </span>
            <span className="block truncate text-[9px] text-[#979c92] mt-0.5">
              {current.city?.name ||
                current.address ||
                t("staff", "switcherNoLocation")}
            </span>
          </span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-[#777d74] transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </div>

        {!compact && pulse && (
          <div className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-[#41473e] pt-2.5">
            <PulseStat
              icon={CheckCircle2}
              value={`${pulse.occupancyPct}%`}
              label={t("staff", "switcherOccupancy")}
            />
            <PulseStat
              icon={DoorOpen}
              value={String(pulse.arrivals)}
              label={t("staff", "switcherArrivals")}
            />
            <PulseStat
              icon={DoorOpen}
              value={String(pulse.departures)}
              label={t("staff", "switcherDepartures")}
            />
            <PulseStat
              icon={ListTodo}
              value={String(pulse.openTasks)}
              label={t("staff", "switcherOpenTasks")}
            />
            <PulseStat
              icon={Wrench}
              value={String(pulse.maintenance)}
              label={t("staff", "switcherMaintenance")}
            />
          </div>
        )}
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={t("staff", "switcherListLabel")}
          className="absolute left-0 right-0 bottom-full mb-2 z-50 overflow-hidden rounded-xl border border-[#41473e] bg-[#252925] shadow-xl"
        >
          {hotelPulse.map((item) => {
            const active = item.hotelId === selectedHotelId
            return (
              <button
                key={item.hotelId}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  setSelectedHotelId(item.hotelId)
                  setOpen(false)
                }}
                className={`flex w-full items-start gap-3 px-3.5 py-3 text-left transition-colors ${
                  active ? "bg-[#cbb07b]/12" : "hover:bg-white/5"
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12px] font-semibold text-[#f8f4eb]">
                    {item.hotelName}
                  </span>
                  <span className="mt-0.5 block text-[10px] text-[#979c92]">
                    {t("staff", "switcherSummary", {
                      occupancy: `${item.occupancyPct}%`,
                      arrivals: item.arrivals,
                      tasks: item.openTasks,
                    })}
                  </span>
                </span>
                {active && (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#cbb07b]" />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function PulseStat({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof CheckCircle2
  value: string
  label: string
}) {
  return (
    <span className="flex items-center gap-1.5 min-w-0">
      <Icon className="h-3 w-3 shrink-0 text-[#777d74]" />
      <span
        className="text-[11px] font-bold text-[#f8f4eb]"
        style={{ fontFamily: '"Manrope", sans-serif' }}
      >
        {value}
      </span>
      <span className="truncate text-[9px] text-[#979c92]">{label}</span>
    </span>
  )
}
