"use client"

import { FormEvent, useEffect, useState } from "react"
import { CheckCircle2, FileText, Loader2, Plus } from "lucide-react"
import { adminContentApi } from "@/lib/services"

const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#e4bd55] focus:ring-2 focus:ring-[#e4bd55]/20"
const actionClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0b1528] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#12233a] disabled:cursor-not-allowed disabled:opacity-50"

type KnowledgeDocument = {
  id: string
  title: string
  content: string
  approved: boolean
  hotelId?: string | null
  updatedAt: string
}

export default function KnowledgeDocumentPanel() {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([])
  const [form, setForm] = useState({ title: "", content: "" })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const load = async () => {
    setLoading(true)
    setError("")
    try {
      setDocuments(await adminContentApi.knowledge())
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load knowledge documents.",
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError("")
    try {
      await adminContentApi.createKnowledge({ ...form, approved: false })
      setForm({ title: "", content: "" })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save document.")
    } finally {
      setSaving(false)
    }
  }

  const toggleApproval = async (document: KnowledgeDocument) => {
    setSaving(true)
    setError("")
    try {
      await adminContentApi.updateKnowledge(document.id, {
        approved: !document.approved,
      })
      await load()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update document approval.",
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-serif text-xl font-bold text-[#0b1528]">
            <FileText className="h-5 w-5 text-[#e4bd55]" />
            Verified AI knowledge
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Only approved records may be used by grounded AI responses.
          </p>
        </div>
        {loading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
      </div>
      {error && (
        <p className="mt-3 rounded-lg bg-red-50 p-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <form
        onSubmit={submit}
        className="mt-4 grid gap-3 lg:grid-cols-[1fr_2fr_auto]"
      >
        <input
          required
          minLength={2}
          value={form.title}
          onChange={(event) => setForm({ ...form, title: event.target.value })}
          placeholder="Document title"
          className={fieldClass}
        />
        <textarea
          required
          minLength={20}
          value={form.content}
          onChange={(event) =>
            setForm({ ...form, content: event.target.value })
          }
          placeholder="Source-attributed knowledge (minimum 20 characters)"
          className={`${fieldClass} min-h-11`}
        />
        <button disabled={saving} className={actionClass}>
          <Plus className="h-4 w-4" />
          Save draft
        </button>
      </form>
      <div className="mt-5 divide-y divide-slate-100">
        {documents.map((document) => (
          <div
            key={document.id}
            className="flex flex-wrap items-center justify-between gap-3 py-3"
          >
            <div className="min-w-0">
              <p className="font-bold text-[#0b1528]">{document.title}</p>
              <p className="line-clamp-2 text-sm text-slate-500">
                {document.content}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Updated {new Date(document.updatedAt).toLocaleString()}
              </p>
            </div>
            <button
              type="button"
              disabled={saving}
              onClick={() => void toggleApproval(document)}
              className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-bold ${
                document.approved
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {document.approved ? "Approved · revoke" : "Approve for AI"}
            </button>
          </div>
        ))}
        {!loading && documents.length === 0 && (
          <p className="py-5 text-center text-sm text-slate-500">
            No knowledge documents yet.
          </p>
        )}
      </div>
    </section>
  )
}
