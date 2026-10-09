"use client"

import { useRef, useState } from "react"
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Clock,
  Image as ImageIcon,
  MessageSquarePlus,
  ShieldAlert,
  Wrench,
} from "lucide-react"
import { useStaffWorkspaceContext } from "../workspace-context"

interface IssueNote {
  roomId: string
  note: string
  at: string
}

export function MaintenanceSection() {
  const {
    t,
    operationalRooms,
    handleUpdateRoomStatus,
    updatingRoomId,
    roomTypeLabel,
    localActivity,
    recordActivity,
    openSection,
    capabilities,
  } = useStaffWorkspaceContext()
  const [notes, setNotes] = useState<IssueNote[]>([])
  const [noteFor, setNoteFor] = useState<string | null>(null)
  const [noteDraft, setNoteDraft] = useState("")
  const [photos, setPhotos] = useState<Record<string, string[]>>({})
  const fileRef = useRef<HTMLInputElement>(null)
  const [photoFor, setPhotoFor] = useState<string | null>(null)

  const issues = operationalRooms.filter(
    (room) => room.status === "MAINTENANCE" || room.status === "UNAVAILABLE",
  )
  const canResolve = capabilities.has("maintenance.resolve")

  const addNote = (roomId: string) => {
    const trimmed = noteDraft.trim()
    if (!trimmed) return
    setNotes((prev) => [
      { roomId, note: trimmed, at: new Date().toISOString() },
      ...prev,
    ])
    recordActivity(
      "room",
      `Maintenance note on room ${operationalRooms.find((room) => room.id === roomId)?.roomNumber ?? ""}: ${trimmed}`,
    )
    setNoteDraft("")
    setNoteFor(null)
  }

  const attachPhoto = (files: FileList | null) => {
    if (!files || !photoFor) return
    const urls = Array.from(files).map((file) => URL.createObjectURL(file))
    setPhotos((prev) => ({
      ...prev,
      [photoFor]: [...(prev[photoFor] ?? []), ...urls],
    }))
    recordActivity(
      "room",
      `Attached ${urls.length} photo(s) to a maintenance issue`,
    )
    setPhotoFor(null)
    if (fileRef.current) fileRef.current.value = ""
  }

  const history = localActivity
    .filter((event) => event.kind === "room")
    .slice(0, 12)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#182333] dark:text-white">
            {t("staff", "maintenanceTitle")}
          </h1>
          <p className="text-[#64748B] dark:text-slate-400 text-xs sm:text-sm mt-0.5">
            {t("staff", "maintenanceSubtitle")}
          </p>
        </div>
        <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/40 px-3 py-2 text-xs font-bold text-amber-700 dark:text-amber-300">
          {t("staff", "maintenanceOpenCount", { count: issues.length })}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {issues.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-10 text-center">
              <CheckCircle2 className="mx-auto h-9 w-9 text-emerald-500" />
              <p className="mt-3 text-sm font-bold text-slate-600 dark:text-slate-300">
                {t("staff", "maintenanceEmpty")}
              </p>
              <p className="text-xs text-slate-400">
                {t("staff", "maintenanceEmptyHint")}
              </p>
            </div>
          )}

          {issues.map((room) => {
            const roomNotes = notes.filter((note) => note.roomId === room.id)
            const roomPhotos = photos[room.id] ?? []
            const highPriority = room.status === "MAINTENANCE"
            return (
              <article
                key={room.id}
                className="rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-serif text-lg font-bold text-[#182333] dark:text-white">
                        {t("staff", "roomNumberLabel", {
                          number: room.roomNumber,
                        })}
                      </h2>
                      <span className="text-xs text-slate-500">
                        {roomTypeLabel(room.type)}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          highPriority
                            ? "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300"
                            : "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300"
                        }`}
                      >
                        {highPriority
                          ? t("staff", "maintenancePriorityHigh")
                          : t("staff", "maintenancePriorityNormal")}
                      </span>
                      <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                        {room.status === "MAINTENANCE"
                          ? t("staff", "maintenanceStatusRepairing")
                          : t("staff", "maintenanceStatusInspection")}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                      {room.status === "MAINTENANCE"
                        ? t("staff", "maintenanceIssueDefault")
                        : t("staff", "maintenanceIssueInspection")}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400">
                      <Clock className="h-3 w-3" />
                      {t("staff", "maintenanceReported")}{" "}
                      {room.currentGuest || t("staff", "maintenanceTeamLabel")}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {room.status === "UNAVAILABLE" && (
                      <button
                        type="button"
                        disabled={updatingRoomId === room.id || !canResolve}
                        title={
                          canResolve
                            ? undefined
                            : t("staff", "permissionDenied")
                        }
                        onClick={() =>
                          void handleUpdateRoomStatus(room.id, "MAINTENANCE")
                        }
                        className="rounded-lg bg-[#2563EB] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#1D4ED8] disabled:opacity-50"
                      >
                        {t("staff", "maintenanceActionStart")}
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={updatingRoomId === room.id || !canResolve}
                      title={
                        canResolve ? undefined : t("staff", "permissionDenied")
                      }
                      onClick={() =>
                        void handleUpdateRoomStatus(room.id, "AVAILABLE")
                      }
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {t("staff", "maintenanceActionComplete")}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNoteFor(noteFor === room.id ? null : room.id)
                        setNoteDraft("")
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <MessageSquarePlus className="h-3.5 w-3.5" />
                      {t("staff", "maintenanceActionNote")}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoFor(room.id)
                        fileRef.current?.click()
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <Camera className="h-3.5 w-3.5" />
                      {t("staff", "maintenanceActionPhoto")}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        recordActivity(
                          "room",
                          `Escalated room ${room.roomNumber} to the manager`,
                        )
                      }
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-200 dark:border-rose-900 px-3 py-1.5 text-[11px] font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      <ShieldAlert className="h-3.5 w-3.5" />
                      {t("staff", "maintenanceActionEscalate")}
                    </button>
                  </div>
                </div>

                {noteFor === room.id && (
                  <div className="mt-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3">
                    <textarea
                      autoFocus
                      rows={2}
                      value={noteDraft}
                      onChange={(event) => setNoteDraft(event.target.value)}
                      placeholder={t("staff", "maintenanceNotePlaceholder")}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-2.5 text-xs outline-none focus:border-[#2563EB]"
                    />
                    <div className="mt-2 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setNoteFor(null)}
                        className="rounded-lg px-3 py-1.5 text-[11px] font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        {t("staff", "btnCancel")}
                      </button>
                      <button
                        type="button"
                        onClick={() => addNote(room.id)}
                        className="rounded-lg bg-[#0b1528] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#12233a]"
                      >
                        {t("staff", "btnSave")}
                      </button>
                    </div>
                  </div>
                )}

                {(roomNotes.length > 0 || roomPhotos.length > 0) && (
                  <div className="mt-4 space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                    {roomNotes.map((note) => (
                      <p
                        key={`${note.roomId}-${note.at}`}
                        className="flex gap-2 text-xs text-slate-600 dark:text-slate-400"
                      >
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                        <span>{note.note}</span>
                      </p>
                    ))}
                    {roomPhotos.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {roomPhotos.map((src, index) => (
                          <span
                            key={`${src}-${index}`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-1 text-[11px] text-slate-500"
                          >
                            <ImageIcon className="h-3.5 w-3.5" />
                            {t("staff", "maintenancePhotoAttached", {
                              index: index + 1,
                            })}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </article>
            )
          })}
        </div>

        <aside className="rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-5 h-fit">
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-[#2563EB]" />
            <h2 className="text-sm font-bold text-[#182333] dark:text-white">
              {t("staff", "maintenanceHistoryTitle")}
            </h2>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            {t("staff", "maintenanceHistoryHint")}
          </p>

          <ol className="mt-4 space-y-3 border-l border-slate-200 dark:border-slate-800 pl-4">
            {history.length === 0 && (
              <li className="text-xs text-slate-400">
                {t("staff", "maintenanceHistoryEmpty")}
              </li>
            )}
            {history.map((event) => (
              <li key={event.id} className="relative">
                <span
                  className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-[#2563EB]"
                  aria-hidden="true"
                />
                <p className="text-xs font-semibold text-[#182333] dark:text-white">
                  {event.text}
                </p>
                <p className="text-[11px] text-slate-400">
                  {new Date(event.at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  · {event.actor}
                </p>
              </li>
            ))}
          </ol>

          <button
            type="button"
            onClick={() => openSection("activity")}
            className="mt-4 w-full rounded-xl border border-slate-200 dark:border-slate-700 py-2 text-xs font-bold text-[#2563EB] hover:bg-[#2563EB]/10"
          >
            {t("staff", "maintenanceOpenActivity")}
          </button>
        </aside>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => attachPhoto(event.target.files)}
      />
    </div>
  )
}
