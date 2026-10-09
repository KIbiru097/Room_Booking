"use client"

import { FormEvent, useCallback, useEffect, useState } from "react"
import {
  Check,
  LayoutDashboard,
  Loader2,
  Plus,
  Star,
  Trash2,
} from "lucide-react"
import AuthGate from "@/components/AuthGate"
import { managerApi, ManagerDashboardLayout } from "@/lib/services"

const WIDGETS = [
  {
    key: "occupancy",
    label: "Occupancy overview",
    description: "Rooms occupied and available",
  },
  {
    key: "arrivals",
    label: "Today's arrivals",
    description: "Guests expected at check-in",
  },
  {
    key: "departures",
    label: "Today's departures",
    description: "Guests expected at check-out",
  },
  {
    key: "revenue",
    label: "Revenue summary",
    description: "Recent hotel revenue",
  },
  {
    key: "pending_bookings",
    label: "Pending bookings",
    description: "Bookings needing confirmation",
  },
  {
    key: "housekeeping",
    label: "Housekeeping status",
    description: "Room cleaning progress",
  },
] as const

export default function ManagerDashboardConfigurationPage() {
  return (
    <AuthGate roles={["MANAGER"]}>
      <DashboardConsole />
    </AuthGate>
  )
}

function DashboardConsole() {
  const [layouts, setLayouts] = useState<ManagerDashboardLayout[]>([])
  const [name, setName] = useState("")
  const [mode, setMode] = useState<ManagerDashboardLayout["layout"]>("standard")
  const [isDefault, setIsDefault] = useState(true)
  const [selectedWidgets, setSelectedWidgets] = useState<string[]>([
    "occupancy",
    "arrivals",
    "departures",
    "revenue",
  ])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      setLayouts(await managerApi.dashboardLayouts())
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load dashboard layouts.",
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim() || selectedWidgets.length === 0) return
    setSaving(true)
    setError("")
    setMessage("")
    try {
      await managerApi.createDashboardLayout({
        name: name.trim(),
        layout: mode,
        isDefault,
        widgets: selectedWidgets.map((key, position) => ({
          key,
          position,
          isVisible: true,
        })),
      })
      setName("")
      setMessage("Dashboard layout created.")
      await load()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create dashboard layout.",
      )
    } finally {
      setSaving(false)
    }
  }

  const makeDefault = async (layout: ManagerDashboardLayout) => {
    setError("")
    setMessage("")
    try {
      await managerApi.updateDashboardLayout(layout.id, { isDefault: true })
      setMessage(`${layout.name} is now the default dashboard.`)
      await load()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to set the default dashboard.",
      )
    }
  }

  const remove = async (layout: ManagerDashboardLayout) => {
    if (!window.confirm(`Delete “${layout.name}”?`)) return
    setError("")
    setMessage("")
    try {
      await managerApi.deleteDashboardLayout(layout.id)
      setMessage("Dashboard layout deleted.")
      await load()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete dashboard layout.",
      )
    }
  }

  const toggleWidget = (key: string) => {
    setSelectedWidgets((current) =>
      current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key],
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-800 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-600">
              Manager settings
            </p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              Dashboard layouts
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Create hotel-scoped dashboards for your front desk team. Layouts
              and widgets are never shared with another hotel.
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

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <Plus className="h-5 w-5 text-amber-600" />
              Create layout
            </h2>
            <form onSubmit={submit} className="mt-4 space-y-4">
              <input
                required
                minLength={2}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Layout name"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500"
              />
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">
                Density
                <select
                  value={mode}
                  onChange={(event) =>
                    setMode(
                      event.target.value as ManagerDashboardLayout["layout"],
                    )
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-800 outline-none focus:border-amber-500"
                >
                  <option value="compact">Compact</option>
                  <option value="standard">Standard</option>
                  <option value="spacious">Spacious</option>
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(event) => setIsDefault(event.target.checked)}
                  className="h-4 w-4 accent-amber-600"
                />
                Make this the default dashboard
              </label>
              <fieldset>
                <legend className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Widgets
                </legend>
                <div className="mt-2 space-y-2">
                  {WIDGETS.map((widget) => (
                    <label
                      key={widget.key}
                      className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-100 p-3 hover:border-amber-200"
                    >
                      <input
                        type="checkbox"
                        checked={selectedWidgets.includes(widget.key)}
                        onChange={() => toggleWidget(widget.key)}
                        className="mt-0.5 h-4 w-4 accent-amber-600"
                      />
                      <span>
                        <span className="block text-sm font-bold text-slate-800">
                          {widget.label}
                        </span>
                        <span className="block text-xs text-slate-500">
                          {widget.description}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <button
                disabled={saving || loading || selectedWidgets.length === 0}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LayoutDashboard className="h-4 w-4" />
                )}
                Create layout
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <LayoutDashboard className="h-5 w-5 text-amber-600" />
              Your hotel layouts
            </h2>
            {loading ? (
              <div className="flex items-center gap-2 py-8 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading layouts…
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {layouts.map((layout) => (
                  <article
                    key={layout.id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900">
                            {layout.name}
                          </h3>
                          {layout.isDefault && (
                            <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-bold text-amber-800">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                          {layout.layout} · {layout.widgets.length} widgets
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void remove(layout)}
                        aria-label={`Delete ${layout.name}`}
                        className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {layout.widgets.map((widget) => (
                        <span
                          key={widget.key}
                          className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
                        >
                          {WIDGETS.find((item) => item.key === widget.key)
                            ?.label ?? widget.key}
                        </span>
                      ))}
                    </div>
                    {!layout.isDefault && (
                      <button
                        type="button"
                        onClick={() => void makeDefault(layout)}
                        className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:border-amber-300 hover:text-amber-700"
                      >
                        <Star className="h-3.5 w-3.5" />
                        Make default
                      </button>
                    )}
                    {layout.isDefault && (
                      <p className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                        <Check className="h-3.5 w-3.5" />
                        Used for your hotel dashboard
                      </p>
                    )}
                  </article>
                ))}
                {layouts.length === 0 && (
                  <p className="py-8 text-center text-sm text-slate-500">
                    No dashboard layouts created yet.
                  </p>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
