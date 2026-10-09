"use client"

import { useStaffWorkspaceContext } from "../workspace-context"

export function StayRequestsSection() {
  const { t, stayRequests, statusLabel, setDecidingRequest, setDecisionNote } =
    useStaffWorkspaceContext()

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="font-bold text-[#182333] dark:text-white text-2xl mb-1">
            {t("staff", "stayRequestsTitle")}
          </h1>
          <p className="text-[#64748B] dark:text-slate-400 text-xs sm:text-sm">
            {t("staff", "stayRequestsSubtitle")}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E2E8F0] dark:border-slate-800 shadow-xs overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
          {stayRequests.map((req) => (
            <div
              key={req.id}
              className="p-4 sm:p-5 flex items-center justify-between gap-4"
            >
              <div>
                <div className="font-bold text-xs sm:text-sm text-[#182333] dark:text-white">
                  {t("staff", "stayRequestLine", {
                    type:
                      req.type === "EARLY_CHECK_IN"
                        ? t("staff", "earlyCheckIn")
                        : t("staff", "lateCheckOut"),
                    time: req.requestedTime,
                  })}
                </div>
                <div className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
                  {t("staff", "bookingRefLabel", {
                    ref: req.bookingId.slice(-8),
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    req.status === "APPROVED"
                      ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
                      : req.status === "REJECTED"
                        ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400"
                        : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400"
                  }`}
                >
                  {statusLabel(req.status)}
                </span>

                {req.status === "PENDING" && (
                  <button
                    onClick={() => {
                      setDecidingRequest(req)
                      setDecisionNote("")
                    }}
                    className="px-3 py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
                  >
                    {t("staff", "btnDecide")}
                  </button>
                )}
              </div>
            </div>
          ))}
          {!stayRequests.length && (
            <div className="p-8 text-center text-xs sm:text-sm text-[#64748B] dark:text-slate-400">
              {t("staff", "noStayRequests")}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
