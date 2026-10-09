"use client" /* Modal: Room Relocation */ /* Modal: Decide Stay Request */ /* Modal: Confirm Guest No-Show */

import { AlertTriangle, Loader2, X, Bot, Send } from "lucide-react"
import { formatMoney } from "../types"
import { useStaffWorkspaceContext } from "../workspace-context"

export function StaffModals() {
  const {
    user,
    t,
    selectedHotel,
    availableRooms,
    roomTypeLabel,
    noShowModalBooking,
    setNoShowModalBooking,
    noShowSubmitting,
    confirmNoShow,
    relocateBooking,
    setRelocateBooking,
    relocateNewRoomId,
    setRelocateNewRoomId,
    relocateReason,
    setRelocateReason,
    relocateSubmitting,
    handleRelocateSubmit,
    decidingRequest,
    setDecidingRequest,
    decisionNote,
    setDecisionNote,
    decidingSubmitting,
    handleDecideStayRequest,
    walkInModalOpen,
    setWalkInModalOpen,
    walkInSubmitting,
    walkInForm,
    setWalkInForm,
    handleWalkInSubmit,
    rejectingBooking,
    setRejectingBooking,
    rejectReason,
    setRejectReason,
    rejectSubmitting,
    handleConfirmRejectBooking,
    timeAdjustBooking,
    setTimeAdjustBooking,
    timeAdjustFee,
    setTimeAdjustFee,
    timeAdjustReason,
    setTimeAdjustReason,
    timeAdjustSubmitting,
    handleTimeAdjustmentSubmit,
  } = useStaffWorkspaceContext()

  return (
    <>
      {walkInModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg p-6 border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-base sm:text-lg text-[#182333] dark:text-white">
                {t("staff", "walkInModalTitle")}
              </h3>
              <button
                onClick={() => setWalkInModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors"
                aria-label={t("staff", "closeLabel")}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleWalkInSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
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

              <div className="grid grid-cols-2 gap-3">
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

              <div>
                <label className="block text-xs font-semibold text-[#334155] dark:text-slate-300 mb-1">
                  {t("staff", "labelSelectRoomStar")}
                </label>
                <select
                  required
                  value={walkInForm.roomId}
                  onChange={(e) =>
                    setWalkInForm((p) => ({ ...p, roomId: e.target.value }))
                  }
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 font-semibold"
                >
                  <option value="">{t("staff", "optChooseRoom")}</option>
                  {availableRooms
                    .filter((r) => r.status === "AVAILABLE")
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {t("staff", "roomOptionLine", {
                          number: r.roomNumber,
                          type: roomTypeLabel(r.type),
                          price: formatMoney(r.basePrice),
                        })}
                      </option>
                    ))}
                </select>
              </div>

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
                      setWalkInForm((p) => ({ ...p, checkIn: e.target.value }))
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
                      setWalkInForm((p) => ({ ...p, checkOut: e.target.value }))
                    }
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 items-center">
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
                <div className="pt-4">
                  <label className="flex items-center gap-2 text-xs font-semibold text-[#334155] dark:text-slate-300">
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
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setWalkInModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#64748B] hover:bg-slate-100 rounded-xl"
                >
                  {t("staff", "btnCancel")}
                </button>
                <button
                  type="submit"
                  disabled={walkInSubmitting || !walkInForm.roomId}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  {walkInSubmitting
                    ? t("staff", "registering")
                    : t("staff", "btnCheckInGuest")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {}
      {relocateBooking && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-base text-[#182333] dark:text-white">
                {t("staff", "relocateModalTitle")}
              </h3>
              <button
                onClick={() => setRelocateBooking(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors"
                aria-label={t("staff", "closeLabel")}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRelocateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#334155] dark:text-slate-300 mb-1">
                  {t("staff", "labelTargetRoomStar")}
                </label>
                <select
                  required
                  value={relocateNewRoomId}
                  onChange={(e) => setRelocateNewRoomId(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 font-semibold"
                >
                  <option value="">{t("staff", "optSelectTargetRoom")}</option>
                  {availableRooms
                    .filter((r) => r.status === "AVAILABLE")
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {t("staff", "roomOptionLineShort", {
                          number: r.roomNumber,
                          type: roomTypeLabel(r.type),
                        })}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#334155] dark:text-slate-300 mb-1">
                  {t("staff", "labelReasonStar")}
                </label>
                <textarea
                  required
                  rows={2}
                  value={relocateReason}
                  onChange={(e) => setRelocateReason(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setRelocateBooking(null)}
                  className="px-4 py-2 text-xs font-semibold text-[#64748B] hover:bg-slate-100 rounded-xl"
                >
                  {t("staff", "btnCancel")}
                </button>
                <button
                  type="submit"
                  disabled={relocateSubmitting || !relocateNewRoomId}
                  className="px-5 py-2 bg-[#2563EB] hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  {relocateSubmitting
                    ? t("staff", "relocating")
                    : t("staff", "btnConfirmRelocation")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {}
      {decidingRequest && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-base text-[#182333] dark:text-white">
                {t("staff", "decideModalTitle")}
              </h3>
              <button
                onClick={() => setDecidingRequest(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors"
                aria-label={t("staff", "closeLabel")}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mb-4 text-xs text-[#334155] dark:text-slate-300 space-y-1">
              <p>
                <strong>{t("staff", "typeLabel")}</strong>{" "}
                {decidingRequest.type === "EARLY_CHECK_IN"
                  ? t("staff", "earlyCheckIn")
                  : t("staff", "lateCheckOut")}
              </p>
              <p>
                <strong>{t("staff", "requestedTimeLabel")}</strong>{" "}
                {decidingRequest.requestedTime}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#334155] dark:text-slate-300 mb-1">
                  {t("staff", "labelDecisionNote")}
                </label>
                <input
                  type="text"
                  placeholder={t("staff", "phDecisionNote")}
                  value={decisionNote}
                  onChange={(e) => setDecisionNote(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  disabled={decidingSubmitting}
                  onClick={() => handleDecideStayRequest("REJECTED")}
                  className="px-4 py-2 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl text-xs font-bold"
                >
                  {t("staff", "btnReject")}
                </button>
                <button
                  disabled={decidingSubmitting}
                  onClick={() => handleDecideStayRequest("APPROVED")}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  {t("staff", "btnApprove")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {}
      {noShowModalBooking && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-center shrink-0 text-amber-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#182333] dark:text-white">
                  {t("staff", "noShowConfirmTitle")}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t("staff", "reservationRef")}{" "}
                  <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                    {noShowModalBooking.bookingRef}
                  </span>
                </p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-700 mb-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">
                  {t("staff", "guestLabel")}
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {noShowModalBooking.user?.fullName ||
                    noShowModalBooking.details?.[0]?.guestInfo?.name ||
                    t("staff", "registeredGuest")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">
                  {t("staff", "scheduledStay")}
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {noShowModalBooking.checkIn?.slice?.(0, 10)} &rarr;{" "}
                  {noShowModalBooking.checkOut?.slice?.(0, 10)}
                </span>
              </div>
              {noShowModalBooking.details?.[0]?.room && (
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">
                    {t("staff", "assignedRoom")}
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {t("staff", "roomWithType", {
                      number: noShowModalBooking.details[0].room.roomNumber,
                      type: roomTypeLabel(
                        noShowModalBooking.details[0].room.type,
                      ),
                    })}
                  </span>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              {t("staff", "noShowBodyLead")}{" "}
              <strong>{t("staff", "noShowBodyStrong")}</strong>{" "}
              {t("staff", "noShowBodyTail")}
            </p>

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                disabled={noShowSubmitting}
                onClick={() => setNoShowModalBooking(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl"
              >
                {t("staff", "btnCancel")}
              </button>
              <button
                type="button"
                disabled={noShowSubmitting}
                onClick={confirmNoShow}
                className="px-4 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {noShowSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {t("staff", "updating")}
                  </>
                ) : (
                  t("staff", "btnConfirmNoShow")
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {rejectingBooking && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-100 dark:border-slate-800"
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-base text-[#182333] dark:text-white">
                {t("staff", "rejectModalTitle")}
              </h3>
              <button
                onClick={() => setRejectingBooking(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 flex items-center justify-center"
                aria-label={t("staff", "closeLabel")}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1">
                <div className="font-bold text-sm text-slate-900 dark:text-white">
                  {rejectingBooking.user?.fullName ||
                    rejectingBooking.details?.[0]?.guestInfo?.name ||
                    t("staff", "registeredGuest")}
                </div>
                <div className="text-slate-500">
                  {t("staff", "reservationRef")}{" "}
                  <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                    {rejectingBooking.bookingRef ||
                      `#${rejectingBooking.id.slice(-8)}`}
                  </span>
                </div>
                <div className="text-slate-500">
                  {rejectingBooking.checkIn?.slice(0, 10)} &rarr;{" "}
                  {rejectingBooking.checkOut?.slice(0, 10)}
                </div>
              </div>

              <label className="block text-xs font-semibold text-[#334155] dark:text-slate-300 mb-1">
                {t("staff", "rejectReasonLabel")}
                <textarea
                  value={rejectReason}
                  onChange={(event) => setRejectReason(event.target.value)}
                  rows={3}
                  placeholder={t("staff", "rejectReasonPlaceholder")}
                  className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-2.5 text-xs outline-none focus:border-rose-500"
                />
              </label>
            </div>

            <div className="pt-4 flex justify-end gap-2">
              <button
                onClick={() => setRejectingBooking(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl"
              >
                {t("staff", "btnCancel")}
              </button>
              <button
                onClick={() => void handleConfirmRejectBooking()}
                disabled={rejectSubmitting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-2"
              >
                {rejectSubmitting && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                {t("staff", "btnReject")}
              </button>
            </div>
          </div>
        </div>
      )}

      {timeAdjustBooking && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-100 dark:border-slate-800"
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-base text-[#182333] dark:text-white">
                {timeAdjustBooking.type === "EARLY_IN"
                  ? t("staff", "earlyCheckIn")
                  : t("staff", "lateCheckOut")}
              </h3>
              <button
                onClick={() => setTimeAdjustBooking(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 flex items-center justify-center"
                aria-label={t("staff", "closeLabel")}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <div className="font-bold text-sm text-slate-900 dark:text-white">
                  {timeAdjustBooking.booking.user?.fullName ||
                    timeAdjustBooking.booking.details?.[0]?.guestInfo?.name ||
                    t("staff", "registeredGuest")}
                </div>
                <div className="text-slate-500">
                  {t("staff", "reservationRef")}{" "}
                  <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                    {timeAdjustBooking.booking.bookingRef ||
                      `#${timeAdjustBooking.booking.id.slice(-8)}`}
                  </span>
                </div>
              </div>

              <label className="block text-xs font-semibold text-[#334155] dark:text-slate-300">
                {t("staff", "adjustFeeLabel")}
                <input
                  type="number"
                  min={0}
                  value={timeAdjustFee}
                  onChange={(event) =>
                    setTimeAdjustFee(Number(event.target.value))
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-2.5 text-xs outline-none focus:border-[#2563EB]"
                />
              </label>

              <label className="block text-xs font-semibold text-[#334155] dark:text-slate-300">
                {t("staff", "adjustReasonLabel")}
                <textarea
                  rows={3}
                  value={timeAdjustReason}
                  onChange={(event) => setTimeAdjustReason(event.target.value)}
                  placeholder={t("staff", "adjustReasonPlaceholder")}
                  className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-2.5 text-xs outline-none focus:border-[#2563EB]"
                />
              </label>

              <p className="text-[11px] text-slate-400">
                {formatMoney(timeAdjustFee)} {t("staff", "adjustFeeSuffix")}
              </p>
            </div>

            <div className="pt-4 flex justify-end gap-2">
              <button
                onClick={() => setTimeAdjustBooking(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl"
              >
                {t("staff", "btnCancel")}
              </button>
              <button
                onClick={() => void handleTimeAdjustmentSubmit()}
                disabled={timeAdjustSubmitting}
                className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-60 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-2"
              >
                {timeAdjustSubmitting && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                {t("staff", "btnConfirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
