"use client"

import { FormEvent, useCallback, useEffect, useState } from "react"
import {
  CheckCircle2,
  ExternalLink,
  FileText,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  ShieldCheck,
} from "lucide-react"
import AuthGate from "@/components/AuthGate"
import {
  adminContentApi,
  type AdminContentCity,
  type AdminContentPlace,
  type AdminContentSource,
  type AdminContentStatus,
} from "@/lib/services"
import KnowledgeDocumentPanel from "./KnowledgeDocumentPanel"
import ModerationTransitionPanel from "./ModerationTransitionPanel"
import CoordinatePreview from "./CoordinatePreview"
import MediaUrlsField from "./MediaUrlsField"

const statuses: AdminContentStatus[] = [
  "DRAFT",
  "PENDING_REVIEW",
  "PUBLISHED",
  "REJECTED",
  "ARCHIVED",
]
const categories = [
  "HERITAGE",
  "MUSEUM",
  "ATTRACTION",
  "RESTAURANT",
  "CAFE",
  "CULTURE",
  "OTHER",
]

export default function AdminContentPage() {
  return (
    <AuthGate roles={["ADMIN"]}>
      <AdminContentConsole />
    </AuthGate>
  )
}

function AdminContentConsole() {
  const [countries, setCountries] = useState<Array<{
    id: string
    name: string
    code: string
  }>>([])
  const [cities, setCities] = useState<AdminContentCity[]>([])
  const [sources, setSources] = useState<AdminContentSource[]>([])
  const [places, setPlaces] = useState<AdminContentPlace[]>([])
  const [status, setStatus] = useState<AdminContentStatus | "">("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [city, setCity] = useState({ name: "", countryId: "" })
  const [source, setSource] = useState({
    name: "",
    url: "",
    license: "",
    verifiedBy: "",
  })
  const [place, setPlace] = useState({
    name: "",
    description: "",
    address: "",
    category: "HERITAGE",
    cityId: "",
    sourceId: "",
    lat: "9.0105",
    lng: "38.7612",
    amharicName: "",
    images: "",
    status: "DRAFT" as AdminContentStatus,
  })

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const [countryData, cityData, sourceData, placeData] = await Promise.all([
        adminContentApi.countries(),
        adminContentApi.cities(),
        adminContentApi.sources(),
        adminContentApi.places(status ? { status } : undefined),
      ])
      setCountries(countryData)
      setCities(cityData)
      setSources(sourceData)
      setPlaces(placeData.data)
      setCity((current) => ({
        ...current,
        countryId: current.countryId || countryData[0]?.id || "",
      }))
      setPlace((current) => ({
        ...current,
        cityId: current.cityId || cityData[0]?.id || "",
        sourceId: current.sourceId || sourceData[0]?.id || "",
      }))
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load content administration data.",
      )
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    void load()
  }, [load])

  const submit = async (event: FormEvent, action: () => Promise<unknown>) => {
    event.preventDefault()
    setSaving(true)
    setMessage("")
    setError("")
    try {
      await action()
      setMessage("Saved successfully.")
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.")
    } finally {
      setSaving(false)
    }
  }

  const createPlace = (event: FormEvent) =>
    submit(event, async () => {
      await adminContentApi.createPlace({
        ...place,
        lat: Number(place.lat),
        lng: Number(place.lng),
        cityId: place.cityId || null,
        sourceId: place.sourceId,
        amharicName: place.amharicName || null,
        images: place.images
          .split(/\r?\n/)
          .map((url) => url.trim())
          .filter(Boolean),
      })
      setPlace((current) => ({
        ...current,
        name: "",
        description: "",
        address: "",
        amharicName: "",
        images: "",
      }))
    })

  if (loading && places.length === 0)
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading content console…
      </div>
    )

  return (
    <main className="admin-content-console min-h-screen bg-[#f3efe5] px-4 py-8 text-slate-800 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#e4bd55]">
              Phase 6 · Content administration
            </p>
            <h1 className="mt-1 font-serif text-3xl font-bold text-[#0b1528]">
              Discover content console
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Onboard cities, verify sources, and publish only attributed places
              to the public Discover experience.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-[#0b1528] shadow-sm hover:border-[#e4bd55]"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
        {message && (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            {message}
          </div>
        )}
        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 font-serif text-xl font-bold text-[#0b1528]">
              <MapPin className="h-5 w-5 text-[#e4bd55]" />
              Onboard city
            </h2>
            <form
              onSubmit={(e) =>
                submit(e, async () => {
                  await adminContentApi.createCity(city)
                  setCity((c) => ({ ...c, name: "" }))
                })
              }
              className="mt-4 space-y-3"
            >
              <input
                required
                value={city.name}
                onChange={(e) => setCity({ ...city, name: e.target.value })}
                placeholder="City name"
                className="field"
              />
              <select
                required
                value={city.countryId}
                onChange={(e) =>
                  setCity({ ...city, countryId: e.target.value })
                }
                className="field"
              >
                <option value="">Select country</option>
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button disabled={saving} className="action">
                <Plus className="h-4 w-4" />
                Add city
              </button>
            </form>
            <p className="mt-4 text-xs text-slate-500">
              {cities.length} cities configured ·{" "}
              {cities.reduce((n, c) => n + (c._count?.places ?? 0), 0)} places
              linked
            </p>
          </section>
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 font-serif text-xl font-bold text-[#0b1528]">
              <ShieldCheck className="h-5 w-5 text-[#e4bd55]" />
              Register source
            </h2>
            <form
              onSubmit={(e) =>
                submit(e, async () => {
                  await adminContentApi.createSource(source)
                  setSource({ name: "", url: "", license: "", verifiedBy: "" })
                })
              }
              className="mt-4 space-y-3"
            >
              <input
                required
                value={source.name}
                onChange={(e) => setSource({ ...source, name: e.target.value })}
                placeholder="Source name"
                className="field"
              />
              <input
                type="url"
                value={source.url}
                onChange={(e) => setSource({ ...source, url: e.target.value })}
                placeholder="Source URL"
                className="field"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={source.license}
                  onChange={(e) =>
                    setSource({ ...source, license: e.target.value })
                  }
                  placeholder="License"
                  className="field"
                />
                <input
                  value={source.verifiedBy}
                  onChange={(e) =>
                    setSource({ ...source, verifiedBy: e.target.value })
                  }
                  placeholder="Verified by"
                  className="field"
                />
              </div>
              <button disabled={saving} className="action">
                <Plus className="h-4 w-4" />
                Add source
              </button>
            </form>
            <p className="mt-4 text-xs text-slate-500">
              {sources.length} verified source records
            </p>
          </section>
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 font-serif text-xl font-bold text-[#0b1528]">
              <FileText className="h-5 w-5 text-[#e4bd55]" />
              Publication rules
            </h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                Drafts stay private.
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                Only attributed places can publish.
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                Every action is audit logged.
              </li>
            </ul>
          </section>
        </div>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-serif text-xl font-bold text-[#0b1528]">
            Add place
          </h2>
          <form
            onSubmit={createPlace}
            className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          >
            <input
              required
              value={place.name}
              onChange={(e) => setPlace({ ...place, name: e.target.value })}
              placeholder="Place name"
              className="field"
            />
            <input
              value={place.amharicName}
              onChange={(e) =>
                setPlace({ ...place, amharicName: e.target.value })
              }
              placeholder="Amharic name"
              className="field"
            />
            <input
              required
              value={place.address}
              onChange={(e) => setPlace({ ...place, address: e.target.value })}
              placeholder="Address"
              className="field"
            />
            <select
              required
              value={place.category}
              onChange={(e) => setPlace({ ...place, category: e.target.value })}
              className="field"
            >
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <textarea
              required
              minLength={10}
              value={place.description}
              onChange={(e) =>
                setPlace({ ...place, description: e.target.value })
              }
              placeholder="Verified description"
              className="field min-h-20 sm:col-span-2"
            />
            <select
              required
              value={place.cityId}
              onChange={(e) => setPlace({ ...place, cityId: e.target.value })}
              className="field"
            >
              <option value="">City</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              required
              value={place.sourceId}
              onChange={(e) => setPlace({ ...place, sourceId: e.target.value })}
              className="field"
            >
              <option value="">Source</option>
              {sources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <input
              required
              type="number"
              step="any"
              value={place.lat}
              onChange={(e) => setPlace({ ...place, lat: e.target.value })}
              placeholder="Latitude"
              className="field"
            />
            <input
              required
              type="number"
              step="any"
              value={place.lng}
              onChange={(e) => setPlace({ ...place, lng: e.target.value })}
              placeholder="Longitude"
              className="field"
            />
            <select
              value={place.status}
              onChange={(e) =>
                setPlace({
                  ...place,
                  status: e.target.value as AdminContentStatus,
                })
              }
              className="field"
            >
              <option value="DRAFT">Draft</option>
              <option value="PENDING_REVIEW">Pending review</option>
            </select>
            <button disabled={saving || !place.sourceId} className="action">
              <Plus className="h-4 w-4" />
              Create place
            </button>
          </form>
        </section>
        <CoordinatePreview lat={place.lat} lng={place.lng} />
        <MediaUrlsField
          value={place.images}
          onChange={(images) => setPlace((current) => ({ ...current, images }))}
        />

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-serif text-xl font-bold text-[#0b1528]">
              Place moderation
            </h2>
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as AdminContentStatus | "")
              }
              className="field max-w-48"
            >
              <option value="">All statuses</option>
              {statuses.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-3">Place</th>
                  <th className="px-3 py-3">City</th>
                  <th className="px-3 py-3">Source</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {places.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100">
                    <td className="px-3 py-3">
                      <div className="font-bold text-[#0b1528]">
                        {item.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {item.category} · {item.lat.toFixed(4)},{" "}
                        {item.lng.toFixed(4)}
                      </div>
                    </td>
                    <td className="px-3 py-3">{item.city?.name ?? "—"}</td>
                    <td className="px-3 py-3">
                      {item.source ? (
                        <a
                          className="inline-flex items-center gap-1 text-[#2563EB] hover:underline"
                          href={item.source.url ?? "#"}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {item.source.name}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        "Missing"
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold">
                        {item.status}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex gap-2">
                        {item.status !== "PUBLISHED" && (
                          <button
                            onClick={() =>
                              void submit(
                                { preventDefault() {} } as FormEvent,
                                () =>
                                  adminContentApi.updatePlaceStatus(
                                    item.id,
                                    "PUBLISHED",
                                  ),
                              )
                            }
                            className="rounded-lg bg-[#0b1528] px-3 py-1.5 text-xs font-bold text-white"
                          >
                            Publish
                          </button>
                        )}
                        {item.status !== "ARCHIVED" && (
                          <button
                            onClick={() =>
                              void submit(
                                { preventDefault() {} } as FormEvent,
                                () =>
                                  adminContentApi.updatePlaceStatus(
                                    item.id,
                                    "ARCHIVED",
                                  ),
                              )
                            }
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600"
                          >
                            Archive
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {places.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-500">
                No places match this filter.
              </p>
            )}
          </div>
        </section>
        <KnowledgeDocumentPanel />
        <ModerationTransitionPanel places={places} onUpdated={load} />
      </div>
    </main>
  )
}
