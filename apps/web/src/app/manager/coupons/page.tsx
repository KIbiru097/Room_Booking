"use client"

import { FormEvent, useCallback, useEffect, useState } from "react"
import { Loader2, Pencil, Plus, Tag, X } from "lucide-react"
import AuthGate from "@/components/AuthGate"
import { managerApi } from "@/lib/services"

type Coupon = {
  id: string
  code: string
  discountType: "PERCENTAGE" | "FIXED_AMOUNT"
  value: number | string
  validFrom: string
  validTo: string
  usageLimit: number
  timesUsed: number
  isActive: boolean
  minBookingAmount?: number | string | null
}

const initialForm = {
  code: "",
  discountType: "PERCENTAGE" as Coupon["discountType"],
  value: "",
  validFrom: "",
  validTo: "",
  usageLimit: "100",
  minBookingAmount: "",
}

const toDateInput = (value: string) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10)
}

export default function ManagerCouponsPage() {
  return (
    <AuthGate roles={["MANAGER"]}>
      <CouponsConsole />
    </AuthGate>
  )
}

function CouponsConsole() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [form, setForm] = useState(initialForm)
  const [editingId, setEditingId] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      setCoupons((await managerApi.coupons()) as Coupon[])
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load hotel coupons.",
      )
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => {
    void load()
  }, [load])

  const buildPayload = () => ({
    code: form.code,
    discountType: form.discountType,
    value: Number(form.value),
    validFrom: new Date(`${form.validFrom}T00:00:00`).toISOString(),
    validTo: new Date(`${form.validTo}T23:59:59`).toISOString(),
    usageLimit: Number(form.usageLimit),
    ...(form.minBookingAmount
      ? { minBookingAmount: Number(form.minBookingAmount) }
      : {}),
  })

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError("")
    setMessage("")
    try {
      if (editingId) {
        await managerApi.updateCoupon(editingId, buildPayload())
        setMessage("Coupon updated.")
      } else {
        await managerApi.createCoupon(buildPayload())
        setMessage("Coupon created for your hotel.")
      }
      setForm(initialForm)
      setEditingId("")
      await load()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : editingId
            ? "Unable to update coupon."
            : "Unable to create coupon.",
      )
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (coupon: Coupon) => {
    setError("")
    setMessage("")
    setEditingId(coupon.id)
    setForm({
      code: coupon.code,
      discountType: coupon.discountType,
      value: String(coupon.value),
      validFrom: toDateInput(coupon.validFrom),
      validTo: toDateInput(coupon.validTo),
      usageLimit: String(coupon.usageLimit),
      minBookingAmount: coupon.minBookingAmount
        ? String(coupon.minBookingAmount)
        : "",
    })
  }

  const cancelEdit = () => {
    setEditingId("")
    setForm(initialForm)
    setError("")
  }

  const deactivate = async (id: string) => {
    if (
      !window.confirm(
        "Deactivate this coupon? Existing booking history will be preserved.",
      )
    )
      return
    try {
      await managerApi.deactivateCoupon(id)
      setMessage("Coupon deactivated.")
      await load()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to deactivate coupon.",
      )
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-800 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-600">
              Manager settings
            </p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              Hotel coupons
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Coupons created here are automatically scoped to your assigned
              hotel.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold shadow-sm"
          >
            Refresh
          </button>
        </header>
        {message && (
          <p
            role="status"
            className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
          >
            {message}
          </p>
        )}
        {error && (
          <p
            role="alert"
            className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Plus className="h-5 w-5 text-amber-600" />
            {editingId ? "Edit hotel coupon" : "Create hotel coupon"}
          </h2>
          <form
            onSubmit={submit}
            className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          >
            <input
              required
              minLength={3}
              value={form.code}
              onChange={(e) =>
                setForm({ ...form, code: e.target.value.toUpperCase() })
              }
              placeholder="Code (e.g. WELCOME10)"
              className="field"
            />
            <select
              value={form.discountType}
              onChange={(e) =>
                setForm({
                  ...form,
                  discountType: e.target.value as Coupon["discountType"],
                })
              }
              className="field"
            >
              <option value="PERCENTAGE">Percentage</option>
              <option value="FIXED_AMOUNT">Fixed amount</option>
            </select>
            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
              placeholder="Discount value"
              className="field"
            />
            <input
              required
              type="number"
              min="1"
              value={form.usageLimit}
              onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
              placeholder="Usage limit"
              className="field"
            />
            <label className="text-xs font-semibold text-slate-500">
              Valid from
              <input
                required
                type="date"
                value={form.validFrom}
                onChange={(e) =>
                  setForm({ ...form, validFrom: e.target.value })
                }
                className="field mt-1"
              />
            </label>
            <label className="text-xs font-semibold text-slate-500">
              Valid to
              <input
                required
                type="date"
                value={form.validTo}
                onChange={(e) => setForm({ ...form, validTo: e.target.value })}
                className="field mt-1"
              />
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={form.minBookingAmount}
              onChange={(e) =>
                setForm({ ...form, minBookingAmount: e.target.value })
              }
              placeholder="Minimum booking (optional)"
              className="field"
            />
            <button
              disabled={saving}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Tag className="h-4 w-4" />
              )}
              {editingId ? "Save changes" : "Create coupon"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 hover:border-slate-300"
              >
                Cancel
              </button>
            )}
          </form>
        </section>
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold">Your hotel coupons</h2>
          {loading ? (
            <div className="flex items-center gap-2 py-8 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading coupons…
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-3">Code</th>
                    <th className="px-3 py-3">Discount</th>
                    <th className="px-3 py-3">Validity</th>
                    <th className="px-3 py-3">Usage</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((coupon) => (
                    <tr
                      key={coupon.id}
                      className={`border-b border-slate-100 ${
                        editingId === coupon.id ? "bg-amber-50/50" : ""
                      }`}
                    >
                      <td className="px-3 py-3 font-bold">{coupon.code}</td>
                      <td className="px-3 py-3">
                        {coupon.discountType === "PERCENTAGE"
                          ? `${coupon.value}%`
                          : `${coupon.value} ETB`}
                      </td>
                      <td className="px-3 py-3">
                        {new Date(coupon.validFrom).toLocaleDateString()} –{" "}
                        {new Date(coupon.validTo).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-3">
                        {coupon.timesUsed}/{coupon.usageLimit}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                            coupon.isActive
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {coupon.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="inline-flex flex-wrap justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => startEdit(coupon)}
                            aria-label={`Edit ${coupon.code}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:border-amber-300 hover:text-amber-700"
                          >
                            <Pencil className="h-3 w-3" />
                            Edit
                          </button>
                          {coupon.isActive && (
                            <button
                              type="button"
                              onClick={() => void deactivate(coupon.id)}
                              aria-label={`Deactivate ${coupon.code}`}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:border-red-300 hover:text-red-700"
                            >
                              <X className="h-3 w-3" />
                              Deactivate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {coupons.length === 0 && (
                <p className="py-8 text-center text-sm text-slate-500">
                  No hotel coupons yet.
                </p>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
