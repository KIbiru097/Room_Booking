"use client"

import { useState } from "react"
import { Ban, CheckCircle2, Loader2 } from "lucide-react"
import {
  adminContentApi,
  type AdminContentPlace,
  type AdminContentStatus,
} from "@/lib/services"

const transitions: Array<{ value: AdminContentStatus ;label: string }> = [
  { value: "PENDING_REVIEW", label: "Send to review" },
  { value: "PUBLISHED", label: "Publish" },
  { value: "REJECTED", label: "Reject" },
  { value: "ARCHIVED", label: "Archive" },
]

export default function ModerationTransitionPanel({
  places,
  onUpdated,
}: {
  places: AdminContentPlace[]
  onUpdated: () => Promise<void>
}) {
  const [placeId, setPlaceId] = useState("")
  const [status, setStatus] = useState<AdminContentStatus>("PENDING_REVIEW")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  const update = async () => {
    if (!placeId) return
    setSaving(true)
    setMessage("")
    try {
      await adminContentApi.updatePlaceStatus(placeId, status)
      await onUpdated()
      setMessage("Moderation status updated.")
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to update status.",
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 p-3">
      <div className="flex items-center gap-2 text-sm font-bold text-[#0b1528]">
        <Ban className="h-4 w-4 text-[#e4bd55]" />
        Transition content
      </div>
      <select
        value={placeId}
        onChange={(event) => setPlaceId(event.target.value)}
        className="min-h-10 min-w-52 rounded-lg border border-slate-200 bg-white px-3 text-sm"
      >
        <option value="">Select a place</option>
        {places.map((place) => (
          <option key={place.id} value={place.id}>
            {place.name} · {place.status}
          </option>
        ))}
      </select>
      <select
        value={status}
        onChange={(event) =>
          setStatus(event.target.value as AdminContentStatus)
        }
        className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"
      >
        {transitions.map((transition) => (
          <option key={transition.value} value={transition.value}>
            {transition.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={!placeId || saving}
        onClick={() => void update()}
        className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#0b1528] px-3 text-xs font-bold text-white disabled:opacity-50"
      >
        {saving ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <CheckCircle2 className="h-3.5 w-3.5" />
        )}
        Apply
      </button>
      {message && <span className="text-xs text-slate-500">{message}</span>}
    </div>
  )
}
