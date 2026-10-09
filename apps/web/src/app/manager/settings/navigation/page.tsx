"use client"

import { FormEvent, useCallback, useEffect, useState } from "react"
import {
  ArrowDown,
  ArrowUp,
  Check,
  Loader2,
  Menu,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react"
import AuthGate from "@/components/AuthGate"
import { managerApi, ManagerNavigationItem } from "@/lib/services"

const ROUTES = [
  { route: "/manager", label: "Manager overview" },
  { route: "/manager/roles", label: "Roles & permissions" },
  { route: "/manager/dashboard", label: "Dashboard layouts" },
  { route: "/manager/coupons", label: "Hotel coupons" },
  { route: "/manager/settings/navigation", label: "Navigation builder" },
  ...[
    "Hotels",
    "Rooms",
    "Pricing",
    "Availability",
    "Policies",
    "Staff",
    "Reports",
    "Bookings",
    "Reviews",
  ].map((tab) => ({
    route: `/manager?tab=${tab}`,
    label: `Manager ${tab.toLowerCase()}`,
  })),
]

export default function ManagerNavigationPage() {
  return (
    <AuthGate roles={["MANAGER"]}>
      <NavigationConsole />
    </AuthGate>
  )
}

function NavigationConsole() {
  const [items, setItems] = useState<ManagerNavigationItem[]>([])
  const [label, setLabel] = useState("")
  const [route, setRoute] = useState(ROUTES[0].route)
  const [permission, setPermission] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      setItems(await managerApi.navigationItems())
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load navigation settings.",
      )
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => {
    void load()
  }, [load])

  const update = async (
    item: ManagerNavigationItem,
    data: Partial<ManagerNavigationItem>,
  ) => {
    setError("")
    setMessage("")
    try {
      const saved = await managerApi.updateNavigationItem(item.id, data)
      setItems((current) =>
        current.map((entry) => (entry.id === saved.id ? saved : entry)),
      )
      setMessage("Navigation updated.")
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update navigation.",
      )
    }
  }

  const reorder = async (from: number, to: number) => {
    if (
      from === to ||
      from < 0 ||
      to < 0 ||
      from >= items.length ||
      to >= items.length
    )
      return
    const reordered = [...items]
    const [moving] = reordered.splice(from, 1)
    reordered.splice(to, 0, moving)
    setItems(reordered.map((item, position) => ({ ...item, position })))
    setError("")
    setMessage("")
    try {
      await Promise.all(
        reordered.map((item, position) =>
          managerApi.updateNavigationItem(item.id, { position }),
        ),
      )
      setMessage("Navigation order updated.")
      await load()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to reorder navigation.",
      )
      await load()
    }
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!label.trim()) return
    setSaving(true)
    setError("")
    setMessage("")
    try {
      await managerApi.createNavigationItem({
        label: label.trim(),
        route,
        requiredPermission: permission.trim() || null,
      })
      setLabel("")
      setPermission("")
      setMessage("Navigation item added.")
      await load()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to add navigation item.",
      )
    } finally {
      setSaving(false)
    }
  }

  const remove = async (item: ManagerNavigationItem) => {
    if (item.isSystem || !window.confirm(`Remove “${item.label}”?`)) return
    setError("")
    setMessage("")
    try {
      await managerApi.deleteNavigationItem(item.id)
      setMessage("Navigation item removed.")
      await load()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to remove navigation item.",
      )
    }
  }

  const reset = async () => {
    if (!window.confirm("Reset this hotel navigation to the default items?"))
      return
    setError("")
    setMessage("")
    try {
      setItems(await managerApi.resetNavigation())
      setMessage("Navigation reset to defaults.")
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to reset navigation.",
      )
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-800 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-600">
              Manager settings
            </p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              Navigation builder
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Configure the navigation shown for your hotel. Routes are
              allow-listed and every change is scoped to your hotel.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void load()}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold shadow-sm"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={() => void reset()}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white"
            >
              <RotateCcw className="h-4 w-4" />
              Reset defaults
            </button>
          </div>
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
              Add navigation item
            </h2>
            <form onSubmit={submit} className="mt-4 space-y-4">
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">
                Label
                <input
                  required
                  value={label}
                  onChange={(event) => setLabel(event.target.value)}
                  placeholder="e.g. Front desk"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-amber-500"
                />
              </label>
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">
                Safe route
                <select
                  value={route}
                  onChange={(event) => setRoute(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-amber-500"
                >
                  {ROUTES.map((entry) => (
                    <option key={entry.route} value={entry.route}>
                      {entry.label} ({entry.route})
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">
                Required permission{" "}
                <span className="font-normal normal-case">(optional)</span>
                <input
                  value={permission}
                  onChange={(event) => setPermission(event.target.value)}
                  placeholder="booking.view"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-amber-500"
                />
              </label>
              <button
                disabled={saving || loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Add item
              </button>
            </form>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <Menu className="h-5 w-5 text-amber-600" />
              Hotel navigation
            </h2>
            {loading ? (
              <div className="flex items-center gap-2 py-8 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading navigation…
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {items.map((item, index) => (
                  <article
                    key={item.id}
                    draggable
                    onDragStart={() => setDraggedIndex(index)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => {
                      if (draggedIndex !== null)
                        void reorder(draggedIndex, index)
                      setDraggedIndex(null)
                    }}
                    className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 p-3"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-amber-50 text-sm font-bold text-amber-700">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <input
                          value={item.label}
                          onChange={(event) =>
                            setItems((current) =>
                              current.map((entry) =>
                                entry.id === item.id
                                  ? { ...entry, label: event.target.value }
                                  : entry,
                              ),
                            )
                          }
                          onBlur={(event) => {
                            if (
                              event.target.value.trim() &&
                              event.target.value !== item.label
                            )
                              void update(item, {
                                label: event.target.value.trim(),
                              })
                          }}
                          className="w-full min-w-0 rounded-lg border border-transparent px-2 py-1 font-bold text-slate-900 outline-none focus:border-amber-300"
                        />
                        <input
                          value={item.requiredPermission ?? ""}
                          onChange={(event) =>
                            setItems((current) =>
                              current.map((entry) =>
                                entry.id === item.id
                                  ? {
                                      ...entry,
                                      requiredPermission: event.target.value,
                                    }
                                  : entry,
                              ),
                            )
                          }
                          onBlur={(event) =>
                            void update(item, {
                              requiredPermission:
                                event.target.value.trim() || null,
                            })
                          }
                          placeholder="Required permission (optional)"
                          className="mt-1 w-full rounded-lg border border-transparent px-2 py-1 text-xs text-slate-500 outline-none focus:border-amber-300"
                        />
                        <p className="px-2 text-xs text-slate-400">
                          {item.route}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          void update(item, { enabled: !item.enabled })
                        }
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-bold ${
                          item.enabled
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        <Check className="h-3.5 w-3.5" />
                        {item.enabled ? "Shown" : "Hidden"}
                      </button>
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => void reorder(index, index - 1)}
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                        aria-label="Move up"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        disabled={index === items.length - 1}
                        onClick={() => void reorder(index, index + 1)}
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                        aria-label="Move down"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        disabled={item.isSystem}
                        onClick={() => void remove(item)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-700 disabled:opacity-30"
                        aria-label={`Remove ${item.label}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </article>
                ))}
                {items.length === 0 && (
                  <p className="py-8 text-center text-sm text-slate-500">
                    No navigation items configured.
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
