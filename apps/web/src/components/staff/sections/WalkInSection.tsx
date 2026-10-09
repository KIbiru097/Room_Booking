"use client" /* Progress Steps Header */ /* Step Form Content */ /* Wizard Step Nav Buttons */

import { UserCheck, Check, ArrowRight } from "lucide-react"
import { formatMoney } from "../types"
import { useStaffWorkspaceContext } from "../workspace-context"

export function WalkInSection() {
  const {
    t,
    setError,
    availableRooms,
    roomTypeLabel,
    walkInStep,
    setWalkInStep,
    walkInSubmitting,
    walkInForm,
    setWalkInForm,
    handleWalkInSubmit,
    walkInRoom,
    walkInNights,
    walkInEstimatedTotal,
  } = useStaffWorkspaceContext()

  return (
    <>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-[#E2E8F0] dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-xl text-[#182333] dark:text-white">
                Fast Front-Desk Walk-In Check-In
              </h2>
              <p className="text-xs text-slate-500">
                Speed-optimized 6-step front-desk guest registration.
              </p>
            </div>
          </div>

          {}
          <div className="grid grid-cols-6 gap-1 mb-6 text-center text-[10px] font-bold">
            {[
              { step: 1, label: "1. Guest" },
              { step: 2, label: "2. Room" },
              { step: 3, label: "3. Dates" },
              { step: 4, label: "4. Rates" },
              { step: 5, label: "5. Pay" },
              { step: 6, label: "6. Ready" },
            ].map((s) => (
              <div
                key={s.step}
                className={`p-2 rounded-xl transition-all ${
                  walkInStep === s.step
                    ? "bg-[#2563EB] text-white shadow-xs"
                    : walkInStep > s.step
                      ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                }`}
              >
                {s.label}
              </div>
            ))}
          </div>

          {}
          <form onSubmit={handleWalkInSubmit} className="space-y-4">
            {walkInStep === 1 && (
              <div className="space-y-4 animate-in fade-in">
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  {t("staff", "walkInStep1")}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#334155] dark:text-slate-300 mb-1">
                      {t("staff", "labelGuestFullNameStar")}
                    </label>
                    <input
                      required
                      value={walkInForm.guestName}
                      onChange={(e) =>
                        setWalkInForm((p) => ({
                          ...p,
                          guestName: e.target.value,
                        }))
                      }
                      placeholder={t("staff", "phGuestName")}
                      className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#334155] dark:text-slate-300 mb-1">
                      {t("staff", "labelPhoneNumberStar")}
                    </label>
                    <input
                      required
                      value={walkInForm.guestPhone}
                      onChange={(e) =>
                        setWalkInForm((p) => ({
                          ...p,
                          guestPhone: e.target.value,
                        }))
                      }
                      placeholder={t("staff", "phPhone")}
                      className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#334155] dark:text-slate-300 mb-1">
                      {t("staff", "labelEmailOptional")}
                    </label>
                    <input
                      type="email"
                      value={walkInForm.guestEmail}
                      onChange={(e) =>
                        setWalkInForm((p) => ({
                          ...p,
                          guestEmail: e.target.value,
                        }))
                      }
                      placeholder={t("staff", "phEmail")}
                      className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#334155] dark:text-slate-300 mb-1">
                      {t("staff", "labelNationalId")}
                    </label>
                    <input
                      value={walkInForm.guestIdNumber}
                      onChange={(e) =>
                        setWalkInForm((p) => ({
                          ...p,
                          guestIdNumber: e.target.value,
                        }))
                      }
                      placeholder={t("staff", "phIdNumber")}
                      className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                </div>
              </div>
            )}

            {walkInStep === 2 && (
              <div className="space-y-4 animate-in fade-in">
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  {t("staff", "walkInStep2")}
                </h3>
                <div>
                  <label className="block text-xs font-semibold text-[#334155] dark:text-slate-300 mb-1">
                    {t("staff", "labelSelectRoomStar")}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {availableRooms
                      .filter((r) => r.status === "AVAILABLE")
                      .map((r) => (
                        <div
                          key={r.id}
                          onClick={() =>
                            setWalkInForm((p) => ({ ...p, roomId: r.id }))
                          }
                          className={`p-4 rounded-xl border cursor-pointer transition-all ${
                            walkInForm.roomId === r.id
                              ? "border-[#2563EB] bg-blue-50/50 dark:bg-blue-950/40 ring-2 ring-blue-400"
                              : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-200"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-sm">
                              Room {r.roomNumber}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700">
                              {roomTypeLabel(r.type)}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            {formatMoney(r.basePrice)} / night
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {walkInStep === 3 && (
              <div className="space-y-4 animate-in fade-in">
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  {t("staff", "walkInStep3")}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#334155] dark:text-slate-300 mb-1">
                      {t("staff", "labelCheckIn")}
                    </label>
                    <input
                      type="date"
                      required
                      value={walkInForm.checkIn}
                      onChange={(e) =>
                        setWalkInForm((p) => ({
                          ...p,
                          checkIn: e.target.value,
                        }))
                      }
                      className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#334155] dark:text-slate-300 mb-1">
                      {t("staff", "labelCheckOut")}
                    </label>
                    <input
                      type="date"
                      required
                      min={walkInForm.checkIn}
                      value={walkInForm.checkOut}
                      onChange={(e) =>
                        setWalkInForm((p) => ({
                          ...p,
                          checkOut: e.target.value,
                        }))
                      }
                      className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl text-xs text-blue-900 dark:text-blue-300 flex justify-between font-semibold">
                  <span>Stay Duration:</span>
                  <span>{walkInNights} Night(s)</span>
                </div>
              </div>
            )}

            {walkInStep === 4 && (
              <div className="space-y-4 animate-in fade-in">
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  {t("staff", "walkInStep4")}
                </h3>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">
                      {t("staff", "walkInRoomRate")}
                    </span>
                    <span className="font-bold">
                      {formatMoney(walkInRoom?.basePrice || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Duration</span>
                    <span className="font-bold">{walkInNights} Night(s)</span>
                  </div>
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex justify-between text-sm font-bold text-slate-900 dark:text-white">
                    <span>{t("staff", "walkInTotalEstimated")}</span>
                    <span className="text-emerald-600 dark:text-emerald-400">
                      {formatMoney(walkInEstimatedTotal)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {walkInStep === 5 && (
              <div className="space-y-4 animate-in fade-in">
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  {t("staff", "walkInStep5")}
                </h3>
                <div>
                  <label className="block text-xs font-semibold text-[#334155] dark:text-slate-300 mb-1">
                    {t("staff", "labelPaymentMethod")}
                  </label>
                  <select
                    value={walkInForm.paymentMethod}
                    onChange={(e) =>
                      setWalkInForm((p) => ({
                        ...p,
                        paymentMethod: e.target.value,
                      }))
                    }
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 font-semibold"
                  >
                    <option value="CASH">{t("staff", "optCash")}</option>
                    <option value="TELEBIRR">
                      {t("staff", "optTelebirr")}
                    </option>
                    <option value="CBE_BIRR">{t("staff", "optCbeBirr")}</option>
                    <option value="CREDIT_CARD">
                      {t("staff", "optCreditCard")}
                    </option>
                  </select>
                </div>
                <label className="flex items-center gap-2 text-xs font-semibold text-[#334155] dark:text-slate-300 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <input
                    type="checkbox"
                    checked={walkInForm.paidImmediately}
                    onChange={(e) =>
                      setWalkInForm((p) => ({
                        ...p,
                        paidImmediately: e.target.checked,
                      }))
                    }
                    className="rounded text-[#2563EB]"
                  />
                  {t("staff", "labelMarkPaidImmediately")}
                </label>
              </div>
            )}

            {walkInStep === 6 && (
              <div className="space-y-4 animate-in fade-in">
                <div className="text-center py-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 mx-auto flex items-center justify-center mb-2">
                    <Check className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {t("staff", "walkInCompleteTitle")}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {t("staff", "walkInCompleteSubtitle")}
                  </p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Guest Name</span>
                    <span className="font-bold">{walkInForm.guestName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Room</span>
                    <span className="font-bold">
                      Room #{walkInRoom?.roomNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Stay</span>
                    <span className="font-bold">
                      {walkInForm.checkIn} → {walkInForm.checkOut}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Price</span>
                    <span className="font-bold text-emerald-600">
                      {formatMoney(walkInEstimatedTotal)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {}
            <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setWalkInStep((p) => Math.max(1, p - 1))}
                disabled={walkInStep === 1}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl disabled:opacity-30"
              >
                {t("staff", "walkInStepPrev")}
              </button>

              {walkInStep < 6 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (
                      walkInStep === 1 &&
                      (!walkInForm.guestName || !walkInForm.guestPhone)
                    ) {
                      setError("Guest name and phone are required.")
                      return
                    }
                    if (walkInStep === 2 && !walkInForm.roomId) {
                      setError("Please select a room.")
                      return
                    }
                    setError("")
                    setWalkInStep((p) => Math.min(6, p + 1))
                  }}
                  className="px-5 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
                >
                  <span>{t("staff", "walkInStepNext")}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={walkInSubmitting}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5"
                >
                  {walkInSubmitting
                    ? t("staff", "registering")
                    : t("staff", "btnCheckInGuest")}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
