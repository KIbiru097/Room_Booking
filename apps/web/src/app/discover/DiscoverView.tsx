"use client" /* ══════════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════════ */ /* Layered overlays for depth */ /* Floating save counter */ /* Eyebrow */ /* Display heading */ /* Integrated search bar */ /* Hero quick links */ /* ══════════════════════════════════════════════════════════════
          NEIGHBORHOOD + RADIUS BAR
      ══════════════════════════════════════════════════════════════ */ /* Stale offline banner */ /* ══════════════════════════════════════════════════════════════
          WELCOME STRIP
      ══════════════════════════════════════════════════════════════ */ /* ══════════════════════════════════════════════════════════════
            DESTINATIONS SHOWCASE
        ══════════════════════════════════════════════════════════════ */ /* Category chips */ /* Destination grid — first card spans 2 cols */ /* Gradient */ /* Tag */ /* Heart */ /* Content */ /* ══════════════════════════════════════════════════════════════
            STAY CONTEXT BANNER
        ══════════════════════════════════════════════════════════════ */ /* ══════════════════════════════════════════════════════════════
            CURATED COLLECTIONS
        ══════════════════════════════════════════════════════════════ */ /* ══════════════════════════════════════════════════════════════
            EDITORIAL ITINERARY ROUTES
        ══════════════════════════════════════════════════════════════ */ /* Featured route — rich editorial card */ /* Mini routes */ /* ══════════════════════════════════════════════════════════════
            LIVE PLACES EXPLORER
        ══════════════════════════════════════════════════════════════ */ /* Section header + controls */ /* View toggle */ /* Category tabs */ /* ── MAP VIEW ── */ /* ── GRID VIEW ── */ /* Image */ /* Category pill */ /* Distance badge */ /* Body */ /* Meta */ /* Actions */ /* ══════════════════════════════════════════════════════════════
            BRAND PROMISE
        ══════════════════════════════════════════════════════════════ */ /* ══════════════════════════════════════════════════════════════
          ADD TO ITINERARY MODAL
      ══════════════════════════════════════════════════════════════ */ /* Modal header */ /* Place info */

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import dynamic from "next/dynamic"
import {
  ArrowRight,
  Building2,
  Check,
  ChevronRight,
  Coffee,
  Compass,
  Heart,
  HeartPulse,
  Landmark,
  List,
  Map as MapIcon,
  MapPin,
  Navigation,
  Phone,
  Plus,
  Search,
  ShieldAlert,
  Sparkles,
  Star,
  UtensilsCrossed,
  X,
} from "lucide-react"
import {
  discoverApi,
  tripApi,
  type PlaceItem,
  type EmergencyContactItem,
  type DestinationItem,
  type DestinationDetail,
  type Trip,
} from "@/lib/services"
import { Button } from "@/components/ui/Button"
import { Skeleton } from "@/components/ui/Skeleton"
import { EmptyState } from "@/components/ui/EmptyState"
import { toast } from "@/components/ui/Toast"
import { useAuth } from "@/lib/auth-store"
import { useLanguage } from "@/lib/i18n"
import {
  formatCacheAge,
  readCachedValue,
  writeCachedValue,
} from "@/lib/offline-cache"
import { localImage } from "@/lib/images"

const HeritageMap = dynamic(() => import("./HeritageMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm font-medium text-slate-500">
      Loading interactive map…
    </div>
  ),
})

type Tab = "all" | "heritage" | "dining" | "attractions" | "emergency"
type ViewMode = "list" | "map"
type DestinationCategory = "For you" | "Heritage" | "Nature" | "Culture" | "City" | "Food"

interface DiscoverSnapshot {
  places?: PlaceItem[]
  emergencyContacts?: EmergencyContactItem[]
  destinationDetail?: DestinationDetail | null
}

interface Neighborhood {
  id: string
  name: string
  nameAm: string
  lat: number
  lng: number
  description: string
}

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371
  const toRad = (v: number) => (v * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const NEIGHBORHOODS: Neighborhood[] = [
  {
    id: "all",
    name: "Addis Ababa",
    nameAm: "አዲስ አበባ",
    lat: 9.0105,
    lng: 38.7612,
    description: "City center & Meskel Square hub",
  },
  {
    id: "bole",
    name: "Bole",
    nameAm: "ቦሌ",
    lat: 8.995,
    lng: 38.788,
    description: "Airport corridor, modern cafes & nightlife",
  },
  {
    id: "kazanchis",
    name: "Kazanchis",
    nameAm: "ካዛንቺስ",
    lat: 9.0175,
    lng: 38.768,
    description: "UNECA district, jazz clubs & dining",
  },
  {
    id: "piazza",
    name: "Piazza",
    nameAm: "ፒያሳ",
    lat: 9.035,
    lng: 38.752,
    description: "Historic architecture, Tomoca & jewelers",
  },
  {
    id: "arat_kilo",
    name: "Arat Kilo",
    nameAm: "አራት ኪሎ",
    lat: 9.038,
    lng: 38.763,
    description: "National Museum, palaces & universities",
  },
  {
    id: "entoto",
    name: "Entoto",
    nameAm: "እንጦጦ",
    lat: 9.085,
    lng: 38.76,
    description: "Panoramic mountain viewpoints",
  },
]

const CATEGORY_ICONS: Record<string, typeof Landmark> = {
  HERITAGE: Landmark,
  MUSEUM: Landmark,
  RESTAURANT: UtensilsCrossed,
  CAFE: Coffee,
  COFFEE: Coffee,
  ATTRACTION: Compass,
  SHOPPING: Sparkles,
  HOSPITAL: HeartPulse,
  EMERGENCY: ShieldAlert,
}

const DESTINATION_TAGS_EN: Record<string, string> = {
  gondar: "destTagGondar",
  lalibela: "destTagLalibela",
  "bahir dar": "destTagBahirDar",
  harar: "destTagHarar",
  "addis ababa": "destTagAddis",
  aksum: "destTagAksum",
}

const FALLBACK_IMGS: Record<string, string> = {
  gondar:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/ET_Gondar_asv2018-02_img18_Fasil_Ghebbi.jpg/960px-ET_Gondar_asv2018-02_img18_Fasil_Ghebbi.jpg",
  lalibela:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Bete_Giyorgis_Lalibela_Ethiopia.jpg/960px-Bete_Giyorgis_Lalibela_Ethiopia.jpg",
  "bahir dar":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Blue_Nile_Falls_Ethiopia.jpg/960px-Blue_Nile_Falls_Ethiopia.jpg",
  harar:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/City_Gate%2C_Harar_Jugol_%2814464345823%29.jpg/960px-City_Gate%2C_Harar_Jugol_%2814464345823%29.jpg",
  "addis ababa":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Addis_Ababa_from_Entoto_Mountains.jpg/960px-Addis_Ababa_from_Entoto_Mountains.jpg",
  aksum:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Stela_in_Main_Stelae_Field_-_Axum_%28Aksum%29_-_Ethiopia_-_01_%288701108913%29.jpg/960px-Stela_in_Main_Stelae_Field_-_Axum_%28Aksum%29_-_Ethiopia_-_01_%288701108913%29.jpg",
}

const PLACE_FALLBACK =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Addis_Ababa_from_Entoto_Mountains.jpg/960px-Addis_Ababa_from_Entoto_Mountains.jpg"

interface DiscoverViewProps {
  initialDestinations?: DestinationItem[]
  initialPlaces?: PlaceItem[]
}

export default function DiscoverView({
  initialDestinations = [],
  initialPlaces = [],
}: DiscoverViewProps) {
  const { user } = useAuth()
  const { t, language } = useLanguage()

  const [tab, setTab] = useState<Tab>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [destCategory, setDestCategory] =
    useState<DestinationCategory>("For you")
  const [selectedNeighborhood, setSelectedNeighborhood] =
    useState<Neighborhood>(NEIGHBORHOODS[0])
  const [radiusKm, setRadiusKm] = useState(10)
  const [userLocation, setUserLocation] = useState<{
    lat: number
    lng: number
  } | null>(null)
  const [locating, setLocating] = useState(false)
  const [places, setPlaces] = useState<PlaceItem[]>(initialPlaces)
  const [destinations, setDestinations] =
    useState<DestinationItem[]>(initialDestinations)
  const [emergencyContacts, setEmergencyContacts] =
    useState<EmergencyContactItem[]>([])
  const [loading, setLoading] = useState(initialPlaces.length === 0)
  const [staleAt, setStaleAt] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null)
  const [savedPlaces, setSavedPlaces] = useState<string[]>([])

  const [addToTripModalOpen, setAddToTripModalOpen] = useState(false)
  const [placeToAddToTrip, setPlaceToAddToTrip] = useState<PlaceItem | null>(
    null,
  )
  const [userTrips, setUserTrips] = useState<Trip[]>([])
  const [selectedTripId, setSelectedTripId] = useState<string>("")
  const [tripItemDate, setTripItemDate] = useState<string>("")
  const [tripItemTime, setTripItemTime] = useState<string>("10:00")
  const [tripItemNotes, setTripItemNotes] = useState<string>("")
  const [addingToTrip, setAddingToTrip] = useState(false)

  const selectedPlace = useMemo(
    () => places.find((p) => p.id === selectedPlaceId) ?? null,
    [places, selectedPlaceId],
  )

  const cacheKey = useMemo(
    () =>
      [
        "discover-ethiopia",
        tab,
        searchQuery.trim().toLowerCase(),
        "all",
        selectedNeighborhood.id,
        radiusKm,
        userLocation?.lat ?? selectedNeighborhood.lat,
        userLocation?.lng ?? selectedNeighborhood.lng,
      ].join(":"),
    [tab, searchQuery, selectedNeighborhood.id, radiusKm, userLocation],
  )

  const searchCenter = userLocation ?? selectedNeighborhood

  const requestUserLocation = () => {
    if (!navigator.geolocation) {
      toast.error(
        t("discover", "locationUnavailable"),
        t("discover", "locationUnavailableBody"),
      )
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocating(false)
        toast.success(
          t("discover", "locationEnabled"),
          t("discover", "locationEnabledBody"),
        )
      },
      () => {
        setLocating(false)
        toast.error(
          t("discover", "locationPermissionNeeded"),
          t("discover", "locationPermissionNeededBody"),
        )
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    )
  }

  const toggleSaveCity = (cityName: string) => {
    setSavedPlaces((prev) => {
      const exists = prev.includes(cityName)
      toast.success(
        exists
          ? t("heritage", "saveToFavorites")
          : t("heritage", "savedToFavorites"),
        cityName,
      )
      return exists ? prev.filter((x) => x !== cityName) : [...prev, cityName]
    })
  }

  useEffect(() => {
    if (initialDestinations.length > 0) return
    discoverApi
      .destinations(50)
      .then(setDestinations)
      .catch(() => setDestinations([]))
  }, [initialDestinations])

  const placesHydratedRef = useRef(false)
  useEffect(() => {
    let cancelled = false
    const isInitialLoad = !placesHydratedRef.current
    placesHydratedRef.current = true

    if (
      isInitialLoad &&
      initialPlaces.length > 0 &&
      tab === "all" &&
      !searchQuery.trim()
    ) {
      setLoading(false)
      writeCachedValue<DiscoverSnapshot>(cacheKey, {
        places: initialPlaces,
        emergencyContacts: [],
      })
      return
    }

    const cached = readCachedValue<DiscoverSnapshot>(cacheKey)
    if (cached?.value) {
      if (cached.value.places) setPlaces(cached.value.places)
      if (cached.value.emergencyContacts)
        setEmergencyContacts(cached.value.emergencyContacts)
      setStaleAt(cached.savedAt)
    }

    setLoading(true)

    const fetchPlaces = async () => {
      if (searchQuery.trim()) {
        const res = await discoverApi.search({
          q: searchQuery.trim(),
          limit: 40,
        })
        return { places: res.data || [], emergency: [] }
      }
      if (tab === "emergency") {
        const res = await discoverApi.emergency({ city: "Addis Ababa" })
        return { places: [], emergency: res.data || [] }
      }
      let catParam: string | undefined
      if (tab === "heritage") catParam = "HERITAGE"
      else if (tab === "dining") catParam = "RESTAURANT"
      else if (tab === "attractions") catParam = "ATTRACTION"
      const res = await discoverApi.nearby({
        lat: searchCenter.lat,
        lng: searchCenter.lng,
        radiusKm,
        category: catParam,
        limit: 50,
      })
      return { places: res.data || [], emergency: [] }
    }

    fetchPlaces()
      .then((data) => {
        if (cancelled) return
        setPlaces(data.places)
        setEmergencyContacts(data.emergency)
        setStaleAt(null)
        writeCachedValue<DiscoverSnapshot>(cacheKey, data)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [
    cacheKey,
    tab,
    searchQuery,
    searchCenter.lat,
    searchCenter.lng,
    radiusKm,
    initialPlaces,
  ])

  const handleOpenAddModal = async (place: PlaceItem) => {
    if (!user) {
      toast.info(
        t("discover", "signInRequired"),
        t("discover", "signInToAddPlaces"),
      )
      return
    }
    setPlaceToAddToTrip(place)
    setTripItemNotes(t("discover", "visitTo", { name: place.name }))
    setAddToTripModalOpen(true)
    try {
      const res = await tripApi.list()
      setUserTrips(res.data)
      if (res.data.length > 0) {
        setSelectedTripId(res.data[0].id)
        setTripItemDate(res.data[0].startDate.slice(0, 10))
      }
    } catch {
      setUserTrips([])
    }
  }

  const handleConfirmAddToTrip = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTripId || !placeToAddToTrip || !tripItemDate) return
    setAddingToTrip(true)
    try {
      await tripApi.addItem(selectedTripId, {
        placeId: placeToAddToTrip.id,
        title: t("discover", "visit", { name: placeToAddToTrip.name }),
        dayDate: tripItemDate,
        startTime: tripItemTime || undefined,
        notes: tripItemNotes,
        itemType: "PLACE",
        currency: "ETB",
      })
      toast.success(
        t("discover", "addedTitle"),
        t("discover", "addedBody", { name: placeToAddToTrip.name }),
      )
      setAddToTripModalOpen(false)
    } catch (err) {
      toast.error(
        t("discover", "failedAddPlace"),
        err instanceof Error ? err.message : t("discover", "checkTripDates"),
      )
    } finally {
      setAddingToTrip(false)
    }
  }

  const filteredDestinations = useMemo(() => {
    if (destCategory === "For you") return destinations
    if (destCategory === "Heritage")
      return destinations.filter((d) =>
        ["Gondar", "Lalibela", "Aksum", "Harar"].includes(d.name),
      )
    if (destCategory === "Nature")
      return destinations.filter(
        (d) =>
          ["Bahir Dar", "Hawassa", "Arba Minch"].includes(d.name) ||
          d.name.toLowerCase().includes("dar"),
      )
    if (destCategory === "Culture")
      return destinations.filter((d) =>
        ["Harar", "Gondar", "Lalibela", "Addis Ababa"].includes(d.name),
      )
    if (destCategory === "City")
      return destinations.filter((d) =>
        ["Addis Ababa", "Hawassa", "Dire Dawa", "Bahir Dar"].includes(d.name),
      )
    return destinations
  }, [destinations, destCategory])

  const gondarDestination =
    destinations.find((d) => d.name.toLowerCase().includes("gondar")) ||
    destinations[0]

  const EXPLORE_COLLECTIONS = [
    {
      title: t("discover", "colHistory"),
      note: t("discover", "colHistoryNote"),
      image: FALLBACK_IMGS.lalibela,
      icon: Landmark,
      link: gondarDestination
        ? `/discover/heritage/${gondarDestination.id}`
        : "/discover",
    },
    {
      title: t("discover", "colOutdoors"),
      note: t("discover", "colOutdoorsNote"),
      image: FALLBACK_IMGS["bahir dar"],
      icon: Compass,
      link: "/discover",
    },
    {
      title: t("discover", "colFood"),
      note: t("discover", "colFoodNote"),
      image: FALLBACK_IMGS.harar,
      icon: Coffee,
      link: "/discover",
    },
  ]

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#07111f]">
      {}
      <section className="relative min-h-[600px] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1523805009345-7448845a9e53?w=1600&h=900&fit=crop&auto=format&q=80"
            alt={t("discover", "heroImageAlt")}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          {}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b1528] via-[#0b1528]/55 to-[#0b1528]/10" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0b1528]/70 via-transparent to-transparent" />
        </div>

        {}
        {savedPlaces.length > 0 && (
          <Link
            href="/favorites"
            className="absolute top-6 right-6 z-20 flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md hover:bg-white/20 transition"
          >
            <Heart className="h-4 w-4 fill-red-400 text-red-400" />
            <span>{savedPlaces.length}</span> saved
          </Link>
        )}

        <div className="relative z-10 w-full pb-12 pt-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="max-w-3xl">
              {}
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-[#e4bd55]">
                {t("discover", "heroTagline")}
              </p>

              {}
              <h1 className="font-serif text-5xl font-bold text-white sm:text-6xl lg:text-7xl leading-none tracking-tight">
                {t("discover", "heroTitleLine1")}{" "}
                <span className="block font-light italic text-[#E5C158] lowercase">
                  {t("discover", "heroTitleLine2")}
                </span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-white/80">
                {t("discover", "heroBody")}
              </p>

              {}
              <div className="mt-7 flex max-w-lg items-center gap-2 rounded-2xl border border-white/25 bg-white/95 p-1.5 shadow-2xl backdrop-blur-md">
                <Search className="ml-3 h-4.5 w-4.5 shrink-0 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("discover", "searchHeroPlaceholder")}
                  className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="rounded-lg p-1 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <Button
                  size="sm"
                  onClick={() =>
                    document
                      .getElementById("discover-explorer")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="rounded-xl bg-[#0b1528] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#12233a]"
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>

              {}
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/search"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur-sm hover:bg-white/20 transition"
                >
                  <Building2 className="h-3.5 w-3.5 text-[#e4bd55]" />
                  <span>
                    <strong>{t("discover", "findAStay")}</strong>
                    {" · "}
                    {t("discover", "hotelsAcrossEthiopia")}
                  </span>
                </Link>
                {gondarDestination && (
                  <Link
                    href={`/discover/heritage/${gondarDestination.id}`}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#e4bd55]/40 bg-[#e4bd55]/15 px-4 py-2.5 text-xs font-semibold text-[#e4bd55] hover:bg-[#e4bd55]/25 transition"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>
                      <strong>{t("discover", "heritageGuides")}</strong>
                      {" · "}
                      {t("discover", "verifiedHistory")}
                    </span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {}
      <section className="sticky top-[72px] z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl dark:border-slate-800 dark:bg-[#07111f]/95">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {t("discover", "searchNear")}
            </span>
            {NEIGHBORHOODS.slice(0, 5).map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => {
                  setSelectedNeighborhood(n)
                  setUserLocation(null)
                }}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  !userLocation && selectedNeighborhood.id === n.id
                    ? "bg-[#0b1528] text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-[#e4bd55]/20 hover:text-[#0b1528] dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                {language === "am" ? n.nameAm : n.name}
              </button>
            ))}
            <button
              type="button"
              onClick={requestUserLocation}
              disabled={locating}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
                userLocation
                  ? "border-[#e4bd55] bg-[#e4bd55]/10 text-[#0b1528]"
                  : "border-slate-200 text-slate-600 hover:border-[#0b1528] hover:text-[#0b1528] dark:border-slate-700 dark:text-slate-300"
              }`}
            >
              {locating ? (
                t("discover", "locating")
              ) : userLocation ? (
                <>
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  {t("discover", "usingMyLocation")}
                </>
              ) : (
                t("discover", "useMyLocation")
              )}
            </button>
          </div>
          <label className="flex min-w-[200px] items-center gap-3 text-xs font-semibold text-slate-500">
            <span className="shrink-0">
              {t("discover", "radiusKm", { km: radiusKm })}
            </span>
            <input
              type="range"
              min={1}
              max={15}
              step={1}
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="w-full accent-[#e4bd55]"
              aria-label="Nearby search radius in kilometres"
            />
          </label>
        </div>
      </section>

      {}
      {staleAt && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-center text-xs font-semibold text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300">
          {t("discover", "staleBanner", { age: formatCacheAge(staleAt) })}
        </div>
      )}

      {}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-[#e4bd55]/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#0b1528] dark:text-[#e4bd55]">
              {t("discover", "welcomeBadge")}
            </span>
            <p className="font-serif text-base font-bold text-[#0b1528] dark:text-white">
              {t("discover", "welcomeTitle")}
            </p>
          </div>
          <div className="hidden items-center gap-1.5 text-xs font-semibold text-slate-500 sm:flex">
            <Check className="h-3.5 w-3.5 text-emerald-500" />
            {t("discover", "verifiedDestinationsPublished", {
              count: destinations.length || 8,
            })}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-20 px-4 py-14 sm:px-6">
        {}
        <section aria-labelledby="destinations-heading">
          <div className="mb-8 flex flex-col gap-4 border-b border-slate-200 pb-5 dark:border-slate-800 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#e4bd55]">
                {t("discover", "placesWithStory")}
              </p>
              <h2
                id="destinations-heading"
                className="mt-1.5 font-serif text-3xl font-bold text-[#0b1528] dark:text-white sm:text-4xl"
              >
                {t("discover", "chooseYourEthiopia")}
              </h2>
            </div>
            {}
            <div className="flex flex-wrap gap-2">
              {([
                "For you",
                "Heritage",
                "Nature",
                "Culture",
                "City",
              ] as DestinationCategory[]).map((cat) => {
                const label =
                  cat === "For you"
                    ? t("discover", "catForYou")
                    : cat === "Heritage"
                      ? t("discover", "catHeritage")
                      : cat === "Nature"
                        ? t("discover", "catNature")
                        : cat === "Culture"
                          ? t("discover", "catCulture")
                          : t("discover", "catCity")
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setDestCategory(cat)}
                    className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                      destCategory === cat
                        ? "bg-[#0b1528] text-white shadow-sm dark:bg-[#e4bd55] dark:text-[#07111f]"
                        : "border border-slate-200 bg-white text-slate-600 hover:border-[#e4bd55]/60 hover:text-[#0b1528] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          {}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {filteredDestinations.map((dest, idx) => {
              const key = dest.name.toLowerCase()
              const tagKey =
                DESTINATION_TAGS_EN[key] ||
                (idx === 0 ? "tagFeatured" : "tagDestination")
              const tag = t("discover", tagKey as Parameters<typeof t>[1])
              const img = localImage(
                dest.heroImage ||
                  FALLBACK_IMGS[key] ||
                  FALLBACK_IMGS["addis ababa"],
              )
              const saved = savedPlaces.includes(dest.name)

              return (
                <article
                  key={dest.id}
                  className={`group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-[#e4bd55]/60 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 ${
                    idx === 0 ? "sm:col-span-2" : ""
                  }`}
                >
                  <div
                    className={`relative w-full overflow-hidden bg-slate-200 ${
                      idx === 0 ? "h-80 sm:h-96" : "h-64"
                    }`}
                  >
                    <Image
                      src={img}
                      alt={dest.name}
                      fill
                      sizes={
                        idx === 0
                          ? "(max-width:768px) 100vw, 50vw"
                          : "(max-width:768px) 100vw, 25vw"
                      }
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0b1528]/90 via-[#0b1528]/30 to-transparent" />

                    {}
                    <span className="absolute left-4 top-4 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
                      {tag}
                    </span>

                    {}
                    <button
                      type="button"
                      onClick={() => toggleSaveCity(dest.name)}
                      aria-label={
                        saved ? "Remove from saved" : "Save destination"
                      }
                      className={`absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border transition backdrop-blur-md ${
                        saved
                          ? "border-red-400/80 bg-red-500 text-white shadow-md"
                          : "border-white/25 bg-black/25 text-white hover:bg-black/40"
                      }`}
                    >
                      <Heart
                        className={`h-4 w-4 ${saved ? "fill-current" : ""}`}
                      />
                    </button>

                    {}
                    <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                      <h3 className="font-serif text-2xl font-bold leading-tight tracking-tight">
                        {dest.name}
                      </h3>
                      <p className="mt-1 line-clamp-1 text-xs text-white/75">
                        {dest.description}
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-[#e4bd55]">
                          {t("discover", "destinationStats", {
                            hotels: dest.hotelCount,
                            places: dest.placeCount,
                          })}
                        </span>
                        <Link
                          href={`/discover/heritage/${dest.id}`}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-[#0b1528] shadow-md transition hover:bg-[#e4bd55]"
                        >
                          {t("discover", "explore")}
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        {}
        <section className="overflow-hidden rounded-3xl border border-[#e4bd55]/20 bg-[#0b1528] shadow-xl">
          <div className="grid grid-cols-1 gap-0 lg:grid-cols-2">
            <div className="flex flex-col justify-center gap-5 p-10 lg:p-14">
              <span className="self-start rounded-full bg-[#e4bd55]/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#e4bd55]">
                {t("discover", "upcomingStay")}
              </span>
              <h2 className="font-serif text-3xl font-bold text-white sm:text-4xl leading-tight">
                {t("discover", "makeMoreDestination")}
              </h2>
              <p className="text-sm leading-relaxed text-slate-300">
                {t("discover", "stayBannerBody")}
              </p>
              {gondarDestination && (
                <Link
                  href={`/discover/heritage/${gondarDestination.id}`}
                  className="inline-flex w-fit items-center gap-2 rounded-2xl border border-[#e4bd55] bg-[#e4bd55] px-6 py-3 text-xs font-bold uppercase tracking-wider text-[#0b1528] shadow-lg transition hover:bg-[#E5C158]"
                >
                  <Landmark className="h-4 w-4" />
                  {t("discover", "exploreAroundHotel")}
                </Link>
              )}
            </div>
            <div className="relative min-h-[280px] overflow-hidden">
              <Image
                src={localImage(FALLBACK_IMGS.gondar)}
                alt="Fasil Ghebbi Royal Enclosure"
                fill
                sizes="(max-width:1024px) 100vw, 50vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0b1528]/80 via-transparent to-transparent lg:bg-gradient-to-l lg:from-transparent lg:via-transparent lg:to-[#0b1528]/60" />
              <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/15 bg-black/50 p-4 backdrop-blur-sm">
                <p className="font-serif font-bold text-white">
                  Fasil Ghebbi Royal Enclosure
                </p>
                <p className="mt-0.5 text-[11px] text-slate-300">
                  1.8 km from Goha Hotel · UNESCO World Heritage
                </p>
              </div>
            </div>
          </div>
        </section>

        {}
        <section aria-labelledby="collections-heading">
          <div className="mb-8 border-b border-slate-200 pb-5 dark:border-slate-800">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#e4bd55]">
              {t("discover", "curatedCurious")}
            </p>
            <h2
              id="collections-heading"
              className="mt-1.5 font-serif text-3xl font-bold text-[#0b1528] dark:text-white sm:text-4xl"
            >
              {t("discover", "experienceMore")}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {EXPLORE_COLLECTIONS.map((col, idx) => {
              const Icon = col.icon
              return (
                <Link
                  key={idx}
                  href={col.link}
                  className="group relative h-80 overflow-hidden rounded-3xl border border-slate-200/80 bg-slate-900 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-[#e4bd55]/60 hover:shadow-xl"
                >
                  <Image
                    src={localImage(col.image)}
                    alt={col.title}
                    fill
                    sizes="(max-width:768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0b1528] via-[#0b1528]/40 to-transparent" />
                  <div className="absolute left-5 top-5 flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                    <Icon className="h-5 w-5 text-[#e4bd55]" />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                    <h3 className="font-serif text-2xl font-bold tracking-tight">
                      {col.title}
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-white/75">
                      {col.note}
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#e4bd55]">
                      {t("discover", "exploreCollection")}{" "}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        {}
        <section aria-labelledby="routes-heading">
          <div className="mb-8 border-b border-slate-200 pb-5 dark:border-slate-800">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#e4bd55]">
              {t("discover", "itineraryKicker")}
            </p>
            <h2
              id="routes-heading"
              className="mt-1.5 font-serif text-3xl font-bold text-[#0b1528] dark:text-white sm:text-4xl"
            >
              {t("discover", "waysToExplore")}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[3fr_2fr]">
            {}
            <div className="relative flex h-[420px] flex-col justify-between overflow-hidden rounded-3xl bg-[#0b1528] p-8 text-white shadow-lg">
              <Image
                src={FALLBACK_IMGS.gondar}
                alt="The Historic North"
                fill
                sizes="(max-width:1024px) 100vw, 60vw"
                className="object-cover opacity-30"
              />
              <div className="relative z-10 flex items-center justify-between">
                <span className="rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#e4bd55] backdrop-blur-sm">
                  {t("discover", "route7Day")}
                </span>
                <span className="text-xs font-bold text-white/50">01 / 03</span>
              </div>
              <div className="relative z-10 space-y-3">
                <h3 className="font-serif text-3xl font-bold leading-tight sm:text-4xl">
                  {t("discover", "routeNorthTitle")}
                </h3>
                <p className="max-w-md text-sm leading-relaxed text-white/75">
                  {t("discover", "routeNorthBody")}
                </p>
                <Link
                  href="/trips"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-bold text-[#0b1528] transition hover:bg-[#e4bd55]"
                >
                  {t("discover", "viewRouteItinerary")}{" "}
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {}
            <div className="flex flex-col gap-5">
              {[
                {
                  num: "02",
                  title: t("discover", "routeCoffeeTitle"),
                  body: t("discover", "routeCoffeeBody"),
                },
                {
                  num: "03",
                  title: t("discover", "routeRiftTitle"),
                  body: t("discover", "routeRiftBody"),
                },
              ].map((r) => (
                <Link
                  key={r.num}
                  href="/trips"
                  className="group flex-1 rounded-3xl border border-slate-200/80 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#e4bd55]/60 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                >
                  <span className="font-serif text-2xl font-bold text-[#e4bd55]">
                    {r.num}
                  </span>
                  <h4 className="mt-3 font-serif text-xl font-bold text-[#0b1528] dark:text-white">
                    {r.title}
                  </h4>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">
                    {r.body}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#e4bd55] opacity-0 transition-opacity group-hover:opacity-100">
                    View itinerary <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {}
        <section id="discover-explorer" aria-labelledby="places-heading">
          {}
          <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-5 dark:border-slate-800 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#e4bd55]">
                {t("discover", "verifiedPlacesKicker")}
              </p>
              <h2
                id="places-heading"
                className="mt-1.5 font-serif text-3xl font-bold text-[#0b1528] dark:text-white sm:text-4xl"
              >
                {t("discover", "exploreNearbyLandmarks")}
              </h2>
            </div>
            {}
            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`rounded-lg px-4 py-1.5 text-xs font-bold transition ${
                    viewMode === "list"
                      ? "bg-white text-[#0b1528] shadow-sm dark:bg-slate-700 dark:text-white"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  <List className="mr-1.5 inline h-3.5 w-3.5" />
                  {t("discover", "gridView")}
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("map")}
                  className={`rounded-lg px-4 py-1.5 text-xs font-bold transition ${
                    viewMode === "map"
                      ? "bg-white text-[#0b1528] shadow-sm dark:bg-slate-700 dark:text-white"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  <MapIcon className="mr-1.5 inline h-3.5 w-3.5" />
                  {t("discover", "mapView")}
                </button>
              </div>
            </div>
          </div>

          {}
          <div className="mb-6 flex flex-wrap gap-2">
            {[
              { id: "all", label: t("discover", "tabAll"), icon: Landmark },
              {
                id: "heritage",
                label: t("discover", "tabHeritage"),
                icon: Landmark,
              },
              {
                id: "dining",
                label: t("discover", "tabDining"),
                icon: UtensilsCrossed,
              },
              {
                id: "attractions",
                label: t("discover", "tabAttractions"),
                icon: Compass,
              },
              {
                id: "emergency",
                label: t("discover", "tabEmergency"),
                icon: HeartPulse,
              },
            ].map((tb) => {
              const Icon = tb.icon
              return (
                <button
                  key={tb.id}
                  type="button"
                  onClick={() => setTab(tb.id as Tab)}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                    tab === tb.id
                      ? "bg-[#0b1528] text-white shadow-md dark:bg-[#e4bd55] dark:text-[#07111f]"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-[#e4bd55]/60 hover:text-[#0b1528] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tb.label}
                </button>
              )
            })}
          </div>

          {}
          {viewMode === "map" && (
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="relative h-[440px] overflow-hidden rounded-2xl m-4 border border-slate-200 bg-[#E8EEF2] dark:border-slate-700">
                <HeritageMap
                  places={places}
                  selectedPlaceId={selectedPlaceId}
                  onSelect={setSelectedPlaceId}
                  searchCenter={searchCenter}
                  userLocation={userLocation}
                  radiusKm={radiusKm}
                  onAddToTrip={handleOpenAddModal}
                  detailUrlPrefix="/discover"
                  className="h-full w-full"
                />
                <div className="pointer-events-none absolute left-4 top-4 z-[400] inline-flex items-center gap-1.5 rounded-xl bg-white/95 px-3.5 py-2 text-xs font-bold text-[#0b1528] shadow-sm backdrop-blur dark:bg-slate-900/95 dark:text-white">
                  <MapPin className="h-3.5 w-3.5 text-[#e4bd55]" />
                  {userLocation
                    ? t("discover", "yourLocation")
                    : selectedNeighborhood.id === "all"
                      ? `${selectedNeighborhood.name} (Center)`
                      : selectedNeighborhood.name}
                  {" · "}
                  {t("discover", "placesCountSuffix", { count: places.length })}
                </div>
              </div>
              {selectedPlace && (
                <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-slate-50 m-4 p-5 dark:border-slate-800 dark:bg-slate-800 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#e4bd55]">
                      {selectedPlace.category}
                    </span>
                    <h4 className="mt-0.5 font-serif text-lg font-bold text-[#0b1528] dark:text-white">
                      {selectedPlace.name}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {selectedPlace.address}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleOpenAddModal(selectedPlace)}
                      leftIcon={<Plus className="h-3.5 w-3.5 text-[#e4bd55]" />}
                      className="whitespace-nowrap rounded-xl bg-[#0b1528] px-4 text-xs font-bold text-white hover:bg-[#12233a]"
                    >
                      {t("discover", "addToItinerary")}
                    </Button>
                    <Link
                      href={`/discover/${selectedPlace.id}`}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-[#0b1528] hover:border-[#e4bd55] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      {t("discover", "details")}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {}
          {viewMode === "list" && (
            <>
              {loading && places.length === 0 ? (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} className="h-72 rounded-3xl" />
                  ))}
                </div>
              ) : places.length > 0 ? (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {places.map((place) => {
                    const Icon = CATEGORY_ICONS[place.category] ?? Landmark
                    const img = localImage(place.images?.[0] || PLACE_FALLBACK)
                    const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`
                    const dist = distanceKm(
                      searchCenter.lat,
                      searchCenter.lng,
                      place.lat,
                      place.lng,
                    )

                    return (
                      <article
                        key={place.id}
                        className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-[#e4bd55]/60 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900"
                      >
                        {}
                        <div className="relative h-48 overflow-hidden bg-slate-100">
                          <Image
                            src={img}
                            alt={place.name}
                            fill
                            sizes="(max-width:768px) 100vw, 33vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                          {}
                          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold text-[#0b1528] shadow-sm dark:bg-slate-900/95 dark:text-white">
                            <Icon className="h-3 w-3" /> {place.category}
                          </span>
                          {}
                          <span className="absolute right-3 bottom-3 inline-flex items-center gap-1 rounded-full bg-[#0b1528]/80 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
                            <MapPin className="h-3 w-3 text-[#e4bd55]" />
                            {dist.toFixed(1)} km
                          </span>
                        </div>

                        {}
                        <div className="flex flex-1 flex-col p-5">
                          <h3 className="font-serif text-lg font-bold text-[#0b1528] transition-colors group-hover:text-[#B8860B] dark:text-white">
                            {place.name}
                          </h3>
                          {place.amharicName && (
                            <p className="mt-0.5 text-xs font-semibold text-[#B8860B]">
                              {place.amharicName}
                            </p>
                          )}
                          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500">
                            {place.description}
                          </p>
                          {place.address && (
                            <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                              {place.address}
                            </p>
                          )}
                          <p className="mt-2 text-xs font-semibold text-[#B8860B]">
                            {dist.toFixed(1)} km away
                          </p>

                          {}
                          {place.rating && (
                            <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#B8860B]">
                              <Star className="h-3.5 w-3.5 fill-current" />
                              {place.rating.toFixed(1)}
                            </div>
                          )}

                          {}
                          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                            <Button
                              size="sm"
                              onClick={() => handleOpenAddModal(place)}
                              leftIcon={
                                <Plus className="h-3 w-3 text-[#e4bd55]" />
                              }
                              className="col-span-1 min-h-[44px] w-full rounded-xl bg-[#0b1528] px-2 text-[10px] font-bold text-white hover:bg-[#12233a]"
                            >
                              {t("discover", "addToItinerary")}
                            </Button>
                            <a
                              href={navUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-[10px] font-bold text-slate-700 transition hover:border-[#e4bd55] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            >
                              <Navigation className="mr-1 h-3 w-3 text-[#e4bd55]" />
                              {t("heritage", "navigate")}
                            </a>
                            <Link
                              href={`/discover/${place.id}`}
                              className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-[10px] font-bold text-[#0b1528] transition hover:border-[#e4bd55] hover:bg-[#e4bd55]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            >
                              {t("discover", "details")}
                              <ChevronRight className="ml-0.5 h-3.5 w-3.5" />
                            </Link>
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              ) : tab === "emergency" && emergencyContacts.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {emergencyContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm dark:border-red-900 dark:bg-slate-900"
                    >
                      <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-700 dark:bg-red-900/40 dark:text-red-400">
                        {contact.kind}
                      </span>
                      <h4 className="mt-2 font-serif font-bold text-[#0b1528] dark:text-white">
                        {contact.name}
                      </h4>
                      <a
                        href={`tel:${contact.phone}`}
                        className="mt-1.5 inline-flex items-center gap-1.5 font-bold text-red-600 text-sm dark:text-red-400"
                      >
                        <Phone className="h-4 w-4" />
                        {contact.phone}
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Compass}
                  title={t("discover", "noPlacesTitle")}
                  description={t("discover", "noPlacesBody")}
                />
              )}
            </>
          )}
        </section>

        {}
        <section className="mx-auto max-w-2xl border-t border-slate-200 py-10 text-center dark:border-slate-800">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#e4bd55]">
            {t("discover", "travelThoughtfully")}
          </p>
          <h3 className="mt-3 font-serif text-3xl font-bold text-[#0b1528] dark:text-white">
            {t("discover", "storiesBelong")}
          </h3>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-slate-500">
            {t("discover", "governanceBody")}
          </p>
        </section>
      </div>

      {}
      {addToTripModalOpen && placeToAddToTrip && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl animate-in fade-in zoom-in-95 dark:bg-slate-900">
            {}
            <div className="flex items-center justify-between bg-[#0b1528] px-6 py-4 text-white">
              <h3 id="modal-title" className="font-serif text-lg font-bold">
                {t("discover", "addToYourItinerary")}
              </h3>
              <button
                onClick={() => setAddToTripModalOpen(false)}
                className="rounded-full bg-white/10 p-1.5 text-white transition hover:bg-white/20"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmAddToTrip} className="space-y-4 p-6">
              {}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#e4bd55]">
                  {placeToAddToTrip.category}
                </p>
                <h4 className="mt-0.5 font-serif text-base font-bold text-[#0b1528] dark:text-white">
                  {placeToAddToTrip.name}
                </h4>
              </div>

              {userTrips.length === 0 ? (
                <div className="py-4 text-center">
                  <p className="mb-3 text-xs text-slate-500">
                    {t("discover", "noItineraries")}
                  </p>
                  <Link
                    href="/trips"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#0b1528] px-4 py-2 text-xs font-bold text-white hover:bg-[#12233a]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {t("discover", "createTripFirst")}
                  </Link>
                </div>
              ) : (
                <>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                      {t("discover", "selectTrip")}
                    </label>
                    <select
                      value={selectedTripId}
                      onChange={(e) => {
                        setSelectedTripId(e.target.value)
                        const found = userTrips.find(
                          (item) => item.id === e.target.value,
                        )
                        if (found) setTripItemDate(found.startDate.slice(0, 10))
                      }}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-[#0b1528] outline-none focus:border-[#e4bd55] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      {userTrips.map((tr) => (
                        <option key={tr.id} value={tr.id}>
                          {tr.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                        {t("discover", "date")}
                      </label>
                      <input
                        type="date"
                        required
                        value={tripItemDate}
                        onChange={(e) => setTripItemDate(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold outline-none focus:border-[#e4bd55] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                        {t("discover", "timeSlot")}
                      </label>
                      <input
                        type="time"
                        value={tripItemTime}
                        onChange={(e) => setTripItemTime(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold outline-none focus:border-[#e4bd55] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setAddToTripModalOpen(false)}
                      className="text-xs font-semibold"
                    >
                      {t("discover", "cancel")}
                    </Button>
                    <Button
                      type="submit"
                      loading={addingToTrip}
                      className="rounded-xl bg-[#0b1528] text-xs font-bold text-white hover:bg-[#12233a]"
                    >
                      {t("discover", "confirmAddSchedule")}
                    </Button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
