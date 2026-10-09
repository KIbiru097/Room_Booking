"use client"

// Reliable Wikipedia image used as fallback when a place has no photo.

// Add to Itinerary Modal State
// Storage unavailable (private mode or quota) — keep the in-memory state.
// Heritage visits participate in trip conflict detection. Keep a
// default duration when the place has no provider-supplied estimate.

// Highlights generator based on place data

// Localized category label; unmapped categories keep the raw enum value.
/* Navigation Bar */ /* Hero Card */ /* Main Photo */ /* Details Content */ /* Badges Bar */ /* 1. ABOUT SECTION */ /* 2. WHY IT MATTERS */ /* 3. WHAT YOU CAN SEE */ /* 4. VISITING INFORMATION */ /* 5. SOURCE & VERIFICATION */ /* NEARBY HOTELS */ /* STICKY BOTTOM ACTION BAR */ /* Add to Itinerary Modal */

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Check,
  Clock,
  ExternalLink,
  Heart,
  MapPin,
  Navigation,
  Phone,
  Plus,
  ShieldCheck,
  Sparkles,
  Star,
  X,
} from "lucide-react"
import { discoverApi, tripApi, type PlaceItem, type Trip } from "@/lib/services"
import { Button } from "@/components/ui/Button"
import { Skeleton } from "@/components/ui/Skeleton"
import { toast } from "@/components/ui/Toast"
import { useAuth } from "@/lib/auth-store"
import { useLanguage } from "@/lib/i18n"
import { localImage } from "@/lib/images"
const FALLBACK_IMAGE =
  "/images/mirror/960px-addis-ababa-from-entoto-mountains-a42e3b6a.jpg"

const PLACE_FAVORITES_KEY = "luxstay_place_favorites"

function readPlaceFavorites(): string[] {
  try {
    const parsed = JSON.parse(
      localStorage.getItem(PLACE_FAVORITES_KEY) ||
        "[]",
    )
    return Array.isArray(parsed)
      ? parsed.filter(
          (item): item is string =>
            typeof item ===
            "string",
        )
      : []
  } catch {
    return []
  }
}

const CATEGORY_TRANSLATION_KEYS: Record<string, string> = {
  HERITAGE: "categoryHeritage",
  HISTORIC: "categoryHeritage",
  CASTLE: "categoryCastle",
  MUSEUM: "categoryMuseum",
  RELIGIOUS: "categoryReligious",
  ARCHAEOLOGY: "categoryArchaeology",
  CULTURE: "categoryCulture",
  RESTAURANT: "categoryRestaurant",
  CAFE: "categoryCafe",
  ATTRACTION: "categoryAttraction",
  SHOPPING: "categoryShopping",
}

export default function DiscoverPlacePage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { t, language } = useLanguage()
  const id =
    typeof params.placeId ===
    "string"
      ? params.placeId
      : ""

  const [place, setPlace] = useState<PlaceItem | null>(null)
  const [nearbyHotels, setNearbyHotels] = useState<Array<{
    id: string
    name: string
    address: string
    starRating: number
    images: string[]
    distanceKm: number
  }>>([])
  const [nearbyHotelsLoading, setNearbyHotelsLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [heroImage, setHeroImage] = useState(FALLBACK_IMAGE)
  const [brokenHotelImages, setBrokenHotelImages] =
    useState<Record<string, boolean>>({})
  const [modalOpen, setModalOpen] = useState(false)
  const [userTrips, setUserTrips] = useState<Trip[]>([])
  const [selectedTripId, setSelectedTripId] = useState<string>("")
  const [dayDate, setDayDate] = useState<string>("")
  const [startTime, setStartTime] = useState<string>("10:00")
  const [notes, setNotes] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!id) return
    discoverApi
      .place(id)
      .then(async (res) => {
        setPlace(res)
        setHeroImage(
          localImage(res.images?.[0]) ||
            FALLBACK_IMAGE,
        )
        setBrokenHotelImages({})
        setNotes(t("discover", "exploreNote", { name: res.name }))
        setNearbyHotelsLoading(true)
        try {
          const hotels = await discoverApi.nearbyHotels(res.id, {
            radiusKm: 15,
            limit: 6,
          })
          setNearbyHotels(hotels.data)
        } catch {
          setNearbyHotels([])
        } finally {
          setNearbyHotelsLoading(false)
        }
      })
      .catch((err) =>
        setError(
          err?.message ||
            t("discover", "placeLoadError"),
        ),
      )
      .finally(() => setLoading(false))
  }, [id, t])

  useEffect(() => {
    if (!id) return
    setIsFavorite(readPlaceFavorites().includes(id))
  }, [id])

  const handleFavoriteToggle = () => {
    if (!place) return
    const next = !isFavorite
    setIsFavorite(next)

    const favorites = readPlaceFavorites()
    const updated = next
      ? [
          ...favorites.filter(
            (item) =>
              item !==
              place.id,
          ),
          place.id,
        ]
      : favorites.filter(
          (item) =>
            item !==
            place.id,
        )
    try {
      localStorage.setItem(PLACE_FAVORITES_KEY, JSON.stringify(updated))
    } catch {}

    toast.success(
      next
        ? t("heritage", "savedToFavorites")
        : t("heritage", "saveToFavorites"),
      place.name,
    )
  }

  const handleOpenAddModal = async () => {
    if (!user) {
      toast.info(
        t("discover", "signInRequired"),
        t("discover", "signInToSchedule"),
      )
      router.push("/auth")
      return
    }
    setModalOpen(true)
    try {
      const res = await tripApi.list()
      setUserTrips(res.data)
      if (
        res.data.length >
        0
      ) {
        setSelectedTripId(res.data[0].id)
        setDayDate(res.data[0].startDate.slice(0, 10))
      }
    } catch {
      setUserTrips([])
    }
  }

  const handleAddToTrip = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTripId || !place || !dayDate) return

    setSubmitting(true)
    try {
      await tripApi.addItem(selectedTripId, {
        placeId: place.id,
        title: t("discover", "visit", { name: place.name }),
        dayDate,
        startTime:
          startTime ||
          undefined,
        durationMin: 90,
        notes,
        itemType: "PLACE",
        currency: "ETB",
      })
      toast.success(
        t("discover", "addedTitle"),
        t("discover", "addedToTripBody", { name: place.name }),
      )
      setModalOpen(false)
    } catch (err) {
      toast.error(
        t("discover", "failedAddPlace"),
        err instanceof
          Error
          ? err.message
          : t("discover", "checkTripDates"),
      )
    } finally {
      setSubmitting(false)
    }
  }

  const navigationUrl = useMemo(() => {
    if (!place?.lat || !place?.lng) return "#"
    return `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`
  }, [place])
  const highlights = useMemo(() => {
    if (!place) return []
    let group = "highlightDefault"
    if (
      place.category ===
        "HERITAGE" ||
      place.category ===
        "CASTLE"
    ) {
      group = "highlightHeritage"
    } else if (
      place.category ===
      "MUSEUM"
    ) {
      group = "highlightMuseum"
    } else if (
      place.category ===
      "RELIGIOUS"
    ) {
      group = "highlightReligious"
    }
    return [1, 2, 3].map((index) => t("discover", `${group}${index}`))
  }, [place, t])
  const categoryLabel = useMemo(() => {
    if (!place) return ""
    const key = CATEGORY_TRANSLATION_KEYS[place.category]
    if (!key) return place.category
    const label = t("heritage", key)
    return label === key ? place.category : label
  }, [place, t])

  const verifiedDate = useMemo(() => {
    if (!place?.lastVerifiedAt) return ""
    return new Intl.DateTimeFormat(language === "am" ? "am-ET" : "en-GB", {
      dateStyle: "medium",
    }).format(new Date(place.lastVerifiedAt))
  }, [place, language])

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-10 sm:px-6">
        <Skeleton className="h-6 w-32 rounded-xl" />
        <Skeleton className="aspect-[16/8] w-full rounded-3xl" />
        <Skeleton className="h-56 w-full rounded-3xl" />
      </main>
    )
  }

  if (error || !place) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-sm font-semibold text-red-600">
          {error || t("discover", "placeNotFound")}
        </p>
        <Button
          className="mt-5 rounded-2xl bg-[#0b1528] text-xs font-bold text-white"
          onClick={() => router.push("/discover")}
        >
          {t("discover", "backToDiscover")}
        </Button>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#FAF8F5] dark:bg-[#07111f] pb-28 text-slate-800 dark:text-slate-200 antialiased">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        {}
        <div className="flex items-center justify-between">
          <Link
            href="/discover"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs font-bold text-[#0b1528] shadow-sm backdrop-blur-md transition hover:border-[#e4bd55] hover:bg-white dark:border-slate-700 dark:bg-slate-900/80 dark:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> {t("discover", "backToDiscover")}
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleFavoriteToggle}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition backdrop-blur-md shadow-sm ${
                isFavorite
                  ? "border-red-400 bg-red-500 text-white"
                  : "border-slate-200 bg-white/80 text-slate-600 hover:text-red-500 dark:border-slate-700 dark:bg-slate-900/80"
              }`}
              aria-label={t("heritage", "saveToFavorites")}
            >
              <Heart
                className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`}
              />
            </button>
            <Button
              size="md"
              onClick={handleOpenAddModal}
              leftIcon={<Plus className="h-4 w-4 text-[#e4bd55]" />}
              className="rounded-full bg-[#0b1528] px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-[#12233a]"
            >
              {t("discover", "addToItinerary")}
            </Button>
          </div>
        </div>

        {}
        <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
          {}
          <div className="relative h-56 sm:aspect-[16/8] sm:h-auto bg-slate-100 overflow-hidden">
            <Image
              src={heroImage}
              alt={
                language === "am" && place.amharicName
                  ? place.amharicName
                  : place.name
              }
              fill
              priority
              sizes="(min-width: 1024px) 1000px, 100vw"
              className="object-cover"
              onError={() => setHeroImage(FALLBACK_IMAGE)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b1528]/90 via-[#0b1528]/40 to-[#0b1528]/10" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0b1528]/50 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 flex flex-wrap items-end justify-between gap-4 text-white">
              <div>
                <span className="rounded-full bg-[#e4bd55] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#0b1528] shadow-sm">
                  {categoryLabel}
                </span>
                <h1 className="mt-2 font-serif text-3xl font-bold sm:text-5xl tracking-tight text-white leading-tight">
                  {place.name}
                </h1>
                {place.amharicName && (
                  <p className="text-base font-semibold text-[#e4bd55] mt-1">
                    {place.amharicName}
                  </p>
                )}
              </div>
              {place.distanceKm !== undefined && (
                <div className="rounded-xl bg-white/20 backdrop-blur-md px-3.5 py-1.5 text-xs font-bold text-white border border-white/30 shadow-lg">
                  {t("discover", "distanceAway", { km: place.distanceKm })}
                </div>
              )}
            </div>
          </div>

          {}
          <div className="p-6 sm:p-10 space-y-10">
            {}
            <div className="flex flex-wrap items-center gap-3">
              {place.hoursVerified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800">
                  <ShieldCheck className="h-3.5 w-3.5" />{" "}
                  {t("discover", "verifiedHours")}
                </span>
              )}
              {place.priceLevel && (
                <span className="rounded-full bg-slate-100 px-3.5 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {t("discover", "priceLabel", {
                    level: Array(place.priceLevel).fill("$").join(""),
                  })}
                </span>
              )}
              {place.rating != null && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3.5 py-1 text-xs font-bold text-[#B8860B] border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
                  <Star className="h-3.5 w-3.5 fill-current" />{" "}
                  {place.rating.toFixed(1)}
                </span>
              )}
            </div>

            {}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#e4bd55]">
                {t("discover", "historicalContext")}
              </span>
              <h2 className="font-serif text-2xl font-bold text-[#0b1528]">
                {t("discover", "aboutLandmark")}
              </h2>
              <p className="text-sm sm:text-base leading-relaxed text-slate-700">
                {place.description}
              </p>
              {place.amharicDescription && (
                <p className="text-sm leading-relaxed text-slate-600 italic border-l-2 border-[#e4bd55] pl-4 mt-2">
                  {place.amharicDescription}
                </p>
              )}
            </div>

            {}
            <div className="rounded-2xl border border-[#e4bd55]/25 bg-[#FEF9E7]/80 p-6 space-y-2 dark:bg-[#e4bd55]/5 dark:border-[#e4bd55]/20">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#e4bd55]">
                {t("discover", "whyItMattersLabel")}
              </span>
              <h3 className="font-serif text-xl font-bold text-[#0b1528] dark:text-white">
                {t("discover", "whyItMatters")}
              </h3>
              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {t("discover", "whyItMattersBody", { name: place.name })}
              </p>
            </div>

            {}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#e4bd55]">
                {t("discover", "visitorHighlightsLabel")}
              </span>
              <h3 className="font-serif text-xl font-bold text-[#0b1528]">
                {t("discover", "whatYouCanSee")}
              </h3>
              <ul className="grid gap-2.5 sm:grid-cols-2 text-sm text-slate-700">
                {highlights.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2.5 rounded-xl bg-white border border-slate-200/80 p-3.5 dark:bg-slate-800 dark:border-slate-700"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {}
            <div className="border-t border-slate-100 pt-6 space-y-4">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#e4bd55]">
                {t("discover", "visitorGuideLabel")}
              </span>
              <h3 className="font-serif text-xl font-bold text-[#0b1528]">
                {t("discover", "visitingInformation")}
              </h3>

              <div className="grid gap-4 sm:grid-cols-2 text-sm text-slate-600 dark:text-slate-300">
                <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4 border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#e4bd55]" />
                  <div>
                    <span className="font-bold text-[#0b1528] dark:text-white">
                      {t("discover", "address")}
                    </span>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      {place.address}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4 border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
                  <Clock className="mt-0.5 h-5 w-5 shrink-0 text-[#e4bd55]" />
                  <div>
                    <span className="font-bold text-[#0b1528] dark:text-white">
                      {t("discover", "hours")}
                    </span>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      {place.openingHours || t("discover", "hoursMayVary")}
                    </p>
                  </div>
                </div>

                {place.phone && (
                  <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4 border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
                    <Phone className="mt-0.5 h-5 w-5 shrink-0 text-[#e4bd55]" />
                    <div>
                      <span className="font-bold text-[#0b1528] dark:text-white">
                        {t("discover", "phone")}
                      </span>
                      <a
                        href={`tel:${place.phone}`}
                        className="block text-xs font-bold text-[#0b1528] hover:text-[#e4bd55] dark:text-slate-300 mt-1"
                      >
                        {place.phone}
                      </a>
                    </div>
                  </div>
                )}

                {place.website && (
                  <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4 border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
                    <ExternalLink className="mt-0.5 h-5 w-5 shrink-0 text-[#e4bd55]" />
                    <div>
                      <span className="font-bold text-[#0b1528] dark:text-white">
                        {t("discover", "website")}
                      </span>
                      <a
                        href={place.website}
                        target="_blank"
                        rel="noreferrer"
                        className="block text-xs font-bold text-[#0b1528] hover:text-[#e4bd55] dark:text-slate-300 mt-1"
                      >
                        {t("discover", "visitPortal")}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-slate-50 p-5 text-xs text-slate-500 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-bold text-[#0b1528]">
                    {t("discover", "sourceLabel")}{" "}
                    {place.source?.name ||
                      t("discover", "verifiedOfficialRecords")}
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {place.source?.license
                      ? `${t("discover", "licenseLabel")} ${place.source.license}`
                      : t("discover", "osmContributors")}{" "}
                    ·{" "}
                    {verifiedDate
                      ? t("discover", "lastChecked", { date: verifiedDate })
                      : t("discover", "institutionalRegistry")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {}
        <section
          className="mt-10 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8"
          aria-labelledby="nearby-hotels"
        >
          <div className="border-b border-slate-100 pb-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#e4bd55]">
              {t("discover", "stayNearbyLabel")}
            </p>
            <h2
              id="nearby-hotels"
              className="mt-1 font-serif text-2xl font-bold text-[#0b1528]"
            >
              {t("discover", "nearbyHotelsTitle")}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {t("discover", "nearbyHotelsSubtitle")}
            </p>
          </div>

          {nearbyHotelsLoading ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <Skeleton key={item} className="h-32 rounded-2xl" />
              ))}
            </div>
          ) : nearbyHotels.length > 0 ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {nearbyHotels.map((hotel) => (
                <Link
                  key={hotel.id}
                  href={`/hotel/${hotel.id}`}
                  className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition hover:-translate-y-1 hover:border-[#e4bd55] hover:bg-white hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-750"
                >
                  <div className="relative mb-3 aspect-[16/8] overflow-hidden rounded-xl bg-slate-200">
                    <Image
                      src={
                        brokenHotelImages[hotel.id]
                          ? FALLBACK_IMAGE
                          : localImage(hotel.images?.[0]) || FALLBACK_IMAGE
                      }
                      alt={hotel.name}
                      fill
                      sizes="(min-width: 1024px) 280px, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition duration-500 group-hover:scale-105"
                      onError={() =>
                        setBrokenHotelImages((previous) => ({
                          ...previous,
                          [hotel.id]: true,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="truncate font-serif font-bold text-[#0b1528] group-hover:text-[#B8860B]">
                        {hotel.name}
                      </h3>
                      <span className="shrink-0 text-xs font-bold text-[#B8860B]">
                        <Star className="mr-0.5 inline h-3.5 w-3.5 fill-current" />
                        {hotel.starRating}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                      {hotel.address}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-200/60 pt-3 text-xs font-bold text-[#0b1528]">
                    <span className="text-[#B8860B]">
                      {hotel.distanceKm < 1
                        ? `${Math.round(hotel.distanceKm * 1000)} m`
                        : `${hotel.distanceKm.toFixed(1)} km`}
                    </span>
                    <span className="rounded-xl bg-[#0b1528] px-3 py-1 text-[11px] font-bold text-white shadow-sm">
                      {t("heritage", "bookStay")}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-6 rounded-2xl bg-slate-50 p-5 text-xs text-slate-500 text-center">
              {t("discover", "nearbyHotelsEmpty")}
            </p>
          )}
        </section>
      </div>

      {}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/95 px-4 py-3 shadow-2xl backdrop-blur-md dark:border-slate-800 dark:bg-[#07111f]/95">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div className="hidden sm:block min-w-0">
            <h4 className="truncate font-serif text-sm font-bold text-[#0b1528] dark:text-white">
              {place.name}
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {categoryLabel}
            </p>
          </div>
          <div className="flex w-full sm:w-auto items-center gap-2">
            <Button
              onClick={handleOpenAddModal}
              leftIcon={<Plus className="h-4 w-4 text-[#e4bd55]" />}
              className="min-h-[44px] flex-1 rounded-xl bg-[#0b1528] px-5 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-[#12233a] sm:flex-initial"
            >
              {t("heritage", "addToTrip")}
            </Button>
            <a
              href={navigationUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:border-[#e4bd55] hover:text-[#0b1528] shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            >
              <Navigation className="mr-1.5 h-4 w-4 text-[#e4bd55]" />{" "}
              {t("heritage", "navigate")}
            </a>
            {place.cityId && (
              <Link
                href={`/discover/heritage/${place.cityId}`}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-[#0b1528] hover:border-[#e4bd55] hover:bg-[#e4bd55]/10 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                <Sparkles className="mr-1.5 h-4 w-4 text-[#e4bd55]" />{" "}
                {t("heritage", "askAiAboutPlace")}
              </Link>
            )}
          </div>
        </div>
      </div>

      {}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200 dark:bg-slate-900">
            <div className="flex items-center justify-between bg-[#0b1528] px-6 py-4 text-white">
              <h3 className="font-serif text-lg font-bold">
                {t("discover", "scheduleLandmark")}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-white/70 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddToTrip} className="p-6 space-y-4">
              <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#e4bd55]">
                  {t("discover", "selectedPlace")}
                </p>
                <h4 className="font-serif text-base font-bold text-[#0b1528] dark:text-white">
                  {place.name}
                </h4>
              </div>

              {userTrips.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-xs text-slate-500 mb-3">
                    {t("discover", "noItineraryYet")}
                  </p>
                  <Link
                    href="/trips"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#0b1528] px-4 py-2 text-xs font-bold text-white"
                  >
                    <Plus className="h-3.5 w-3.5" />{" "}
                    {t("discover", "createTripFirst")}
                  </Link>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500">
                      {t("discover", "tripItinerary")}
                    </label>
                    <select
                      value={selectedTripId}
                      onChange={(e) => {
                        setSelectedTripId(e.target.value)
                        const foundTrip = userTrips.find(
                          (item) => item.id === e.target.value,
                        )
                        if (foundTrip)
                          setDayDate(foundTrip.startDate.slice(0, 10))
                      }}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-[#e4bd55] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      required
                    >
                      {userTrips.map((trip) => (
                        <option key={trip.id} value={trip.id}>
                          {t("discover", "tripOption", {
                            title: trip.title,
                            from: trip.startDate.slice(0, 10),
                            to: trip.endDate.slice(0, 10),
                          })}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-500">
                        {t("discover", "date")}
                      </label>
                      <input
                        type="date"
                        value={dayDate}
                        onChange={(e) => setDayDate(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#e4bd55]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-500">
                        {t("discover", "timeSlot")}
                      </label>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#e4bd55]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500">
                      {t("discover", "note")}
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#e4bd55]"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl"
                    >
                      {t("discover", "cancel")}
                    </button>
                    <Button
                      type="submit"
                      loading={submitting}
                      className="bg-[#0b1528] text-xs font-bold text-white hover:bg-[#1E3A5F]"
                    >
                      {t("discover", "confirmAdd")}
                    </Button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
