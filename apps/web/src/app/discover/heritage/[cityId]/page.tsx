"use client"

// Data states

// Interactive UI states

// Modals & Drawers

// Add to Trip Modal

// Build My Heritage Day states

// AI Historian context prefill

// Initial Load with Offline Caching

// Check cached snapshot

// Load user trips

// API history/city copy is English-only, so in Amharic the localized
// curated copy wins; English keeps the live API data first.
// The City table has no Amharic column — the curated copy carries it.

// Active hotel coordinates

// Compute distance for all places relative to active hotel or city center

// Filtered places for Explorer

// Sequential route near hotel

// Map places filtered by radius & search query
/* OFFLINE NOTICE */ /* SECTION 2 & 3: HERO & GLASSMORPHIC HEADER */ /* Cinematic Gradient Overlays */ /* Section 2: Header Buttons */ /* Section 3: Hero Content & CTAs */ /* Stats Chips */ /* Hero Action Buttons */ /* SECTION 4: CITY STORY ("THE STORY OF {CITY}") */ /* SECTION 5: HISTORICAL TIMELINE ("{CITY} THROUGH TIME") */ /* SECTION 6: STORIES OF THE CITY */ /* SECTION 8: HERITAGE NEAR YOUR HOTEL (Prominent Route Component) */ /* Hotel Origin Header */ /* Route List with Distance Indicators */ /* SECTION 7: HERITAGE EXPLORER */ /* Filter Chips */ /* Action Bar */ /* SECTION 9: INTERACTIVE HERITAGE MAP */ /* Radius Filters & Search */ /* Map Selected Place Card / Bottom Sheet */ /* SECTION 11: CULTURE & TRADITIONS */ /* SECTION 12: ✨ AI TRAVEL HISTORIAN */ /* Pre-filled prompt chips */ /* SECTION 13: BUILD MY HERITAGE DAY */ /* Form Controls */ /* Step 1: Duration Selector */ /* Step 2: Interest Selector */ /* Itinerary Display */ /* SECTION 14: STAY NEARBY / HOTELS */ /* FULL STORY READING EXPERIENCE MODAL (Section 4) */ /* Historical Sections */ /* Key Historical Dates Table */ /* Source Footnote */ /* TIMELINE PERIOD DETAIL MODAL (Section 5) */ /* STORY DETAIL MODAL (Section 6) */ /* ADD TO TRIP MODAL */

import { useCallback, useEffect, useMemo, useState, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import dynamic from "next/dynamic"
import { useParams, useRouter } from "next/navigation"

const HeritageMap = dynamic(() => import("@/app/discover/HeritageMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-80 sm:h-96 w-full items-center justify-center rounded-2xl bg-[#E8EEF2] text-xs font-semibold text-slate-500">
      Loading interactive map…
    </div>
  ),
})
import {
  ArrowLeft,
  BookOpen,
  Building2,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  Coffee,
  Compass,
  Heart,
  Landmark,
  Map as MapIcon,
  MapPin,
  Navigation,
  Palette,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  UtensilsCrossed,
  Wand2,
  X,
  List,
} from "lucide-react"
import {
  discoverApi,
  tripApi,
  type BuildDayResponse,
  type CityHistoryResponse,
  type DestinationDetail,
  type PlaceItem,
  type Trip,
} from "@/lib/services"
import {
  getHeritageContent,
  type HeritageCityContent,
  type HeritageTimelineEntry,
  type HeritageStory,
} from "@/lib/heritage-content"
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
import AIChat from "@/components/AIChat"

type Duration = "2_HOURS" | "HALF_DAY" | "FULL_DAY" | "MULTIPLE_DAYS"
type PlaceFilter = "all" | "HERITAGE" | "CASTLE" | "MUSEUM" | "RELIGIOUS" | "ARCHAEOLOGY" | "CULTURE" | "ATTRACTION"
type RadiusFilter = "all" | "1" | "5" | "10"
type MapMode = "map" | "list"

const CATEGORY_ICONS: Record<string, typeof Landmark> = {
  HERITAGE: Landmark,
  CASTLE: Building2,
  MUSEUM: Landmark,
  RELIGIOUS: Sparkles,
  ARCHAEOLOGY: Compass,
  CULTURE: Palette,
  RESTAURANT: UtensilsCrossed,
  CAFE: Coffee,
  ATTRACTION: Compass,
  SHOPPING: Sparkles,
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

const FALLBACK_IMAGE =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Addis_Ababa_from_Entoto_Mountains.jpg/960px-Addis_Ababa_from_Entoto_Mountains.jpg"

const INTEREST_OPTIONS = [
  { id: "heritage", icon: Landmark },
  { id: "architecture", icon: Building2 },
  { id: "museums", icon: BookOpen },
  { id: "culture", icon: Palette },
  { id: "religion", icon: Sparkles },
  { id: "food", icon: UtensilsCrossed },
  { id: "photography", icon: Compass },
  { id: "nature", icon: Compass },
]

function computeDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(
      dLat /
        2,
    ) *
      Math.sin(
        dLat /
          2,
      ) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(
        dLon /
          2,
      ) *
      Math.sin(
        dLon /
          2,
      )
  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(
        1 -
          a,
      ),
    )
  return (
    R *
    c
  )
}

export default function HeritageCityPage() {
  const params = useParams()
  const router = useRouter()
  const cityId =
    typeof params.cityId ===
    "string"
      ? params.cityId
      : ""
  const { user, tokens } = useAuth()
  const { language, t } = useLanguage()
  const [destination, setDestination] = useState<DestinationDetail | null>(null)
  const [history, setHistory] = useState<CityHistoryResponse | null>(null)
  const [heritagePlaces, setHeritagePlaces] = useState<PlaceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [cachedAge, setCachedAge] = useState<string | null>(null)
  const [placeFilter, setPlaceFilter] = useState<PlaceFilter>("all")
  const [radiusFilter, setRadiusFilter] = useState<RadiusFilter>("all")
  const [mapSearchQuery, setMapSearchQuery] = useState("")
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null)
  const [activeHotelId, setActiveHotelId] = useState<string | null>(null)
  const [isFavoriteCity, setIsFavoriteCity] = useState(false)
  const [mapMode, setMapMode] = useState<MapMode>("map")
  const [fullStoryOpen, setFullStoryOpen] = useState(false)
  const [timelineDetailEntry, setTimelineDetailEntry] =
    useState<HeritageTimelineEntry | null>(null)
  const [selectedStory, setSelectedStory] = useState<HeritageStory | null>(null)
  const [addToTripPlace, setAddToTripPlace] = useState<PlaceItem | null>(null)
  const [addTripId, setAddTripId] = useState("")
  const [addTripDate, setAddTripDate] = useState("")
  const [addTripTime, setAddTripTime] = useState("10:00")
  const [addingToTrip, setAddingToTrip] = useState(false)
  const [trips, setTrips] = useState<Trip[]>([])
  const [tripId, setTripId] = useState("")
  const [dayDate, setDayDate] = useState("")
  const [duration, setDuration] = useState<Duration>("HALF_DAY")
  const [startTime, setStartTime] = useState("09:00")
  const [interests, setInterests] = useState<string[]>([
    "heritage",
    "architecture",
    "culture",
  ])
  const [building, setBuilding] = useState(false)
  const [savingPlan, setSavingPlan] = useState(false)
  const [proposal, setProposal] = useState<BuildDayResponse | null>(null)
  const [buildError, setBuildError] = useState<string | null>(null)
  const [aiInitialPrompt, setAiInitialPrompt] = useState<string | undefined>(
    undefined,
  )

  const explorerRef = useRef<HTMLElement | null>(null)
  const aiRef = useRef<HTMLElement | null>(null)
  useEffect(() => {
    if (!cityId) return
    let cancelled = false
    setLoading(true)
    setLoadError(null)
    setProposal(null)
    setSelectedPlaceId(null)
    setHistory(null)
    const cacheKey = `heritage-city-${cityId}`
    const cached = readCachedValue<{
      destination: DestinationDetail
      heritagePlaces: PlaceItem[]
      history: CityHistoryResponse
    }>(cacheKey)
    if (cached) {
      setDestination(cached.value.destination)
      setHeritagePlaces(cached.value.heritagePlaces)
      setHistory(cached.value.history)
      setCachedAge(formatCacheAge(cached.savedAt))
      if (cached.value.destination?.hotels?.[0]) {
        setActiveHotelId(cached.value.destination.hotels[0].id)
      }
    }

    Promise.all([
      discoverApi.destination(cityId),
      discoverApi.heritageForCity(cityId, 50),
      discoverApi.history(cityId),
    ])
      .then(([detail, heritage, cityHistory]) => {
        if (cancelled) return
        setDestination(detail)
        setHeritagePlaces(
          heritage.data ??
            [],
        )
        setHistory(cityHistory)
        setCachedAge(null)
        if (detail?.hotels?.[0]) {
          setActiveHotelId(
            (current) =>
              current ||
              detail.hotels[0].id,
          )
        }
        writeCachedValue(cacheKey, {
          destination: detail,
          heritagePlaces:
            heritage.data ??
            [],
          history: cityHistory,
        })
      })
      .catch((err) => {
        if (cancelled) return
        if (!cached) {
          setLoadError(
            err instanceof
              Error &&
              err.message
              ? err.message
              : t("heritage", "loadError"),
          )
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [cityId, t])
  useEffect(() => {
    if (!user) return
    let cancelled = false
    tripApi
      .list()
      .then((res) => {
        if (cancelled) return
        const list =
          res.data ??
          []
        setTrips(list)
        const first = list[0]
        if (first) {
          setTripId(
            (prev) =>
              prev ||
              first.id,
          )
          setDayDate(
            (prev) =>
              prev ||
              first.startDate.slice(0, 10),
          )
          setAddTripId(
            (prev) =>
              prev ||
              first.id,
          )
          setAddTripDate(
            (prev) =>
              prev ||
              first.startDate.slice(0, 10),
          )
        }
      })
      .catch(() => {
        if (!cancelled) setTrips([])
      })
    return () => {
      cancelled = true
    }
  }, [user])

  const cityName =
    destination?.name ??
    ""
  const categoryLabel = useCallback(
    (category: string) => {
      const translationKey = CATEGORY_TRANSLATION_KEYS[category.toUpperCase()]
      return translationKey ? t("heritage", translationKey) : category
    },
    [t],
  )
  const placeDescription = useCallback(
    (place: PlaceItem) => {
      return language ===
        "am"
        ? place.amharicDescription ||
            place.description
        : place.description
    },
    [language],
  )
  const curatedContent: HeritageCityContent | null = useMemo(() => {
    return getHeritageContent(cityName, language)
  }, [cityName, language])
  const preferCuratedCopy =
    language ===
      "am" &&
    Boolean(curatedContent)
  const displayCityName =
    preferCuratedCopy &&
    curatedContent
      ? curatedContent.cityName
      : cityName
  const placeLabel = useCallback(
    (place: PlaceItem) =>
      language ===
      "am"
        ? place.amharicName ||
          place.name
        : place.name,
    [language],
  )

  const places = useMemo(
    () =>
      destination?.places ??
      [],
    [destination],
  )
  const hotels = useMemo(
    () =>
      destination?.hotels ??
      [],
    [destination],
  )
  const activeHotel = useMemo(() => {
    return (
      hotels.find(
        (h) =>
          h.id ===
          activeHotelId,
      ) ??
      hotels[0] ??
      null
    )
  }, [hotels, activeHotelId])

  const placesById = useMemo(() => {
    const map = new Map<string, PlaceItem>()
    places.forEach((place) => map.set(place.id, place))
    heritagePlaces.forEach((place) => {
      if (!map.has(place.id)) map.set(place.id, place)
    })
    return map
  }, [places, heritagePlaces])

  const allPlaces = useMemo(() => {
    return Array.from(placesById.values())
  }, [placesById])
  const enrichedPlaces = useMemo(() => {
    const originLat = activeHotel?.lat ?? (places[0]?.lat || 9.01)
    const originLng = activeHotel?.lng ?? (places[0]?.lng || 38.76)

    return allPlaces.map((place) => {
      let distanceKm = place.distanceKm
      if (
        distanceKm ==
          null &&
        place.lat &&
        place.lng &&
        originLat &&
        originLng
      ) {
        distanceKm = computeDistanceKm(
          originLat,
          originLng,
          place.lat,
          place.lng,
        )
      }
      return {
        ...place,
        distanceKm:
          distanceKm !=
          null
            ? Number(distanceKm.toFixed(1))
            : undefined,
      }
    })
  }, [allPlaces, activeHotel, places])

  const heroImage =
    localImage(
      destination?.heroImage ||
        places.find((place) => place.images?.[0])
          ?.images?.[0] as string | undefined,
    ) ||
    localImage(FALLBACK_IMAGE)
  const explorerPlaces = useMemo(() => {
    return enrichedPlaces.filter((place) => {
      if (
        placeFilter ===
        "all"
      )
        return true
      const cat = place.category.toUpperCase()
      if (
        placeFilter ===
        "HERITAGE"
      )
        return (
          cat ===
            "HERITAGE" ||
          cat ===
            "HISTORIC"
        )
      if (
        placeFilter ===
        "CASTLE"
      )
        return (
          cat ===
            "CASTLE" ||
          place.name.toLowerCase().includes("castle") ||
          place.name.toLowerCase().includes("ghebbi")
        )
      if (
        placeFilter ===
        "MUSEUM"
      )
        return (
          cat ===
          "MUSEUM"
        )
      if (
        placeFilter ===
        "RELIGIOUS"
      )
        return (
          cat ===
            "RELIGIOUS" ||
          cat ===
            "CHURCH" ||
          cat ===
            "MOSQUE" ||
          place.name.toLowerCase().includes("church") ||
          place.name.toLowerCase().includes("cathedral")
        )
      if (
        placeFilter ===
        "ARCHAEOLOGY"
      )
        return (
          cat ===
            "ARCHAEOLOGY" ||
          cat ===
            "RUINS"
        )
      if (
        placeFilter ===
        "CULTURE"
      )
        return (
          cat ===
            "CULTURE" ||
          cat ===
            "ARTS"
        )
      return (
        place.category ===
        placeFilter
      )
    })
  }, [placeFilter, enrichedPlaces])
  const nearbyHotelRoute = useMemo(() => {
    const sorted = [...enrichedPlaces]
      .filter(
        (p) =>
          p.distanceKm !==
          undefined,
      )
      .sort(
        (a, b) =>
          (a.distanceKm ??
            0) -
          (b.distanceKm ??
            0),
      )
      .slice(0, 5)
    return sorted
  }, [enrichedPlaces])
  const mapFilteredPlaces = useMemo(() => {
    return enrichedPlaces.filter((p) => {
      if (radiusFilter !== "all" && p.distanceKm != null) {
        const maxRadius = parseFloat(radiusFilter)
        if (p.distanceKm > maxRadius) return false
      }
      if (mapSearchQuery.trim()) {
        const q = mapSearchQuery.toLowerCase()
        const matchName = p.name.toLowerCase().includes(q)
        const matchAmharic = p.amharicName?.toLowerCase().includes(q)
        const matchCat = p.category.toLowerCase().includes(q)
        if (!matchName && !matchAmharic && !matchCat) return false
      }
      return true
    })
  }, [enrichedPlaces, radiusFilter, mapSearchQuery])

  const selectedPlace = selectedPlaceId
    ? (placesById.get(selectedPlaceId) ?? null)
    : null
  const selectedTrip =
    trips.find((trip) => trip.id === tripId) ?? trips[0] ?? null

  const toggleInterest = useCallback((id: string) => {
    setInterests((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }, [])

  const handleFavoriteToggle = () => {
    setIsFavoriteCity((prev) => {
      const next = !prev
      toast.success(
        next
          ? t("heritage", "savedToFavorites")
          : t("heritage", "saveToFavorites"),
        displayCityName,
      )
      return next
    })
  }

  const handleOpenAddModal = (place: PlaceItem) => {
    if (!user) {
      toast.info(
        t("heritage", "signInToPlanTitle"),
        t("heritage", "signInToPlanBody"),
      )
      router.push("/auth")
      return
    }
    setAddToTripPlace(place)
  }

  const handleConfirmAddToTrip = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addTripId || !addToTripPlace || !addTripDate) return
    setAddingToTrip(true)
    try {
      await tripApi.addItem(addTripId, {
        placeId: addToTripPlace.id,
        title: addToTripPlace.name,
        dayDate: addTripDate,
        startTime: addTripTime || undefined,
        itemType: "PLACE",
        currency: "ETB",
      })
      toast.success(t("heritage", "savedTitle"), addToTripPlace.name)
      setAddToTripPlace(null)
    } catch (err) {
      toast.error(
        t("heritage", "buildError"),
        err instanceof Error ? err.message : undefined,
      )
    } finally {
      setAddingToTrip(false)
    }
  }

  const handleAskAiAbout = (queryText: string) => {
    setAiInitialPrompt(queryText)
    aiRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleBuildDay = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault()
      if (!user || !tripId || !dayDate) return
      setBuilding(true)
      setBuildError(null)
      try {
        const response = await tripApi.buildDay(tripId, {
          dayDate,
          duration,
          startTime,
          cityId,
          interests,
        })
        setProposal(response)
        if (response.proposal.length === 0) {
          toast.warning(
            t("heritage", "proposalEmptyTitle"),
            t("heritage", "proposalEmptyBody", { city: displayCityName }),
          )
        }
      } catch (err) {
        const message =
          err instanceof Error && err.message
            ? err.message
            : t("heritage", "buildError")
        setBuildError(message)
        toast.error(t("heritage", "buildError"), message)
      } finally {
        setBuilding(false)
      }
    },
    [
      user,
      tripId,
      dayDate,
      duration,
      startTime,
      cityId,
      interests,
      displayCityName,
      t,
    ],
  )

  const handleSavePlan = useCallback(async () => {
    if (!proposal || !tripId) return
    setSavingPlan(true)
    try {
      let conflictCount = 0
      for (const item of proposal.proposal) {
        const response = await tripApi.addItem(tripId, {
          dayDate: item.dayDate,
          itemType: "PLACE",
          placeId: item.placeId,
          title: item.title,
          ...(item.startTime ? { startTime: item.startTime } : {}),
          ...(item.durationMin != null
            ? { durationMin: item.durationMin }
            : {}),
          ...(item.notes ? { notes: item.notes } : {}),
          ...(item.estimatedCostEtb != null
            ? { costAmount: item.estimatedCostEtb }
            : {}),
          currency: "ETB",
          createdBy: "AI",
          userConfirmed: true,
        })
        if (response.hasConflict) conflictCount += 1
      }
      toast.success(
        t("heritage", "savedTitle"),
        conflictCount > 0
          ? t("trips", "draftConflicts", { count: conflictCount })
          : displayCityName,
      )
      setProposal(null)
      router.push(`/trips/${tripId}`)
    } catch (err) {
      toast.error(
        t("heritage", "buildError"),
        err instanceof Error ? err.message : undefined,
      )
    } finally {
      setSavingPlan(false)
    }
  }, [proposal, tripId, displayCityName, router, t])

  if (loading && !destination) {
    return (
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6">
        <Skeleton className="h-[22rem] w-full rounded-3xl" />
        <Skeleton className="h-10 w-1/3 rounded-xl" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Skeleton className="h-44 rounded-3xl" />
          <Skeleton className="h-44 rounded-3xl" />
          <Skeleton className="h-44 rounded-3xl" />
        </div>
        <Skeleton className="h-72 rounded-3xl" />
      </div>
    )
  }

  if (loadError || !destination) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <EmptyState
          icon={Landmark}
          title={t("heritage", "notFoundTitle")}
          description={loadError || t("heritage", "notFoundBody")}
          actionLabel={t("heritage", "backToDiscover")}
          onAction={() => router.push("/discover")}
        />
      </div>
    )
  }

  const pickCopy = <T,>(
    apiList: T[] | undefined,
    curatedList: T[] | undefined,
  ): T[] => {
    if (preferCuratedCopy && curatedList?.length) return curatedList
    if (apiList?.length) return apiList
    return curatedList ?? []
  }

  const timelineEntries = pickCopy(history?.timeline, curatedContent?.timeline)
  const storiesList = pickCopy(history?.stories, curatedContent?.stories)
  const cultureNotes = pickCopy(history?.culture, curatedContent?.culture)
  const fullStoryData = curatedContent?.fullStory

  const filterChips: Array<{ id: PlaceFilter ;label: string }> = [
    { id: "all", label: t("heritage", "filterAll") },
    { id: "HERITAGE", label: t("heritage", "filterHeritage") },
    { id: "CASTLE", label: t("heritage", "filterCastles") },
    { id: "MUSEUM", label: t("heritage", "filterMuseums") },
    { id: "RELIGIOUS", label: t("heritage", "filterReligious") },
    { id: "ARCHAEOLOGY", label: t("heritage", "filterArchaeology") },
    { id: "CULTURE", label: t("heritage", "filterCulture") },
  ]

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#07111f] text-slate-800 dark:text-slate-200 antialiased selection:bg-[#e4bd55]/30">
      {}
      {cachedAge && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-center text-xs font-semibold text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300">
          {t("heritage", "offlineModeNotice")} ·{" "}
          {t("heritage", "lastUpdatedLabel", { age: cachedAge })}
        </div>
      )}

      {}
      <section className="relative overflow-hidden bg-[#0b1528]">
        <div className="relative mx-auto max-w-7xl px-4 pt-4 sm:px-6">
          <div className="relative h-[22rem] overflow-hidden rounded-3xl shadow-2xl sm:h-[28rem] lg:h-[34rem]">
            <Image
              src={heroImage}
              alt={t("heritage", "imageAlt", { city: displayCityName })}
              fill
              priority
              sizes="(max-width: 1280px) 100vw, 1280px"
              className="object-cover"
            />
            {}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b1528] via-[#0b1528]/60 to-[#0b1528]/20" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0b1528]/80 via-transparent to-transparent" />

            {}
            <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-3 p-5 sm:p-7">
              <Link
                href="/discover"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white shadow-lg backdrop-blur-md transition hover:bg-white/25 hover:border-white/40"
              >
                <ArrowLeft className="h-4 w-4" />{" "}
                {t("heritage", "breadcrumbRoot")}
              </Link>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleFavoriteToggle}
                  aria-label={t("heritage", "saveToFavorites")}
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition backdrop-blur-md shadow-lg ${
                    isFavoriteCity
                      ? "border-red-400 bg-red-500/80 text-white"
                      : "border-white/20 bg-white/10 text-white hover:bg-white/25"
                  }`}
                >
                  <Heart
                    className={`h-4 w-4 ${
                      isFavoriteCity ? "fill-current" : ""
                    }`}
                  />
                </button>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e4bd55]/50 bg-[#e4bd55] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#0b1528] shadow-lg">
                  <Landmark className="h-3.5 w-3.5" />{" "}
                  {t("heritage", "heroBadge")}
                </span>
              </div>
            </div>

            {}
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#e4bd55]">
                {t("heritage", "heroSubtitle")}
              </p>
              <h1 className="mt-2 font-serif text-3xl font-bold uppercase tracking-tight text-white sm:text-5xl lg:text-6xl">
                {displayCityName}
                {destination.country ? (
                  <span className="text-white/60 font-light ml-2 sm:ml-3">
                    · {destination.country.name}
                  </span>
                ) : null}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/90 sm:text-base">
                {(preferCuratedCopy ? curatedContent?.tagline : null) ??
                  history?.tagline ??
                  curatedContent?.tagline ??
                  destination.description}
              </p>

              {}
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
                  {t("heritage", "placesStat", {
                    count: destination.placeCount || allPlaces.length,
                  })}
                </span>
                <span className="rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
                  {t("heritage", "sitesStat", {
                    count: heritagePlaces.length || 8,
                  })}
                </span>
                <span className="rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
                  {t("heritage", "staysStat", {
                    count: destination.hotelCount || hotels.length,
                  })}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e4bd55]/40 bg-[#0b1528]/70 px-3 py-1.5 text-xs font-semibold text-[#e4bd55] backdrop-blur-md">
                  <Check className="h-3.5 w-3.5" />
                  {t("heritage", "verifiedBy", {
                    source:
                      history?.source?.name ??
                      curatedContent?.primaryCitation.name ??
                      t("discover", "verifiedPublicSource"),
                  })}
                </span>
              </div>

              {}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button
                  onClick={() =>
                    explorerRef.current?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="rounded-2xl border border-[#e4bd55] bg-[#e4bd55] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-[#0b1528] shadow-xl hover:bg-[#E5C158] hover:shadow-2xl transition"
                >
                  <Landmark className="mr-2 h-4 w-4" />{" "}
                  {t("heritage", "exploreHeritageCta")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    aiRef.current?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="rounded-2xl border-white/40 bg-white/10 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-md hover:bg-white/25 hover:border-white shadow-xl transition"
                >
                  <Sparkles className="mr-2 h-4 w-4 text-[#e4bd55]" />{" "}
                  {t("heritage", "askAiCta")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-16 px-4 py-12 sm:px-6 dark:text-slate-200">
        {}
        <section
          aria-labelledby="city-story-heading"
          className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-10"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#e4bd55]">
                {t("heritage", "breadcrumbCurrent")}
              </p>
              <h2
                id="city-story-heading"
                className="font-serif text-2xl font-bold text-[#0b1528] sm:text-3xl"
              >
                {t("heritage", "storyOfCityTitle", { city: displayCityName })}
              </h2>
              <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
                {fullStoryData?.lead ??
                  history?.overview ??
                  t("heritage", "storyFallback", { city: displayCityName })}
              </p>
            </div>
            <div className="shrink-0">
              <Button
                onClick={() => setFullStoryOpen(true)}
                className="rounded-2xl border border-[#0b1528] bg-[#0b1528] px-6 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-[#1E3A5F] hover:shadow-lg transition"
              >
                <BookOpen className="mr-2 h-4 w-4 text-[#e4bd55]" />{" "}
                {t("heritage", "readFullStory")}
              </Button>
            </div>
          </div>
        </section>

        {}
        <section aria-labelledby="heritage-timeline" className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#e4bd55]">
                {t("heritage", "breadcrumbCurrent")}
              </p>
              <h2
                id="heritage-timeline"
                className="font-serif text-2xl font-bold text-[#0b1528] sm:text-3xl"
              >
                {t("heritage", "timelineTitle", { city: displayCityName })}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                {t("heritage", "timelineSubtitle")}
              </p>
            </div>
          </div>

          {timelineEntries.length > 0 ? (
            <ol className="relative space-y-6 border-l-2 border-[#e4bd55]/60 pl-6 sm:pl-8">
              {timelineEntries.map((entry) => (
                <li key={entry.id} className="relative group">
                  <button
                    type="button"
                    onClick={() =>
                      setTimelineDetailEntry(entry as HeritageTimelineEntry)
                    }
                    className="absolute -left-[1.95rem] top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#0b1528] ring-4 ring-[#e4bd55]/30 transition group-hover:scale-125 group-hover:ring-[#e4bd55] sm:-left-[2.45rem]"
                    aria-label={entry.title}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-[#e4bd55]" />
                  </button>
                  <div
                    onClick={() =>
                      setTimelineDetailEntry(entry as HeritageTimelineEntry)
                    }
                    className="cursor-pointer rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition group-hover:-translate-y-0.5 group-hover:border-[#e4bd55]/70 group-hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="rounded-full bg-[#0b1528] px-3 py-1 text-[11px] font-bold text-white shadow-sm">
                          {entry.period}
                        </span>
                        <h3 className="font-serif text-lg font-bold text-[#0b1528]">
                          {entry.title}
                        </h3>
                      </div>
                      <span className="inline-flex items-center text-xs font-bold text-[#0b1528] group-hover:text-[#e4bd55]">
                        {t("discover", "details")}{" "}
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                      {entry.body}
                    </p>
                    <p className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      {t("heritage", "citationLabel")}:{" "}
                      {entry.citation?.url ? (
                        <a
                          href={entry.citation.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          onClick={(e) => e.stopPropagation()}
                          className="font-bold text-[#0b1528] underline underline-offset-2 hover:text-[#e4bd55]"
                        >
                          {entry.citation.name}
                        </a>
                      ) : (
                        entry.citation?.name
                      )}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState
              icon={BookOpen}
              title={t("heritage", "timelineEmptyTitle")}
              description={t("heritage", "timelineEmptyBody", {
                city: displayCityName,
              })}
            />
          )}
        </section>

        {}
        <section aria-labelledby="heritage-stories" className="space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2
              id="heritage-stories"
              className="font-serif text-2xl font-bold text-[#0b1528] sm:text-3xl"
            >
              {t("heritage", "storiesTitle")}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {t("heritage", "storiesSubtitle")}
            </p>
          </div>

          {storiesList.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {storiesList.map((story) => {
                const place = story.placeId
                  ? placesById.get(story.placeId)
                  : undefined
                const image = localImage(place?.images?.[0]) || heroImage
                return (
                  <article
                    key={story.id}
                    onClick={() => setSelectedStory(story as HeritageStory)}
                    className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm transition hover:-translate-y-1 hover:border-[#e4bd55]/60 hover:shadow-xl cursor-pointer dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="relative h-48 overflow-hidden bg-slate-100">
                      <Image
                        src={image}
                        alt={story.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <span className="absolute left-3 top-3 rounded-full bg-[#0b1528]/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#e4bd55] backdrop-blur-md">
                        {"category" in story && (story as any).category
                          ? (story as any).category
                          : t("heritage", "breadcrumbCurrent")}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      <h3 className="font-serif text-lg font-bold text-[#0b1528] group-hover:text-[#B8860B] transition">
                        {story.title}
                      </h3>
                      <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-600">
                        {story.body}
                      </p>
                      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                        <span className="text-[11px] font-semibold text-slate-400">
                          {t("heritage", "citationLabel")}:{" "}
                          {story.citation?.name}
                        </span>
                        <span className="font-bold text-[#0b1528] group-hover:text-[#e4bd55] inline-flex items-center gap-1">
                          {t("discover", "details")}{" "}
                          <ChevronRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <EmptyState
              icon={BookOpen}
              title={t("heritage", "storiesEmptyTitle")}
              description={t("heritage", "storiesEmptyBody", {
                city: displayCityName,
              })}
            />
          )}
        </section>

        {}
        <section
          aria-labelledby="hotel-route-heading"
          className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-slate-100 pb-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#e4bd55]">
                {t("heritage", "hotelRouteContext")}
              </p>
              <h2
                id="hotel-route-heading"
                className="font-serif text-2xl font-bold text-[#0b1528] sm:text-3xl"
              >
                {t("heritage", "hotelRouteTitle")}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                {t("heritage", "hotelRouteSubtitle", { city: displayCityName })}
              </p>
            </div>
            {hotels.length > 0 && (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[#e4bd55]" />
                <select
                  value={activeHotelId ?? ""}
                  onChange={(e) => setActiveHotelId(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-[#0b1528] outline-none focus:border-[#e4bd55]"
                >
                  {hotels.map((h) => (
                    <option key={h.id} value={h.id}>
                      🏨 {h.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {nearbyHotelRoute.length > 0 ? (
            <div className="mt-6 space-y-4">
              {}
              <div className="flex items-center gap-3 rounded-2xl bg-[#0b1528] p-4 text-white">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e4bd55] text-[#0b1528]">
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#e4bd55]">
                    {t("heritage", "startingPoint")}
                  </span>
                  <h4 className="truncate font-serif font-bold text-white text-base">
                    {activeHotel?.name ??
                      t("heritage", "yourHotelIn", { city: displayCityName })}
                  </h4>
                  <p className="truncate text-xs text-slate-300">
                    {activeHotel?.address}
                  </p>
                </div>
              </div>

              {}
              <div className="relative pl-6 sm:pl-8 space-y-4 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#e4bd55]/50 sm:before:left-4">
                {nearbyHotelRoute.map((place, index) => {
                  const CategoryIcon =
                    CATEGORY_ICONS[place.category] ?? Landmark
                  const distanceLabel =
                    place.distanceKm != null
                      ? place.distanceKm < 1
                        ? `${Math.round(place.distanceKm * 1000)} m`
                        : `${place.distanceKm} km`
                      : t("heritage", "nearby")
                  const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`

                  return (
                    <div
                      key={place.id}
                      className="relative flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between hover:bg-white transition"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0b1528] text-xs font-bold text-[#e4bd55] shadow-sm">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-md bg-[#0b1528]/10 px-2 py-0.5 text-[10px] font-bold uppercase text-[#0b1528]">
                              <CategoryIcon className="h-3 w-3" />
                              {categoryLabel(place.category)}
                            </span>
                            <span className="text-xs font-bold text-[#B8860B]">
                              ↓ {distanceLabel}
                            </span>
                          </div>
                          <h4 className="truncate font-serif text-base font-bold text-[#0b1528]">
                            {placeLabel(place)}
                          </h4>
                          <p className="truncate text-xs text-slate-500">
                            {place.address}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 sm:pt-0">
                        <Button
                          size="sm"
                          onClick={() => handleOpenAddModal(place)}
                          leftIcon={
                            <Plus className="h-3.5 w-3.5 text-[#e4bd55]" />
                          }
                          className="min-h-[44px] whitespace-nowrap rounded-xl bg-[#0b1528] px-3.5 text-xs font-bold text-white shadow-sm hover:bg-[#1E3A5F] hover:shadow-md"
                        >
                          {t("heritage", "addToTrip")}
                        </Button>
                        <a
                          href={navUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-[#e4bd55] hover:text-[#0b1528]"
                        >
                          <Navigation className="mr-1 h-3.5 w-3.5 text-[#e4bd55]" />{" "}
                          {t("heritage", "navigate")}
                        </a>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl bg-slate-50 p-6 text-center">
              <p className="text-sm font-semibold text-[#0b1528]">
                {t("heritage", "selectHotelPrompt")}
              </p>
            </div>
          )}
        </section>

        {}
        <section
          ref={explorerRef}
          id="heritage-explorer"
          aria-labelledby="heritage-explorer-heading"
          className="space-y-6"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-slate-200 pb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#e4bd55]">
                {t("heritage", "breadcrumbCurrent")}
              </p>
              <h2
                id="heritage-explorer-heading"
                className="font-serif text-2xl font-bold text-[#0b1528] sm:text-3xl"
              >
                {t("heritage", "explorerTitle")}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                {t("heritage", "explorerSubtitle", { city: displayCityName })}
              </p>
            </div>
            {}
            <div className="flex flex-wrap gap-2">
              {filterChips.map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setPlaceFilter(chip.id)}
                  aria-pressed={placeFilter === chip.id}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition shadow-sm ${
                    placeFilter === chip.id
                      ? "bg-[#0b1528] text-white"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-[#e4bd55]"
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {explorerPlaces.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {explorerPlaces.map((place) => {
                const CategoryIcon = CATEGORY_ICONS[place.category] ?? Landmark
                const image = localImage(place.images?.[0]) || heroImage
                const distanceLabel =
                  place.distanceKm != null
                    ? place.distanceKm < 1
                      ? `${Math.round(place.distanceKm * 1000)} m`
                      : `${place.distanceKm} km`
                    : null
                const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`

                return (
                  <article
                    key={place.id}
                    className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm transition hover:-translate-y-1 hover:border-[#e4bd55]/60 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="relative h-48 overflow-hidden bg-slate-100">
                      <Image
                        src={image}
                        alt={placeLabel(place)}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold text-[#0b1528] shadow-sm">
                        <CategoryIcon className="h-3 w-3" />{" "}
                        {categoryLabel(place.category)}
                      </span>
                      {distanceLabel && (
                        <span className="absolute right-3 top-3 rounded-full bg-[#0b1528]/90 px-2.5 py-1 text-[10px] font-bold text-[#e4bd55] backdrop-blur-md shadow-sm">
                          {t("heritage", "distanceFromHotel", {
                            distance: distanceLabel,
                          })}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="font-serif text-lg font-bold text-[#0b1528] group-hover:text-[#B8860B] transition">
                        {placeLabel(place)}
                      </h3>
                      {place.amharicName && (
                        <p className="text-xs font-semibold text-[#B8860B] mt-0.5">
                          {language === "am" ? place.name : place.amharicName}
                        </p>
                      )}
                      <p className="mt-2 line-clamp-2 flex-1 text-xs text-slate-500 leading-relaxed">
                        {placeDescription(place)}
                      </p>

                      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3 text-[11px] font-semibold text-slate-500">
                        {place.rating ? (
                          <span className="inline-flex items-center gap-1 text-[#B8860B]">
                            <Star className="h-3.5 w-3.5 fill-current" />{" "}
                            {place.rating.toFixed(1)}
                          </span>
                        ) : null}
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-[#e4bd55]" />{" "}
                          {place.address}
                        </span>
                        <span className="inline-flex items-center gap-1 text-emerald-700">
                          <Check className="h-3 w-3" />{" "}
                          {t("discover", "verified")}
                        </span>
                      </div>

                      {}
                      <div className="mt-4 grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                        <Button
                          size="sm"
                          onClick={() => handleOpenAddModal(place)}
                          leftIcon={
                            <Plus className="h-3.5 w-3.5 text-[#e4bd55]" />
                          }
                          className="min-h-[44px] w-full whitespace-nowrap rounded-xl bg-[#0b1528] px-2 text-[10px] font-bold leading-tight text-white shadow-sm hover:bg-[#1E3A5F] hover:shadow-md"
                        >
                          {t("heritage", "addToTrip")}
                        </Button>
                        <a
                          href={navUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-bold text-slate-700 hover:border-[#e4bd55]"
                        >
                          <Navigation className="mr-1 h-3 w-3 text-[#e4bd55]" />{" "}
                          {t("heritage", "navigate")}
                        </a>
                        <button
                          type="button"
                          onClick={() =>
                            handleAskAiAbout(
                              t("heritage", "aiPromptStoryFor", {
                                place: placeLabel(place),
                              }),
                            )
                          }
                          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-bold text-[#0b1528] hover:border-[#e4bd55] hover:bg-[#e4bd55]/10"
                        >
                          <Sparkles className="mr-1 h-3 w-3 text-[#e4bd55]" />{" "}
                          {t("heritage", "askAiAboutPlace")}
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <EmptyState
              icon={Compass}
              title={t("heritage", "explorerEmptyTitle")}
              description={t("heritage", "explorerEmptyBody")}
            />
          )}
        </section>

        {}
        <section
          aria-labelledby="heritage-map-heading"
          className="space-y-4 overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#e4bd55]">
                {t("heritage", "breadcrumbCurrent")}
              </p>
              <h2
                id="heritage-map-heading"
                className="font-serif text-2xl font-bold text-[#0b1528] sm:text-3xl"
              >
                {t("heritage", "mapTitle")}
              </h2>
            </div>
            {}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={mapSearchQuery}
                  onChange={(e) => setMapSearchQuery(e.target.value)}
                  placeholder={t("heritage", "mapSearchPlaceholder", {
                    city: displayCityName,
                  })}
                  className="rounded-xl border border-slate-200 pl-8 pr-3 py-1.5 text-xs outline-none focus:border-[#e4bd55]"
                />
              </div>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                {(["all", "1", "5", "10"] as RadiusFilter[]).map((rad) => (
                  <button
                    key={rad}
                    type="button"
                    onClick={() => setRadiusFilter(rad)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                      radiusFilter === rad
                        ? "bg-[#0b1528] text-white shadow-sm"
                        : "text-slate-600 hover:text-[#0b1528]"
                    }`}
                  >
                    {rad === "all"
                      ? t("heritage", "mapRadiusAll")
                      : `${rad} km`}
                  </button>
                ))}
              </div>
              <div
                className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1"
                role="group"
                aria-label={t("heritage", "mapViewLabel")}
              >
                <button
                  type="button"
                  aria-pressed={mapMode === "map"}
                  onClick={() => setMapMode("map")}
                  className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                    mapMode === "map"
                      ? "bg-[#0b1528] text-white shadow-sm"
                      : "text-slate-600 hover:text-[#0b1528]"
                  }`}
                >
                  <MapIcon className="h-3.5 w-3.5" />{" "}
                  {t("heritage", "mapViewMap")}
                </button>
                <button
                  type="button"
                  aria-pressed={mapMode === "list"}
                  onClick={() => setMapMode("list")}
                  className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                    mapMode === "list"
                      ? "bg-[#0b1528] text-white shadow-sm"
                      : "text-slate-600 hover:text-[#0b1528]"
                  }`}
                >
                  <List className="h-3.5 w-3.5" />{" "}
                  {t("heritage", "mapViewList")}
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#e4bd55]/25 bg-[#FFF9E8]/70 px-3.5 py-2.5 text-[11px] font-semibold text-[#0b1528]">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#0b1528] ring-2 ring-[#e4bd55]/30" />
                {t("heritage", "mapHotelLegend")}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#e4bd55] ring-2 ring-white" />
                {t("heritage", "mapPlaceLegend")}
              </span>
            </div>
            <span className="text-slate-600">
              {t("heritage", "mapResultsCount", {
                count: mapFilteredPlaces.length,
              })}
            </span>
          </div>

          {mapMode === "map" ? (
            <div className="relative h-80 overflow-hidden rounded-2xl border border-slate-200 bg-[#E8EEF2] sm:h-96">
              <HeritageMap
                places={mapFilteredPlaces}
                selectedPlaceId={selectedPlaceId}
                onSelect={setSelectedPlaceId}
                hotel={
                  activeHotel?.lat != null && activeHotel?.lng != null
                    ? {
                        name: activeHotel.name,
                        lat: activeHotel.lat,
                        lng: activeHotel.lng,
                      }
                    : null
                }
                radiusKm={
                  radiusFilter === "all" ? null : parseFloat(radiusFilter)
                }
                onAddToTrip={handleOpenAddModal}
                onAskAi={(p) =>
                  handleAskAiAbout(
                    `Tell me the history and significance of ${p.name}`,
                  )
                }
                detailUrlPrefix="/discover"
                className="h-full w-full"
              />
              <div className="pointer-events-none absolute left-3 top-3 z-[400] rounded-xl bg-white/95 px-3 py-1.5 text-xs font-bold text-[#0b1528] shadow-sm backdrop-blur">
                <MapPin className="mr-1 inline h-3.5 w-3.5 text-[#e4bd55]" />{" "}
                {displayCityName} · {mapFilteredPlaces.length} places
              </div>
            </div>
          ) : (
            <div
              className="grid max-h-96 gap-3 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3"
              aria-label={t("heritage", "mapListLabel")}
            >
              {mapFilteredPlaces.length > 0 ? (
                mapFilteredPlaces.map((place) => {
                  const CategoryIcon =
                    CATEGORY_ICONS[place.category] ?? Landmark
                  const active = selectedPlaceId === place.id
                  return (
                    <button
                      key={place.id}
                      type="button"
                      onClick={() => {
                        setSelectedPlaceId(active ? null : place.id)
                        setMapMode("map")
                      }}
                      className={`flex min-h-[86px] items-center gap-3 rounded-2xl border p-3 text-left transition ${
                        active
                          ? "border-[#e4bd55] bg-[#FFF9E8] shadow-sm"
                          : "border-slate-200 bg-white hover:border-[#e4bd55]/70 hover:shadow-sm"
                      }`}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e4bd55]/15 text-[#0b1528]">
                        <CategoryIcon className="h-5 w-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold text-[#0b1528]">
                          {placeLabel(place)}
                        </span>
                        <span className="mt-1 block truncate text-xs text-slate-500">
                          {categoryLabel(place.category)}
                          {place.distanceKm != null
                            ? ` · ${place.distanceKm} km`
                            : ""}
                        </span>
                      </span>
                      <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-slate-400" />
                    </button>
                  )
                })
              ) : (
                <div className="sm:col-span-2 lg:col-span-3">
                  <EmptyState
                    icon={MapPin}
                    title={t("heritage", "mapEmpty")}
                    description={t("heritage", "explorerEmptyBody")}
                  />
                </div>
              )}
            </div>
          )}

          {}
          {selectedPlace && (
            <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between shadow-sm animate-in fade-in">
              <div className="flex items-center gap-4 min-w-0">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-200">
                  <Image
                    src={localImage(selectedPlace.images?.[0]) || heroImage}
                    alt={selectedPlace.name}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#e4bd55]">
                    {categoryLabel(selectedPlace.category)}{" "}
                    {selectedPlace.distanceKm
                      ? `· ${selectedPlace.distanceKm} km`
                      : ""}
                  </span>
                  <h3 className="truncate font-serif text-lg font-bold text-[#0b1528]">
                    {selectedPlace.name}
                  </h3>
                  <p className="truncate text-xs text-slate-500">
                    {selectedPlace.address}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => handleOpenAddModal(selectedPlace)}
                  leftIcon={<Plus className="h-3.5 w-3.5 text-[#e4bd55]" />}
                  className="min-h-[44px] whitespace-nowrap rounded-xl bg-[#0b1528] px-3.5 text-xs font-bold text-white shadow-sm hover:bg-[#1E3A5F] hover:shadow-md"
                >
                  {t("heritage", "addToTrip")}
                </Button>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedPlace.lat},${selectedPlace.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-[#e4bd55]"
                >
                  <Navigation className="mr-1 h-3.5 w-3.5 text-[#e4bd55]" />{" "}
                  {t("heritage", "navigate")}
                </a>
                <Link
                  href={`/discover/${selectedPlace.id}`}
                  className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-[#0b1528] hover:border-[#e4bd55]"
                >
                  {t("discover", "details")}{" "}
                  <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Link>
              </div>
            </div>
          )}
        </section>

        {}
        <section aria-labelledby="heritage-culture" className="space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2
              id="heritage-culture"
              className="font-serif text-2xl font-bold text-[#0b1528] sm:text-3xl"
            >
              {t("heritage", "cultureTitle")}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {t("heritage", "cultureSubtitle")}
            </p>
          </div>

          {cultureNotes.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {cultureNotes.map((note) => {
                return (
                  <div
                    key={note.id}
                    className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm hover:border-[#e4bd55]/50 hover:shadow-md transition dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e4bd55]/15 text-[#0b1528]">
                      <Palette className="h-6 w-6 text-[#0b1528]" />
                    </div>
                    <h3 className="mt-4 font-serif text-lg font-bold text-[#0b1528]">
                      {note.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                      {note.body}
                    </p>
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyState
              icon={Palette}
              title={t("heritage", "cultureEmptyTitle")}
              description={t("heritage", "cultureEmptyBody")}
            />
          )}
        </section>

        {}
        <section
          ref={aiRef}
          id="heritage-ai"
          aria-labelledby="heritage-ai-heading"
          className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8"
        >
          <div className="border-b border-slate-100 pb-5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#e4bd55]" />
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#e4bd55]">
                {t("heritage", "aiHistorianRole")}
              </p>
            </div>
            <h2
              id="heritage-ai-heading"
              className="mt-1 font-serif text-2xl font-bold text-[#0b1528] sm:text-3xl"
            >
              {t("heritage", "aiAskAboutCity", { city: displayCityName })}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {t("heritage", "aiSubtitle")}
            </p>
          </div>

          {tokens ? (
            <div className="mt-6 space-y-4">
              {}
              <div className="flex flex-wrap gap-2">
                {[
                  t("heritage", "aiPromptImportant"),
                  t("heritage", "aiPromptNearby"),
                  t("heritage", "aiPromptStory"),
                  t("heritage", "aiPrompt3Hours"),
                ].map((promptText, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() =>
                      setAiInitialPrompt(
                        `${promptText} ${t("heritage", "aiPromptRegarding", { city: displayCityName })}`,
                      )
                    }
                    className="rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-[#0b1528] hover:border-[#e4bd55] hover:bg-[#e4bd55]/10 transition"
                  >
                    ✨ {promptText}
                  </button>
                ))}
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-inner">
                <AIChat
                  variant="inline"
                  initialPrompt={aiInitialPrompt}
                  placeholder={t("heritage", "aiAskAboutCity", {
                    city: displayCityName,
                  })}
                  suggestedPrompts={[
                    t("heritage", "aiPromptSignificance", {
                      city: displayCityName,
                    }),
                    t("heritage", "aiPromptMustSee", {
                      hotel: activeHotel?.name ?? displayCityName,
                    }),
                    t("heritage", "aiPromptStoryFor", {
                      place: timelineEntries[0]?.title ?? displayCityName,
                    }),
                  ]}
                />
              </div>
            </div>
          ) : (
            <div className="mt-6">
              <EmptyState
                icon={Sparkles}
                title={t("heritage", "aiSignInTitle")}
                description={t("heritage", "aiSignInBody")}
                actionLabel={t("common", "signIn")}
                onAction={() => router.push("/auth")}
              />
            </div>
          )}
        </section>

        {}
        <section aria-labelledby="heritage-build-heading" className="space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#e4bd55]">
              {t("heritage", "breadcrumbCurrent")}
            </p>
            <h2
              id="heritage-build-heading"
              className="font-serif text-2xl font-bold text-[#0b1528] sm:text-3xl"
            >
              {t("heritage", "buildTitle")}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {t("heritage", "buildSubtitle", { city: displayCityName })}
            </p>
          </div>

          {!user ? (
            <EmptyState
              icon={Wand2}
              title={t("heritage", "signInToPlanTitle")}
              description={t("heritage", "signInToPlanBody")}
              actionLabel={t("common", "signIn")}
              onAction={() => router.push("/auth")}
            />
          ) : trips.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title={t("heritage", "noTripsTitle")}
              description={t("heritage", "noTripsBody")}
              actionLabel={t("heritage", "createTrip")}
              onAction={() => router.push("/trips")}
            />
          ) : (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
              {}
              <form
                onSubmit={handleBuildDay}
                className="h-fit space-y-5 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div>
                  <label
                    className="mb-1.5 block text-xs font-bold text-[#0b1528]"
                    htmlFor="heritage-trip"
                  >
                    {t("heritage", "tripLabel")}
                  </label>
                  <select
                    id="heritage-trip"
                    value={tripId}
                    onChange={(event) => {
                      setTripId(event.target.value)
                      const trip = trips.find(
                        (item) => item.id === event.target.value,
                      )
                      if (trip) setDayDate(trip.startDate.slice(0, 10))
                      setProposal(null)
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold outline-none focus:border-[#e4bd55]"
                  >
                    {trips.map((trip) => (
                      <option key={trip.id} value={trip.id}>
                        {trip.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      className="mb-1.5 block text-xs font-bold text-[#0b1528]"
                      htmlFor="heritage-date"
                    >
                      {t("heritage", "dateLabel")}
                    </label>
                    <input
                      id="heritage-date"
                      type="date"
                      value={dayDate}
                      min={selectedTrip?.startDate.slice(0, 10)}
                      max={selectedTrip?.endDate.slice(0, 10)}
                      onChange={(event) => setDayDate(event.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold outline-none focus:border-[#e4bd55]"
                    />
                  </div>
                  <div>
                    <label
                      className="mb-1.5 block text-xs font-bold text-[#0b1528]"
                      htmlFor="heritage-time"
                    >
                      {t("heritage", "startTimeLabel")}
                    </label>
                    <input
                      id="heritage-time"
                      type="time"
                      value={startTime}
                      onChange={(event) => setStartTime(event.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold outline-none focus:border-[#e4bd55]"
                    />
                  </div>
                </div>

                {}
                <div>
                  <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#0b1528]">
                    {t("heritage", "step1Time")}
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "2_HOURS", label: t("heritage", "duration2h") },
                      { id: "HALF_DAY", label: t("heritage", "durationHalf") },
                      { id: "FULL_DAY", label: t("heritage", "durationFull") },
                      {
                        id: "MULTIPLE_DAYS",
                        label: t("heritage", "durationMultiple"),
                      },
                    ].map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setDuration(d.id as Duration)}
                        className={`rounded-xl py-2 px-3 text-xs font-bold transition ${
                          duration === d.id
                            ? "bg-[#0b1528] text-white shadow-sm"
                            : "border border-slate-200 bg-white text-slate-600 hover:border-[#e4bd55]"
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                {}
                <div>
                  <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#0b1528]">
                    {t("heritage", "step2Interests")}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {INTEREST_OPTIONS.map((option) => {
                      const active = interests.includes(option.id)
                      const Icon = option.icon
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => toggleInterest(option.id)}
                          aria-pressed={active}
                          className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                            active
                              ? "bg-[#0b1528] text-white shadow-sm"
                              : "border border-slate-200 bg-white text-slate-600 hover:border-[#e4bd55]"
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {t(
                            "heritage",
                            `interest${option.id.charAt(0).toUpperCase()}${option.id.slice(1)}`,
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={building || !tripId || !dayDate}
                  className="w-full rounded-2xl bg-[#0b1528] py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-[#1E3A5F] hover:shadow-lg disabled:opacity-50"
                >
                  <Wand2 className="mr-2 h-4 w-4 text-[#e4bd55]" />
                  {building
                    ? t("heritage", "building")
                    : t("heritage", "createMyDay")}
                </Button>

                {buildError && (
                  <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                    {buildError}
                  </p>
                )}
              </form>

              {}
              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                {proposal ? (
                  <div className="space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#e4bd55]">
                          {t("heritage", "proposalTitle")}
                        </p>
                        <h3 className="font-serif text-xl font-bold text-[#0b1528]">
                          {proposal.cityName ?? displayCityName}
                        </h3>
                      </div>
                      <span className="rounded-full bg-[#0b1528]/10 px-3.5 py-1.5 text-xs font-bold text-[#0b1528]">
                        {t("heritage", "proposalSummary", {
                          minutes:
                            proposal.totalDurationMin ??
                            t("heritage", "durationUnavailable"),
                          budget:
                            proposal.estimatedBudgetEtb ??
                            t("heritage", "costUnavailable"),
                        })}
                      </span>
                    </div>

                    {proposal.proposal.length > 0 ? (
                      <ol className="space-y-3">
                        {proposal.proposal.map((item, idx) => {
                          const image = localImage(item.place?.images?.[0])
                          return (
                            <li
                              key={`${item.placeId}-${item.startTime}-${idx}`}
                              className="flex items-center gap-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 hover:bg-white transition"
                            >
                              <span className="w-16 shrink-0 rounded-lg bg-[#0b1528] px-2 py-1.5 text-center text-xs font-bold text-white shadow-sm">
                                {item.startTime ??
                                  t("heritage", "timeUnavailable")}
                              </span>
                              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-slate-200">
                                {image ? (
                                  <Image
                                    src={image}
                                    alt=""
                                    fill
                                    sizes="48px"
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full items-center justify-center">
                                    <Landmark className="h-5 w-5 text-[#0b1528]/40" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-bold text-[#0b1528]">
                                  {item.title}
                                </p>
                                <p className="truncate text-xs text-slate-500">
                                  {item.place?.address} ·{" "}
                                  {item.durationMin != null
                                    ? `${item.durationMin} min`
                                    : ""}{" "}
                                  ·{" "}
                                  {item.estimatedCostEtb != null
                                    ? `${item.estimatedCostEtb} ETB`
                                    : ""}
                                </p>
                              </div>
                              <Link
                                href={`/discover/${item.placeId}`}
                                className="shrink-0 text-xs font-bold text-[#0b1528] underline underline-offset-2 hover:text-[#e4bd55]"
                              >
                                {t("discover", "details")}
                              </Link>
                            </li>
                          )
                        })}
                      </ol>
                    ) : (
                      <EmptyState
                        icon={Calendar}
                        title={t("heritage", "proposalEmptyTitle")}
                        description={t("heritage", "proposalEmptyBody", {
                          city: displayCityName,
                        })}
                      />
                    )}

                    {proposal.proposal.length > 0 && (
                      <div className="flex flex-wrap gap-3 pt-3 border-t border-slate-100">
                        <Button
                          onClick={handleSavePlan}
                          disabled={savingPlan}
                          className="rounded-2xl bg-[#0b1528] px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#1E3A5F]"
                        >
                          <Check className="mr-2 h-4 w-4 text-[#e4bd55]" />
                          {t("heritage", "itineraryAddAll")}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setProposal(null)}
                          disabled={savingPlan}
                          className="rounded-2xl border-slate-200 text-xs font-bold"
                        >
                          {t("discover", "clear")}
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex h-full min-h-72 flex-col items-center justify-center text-center p-8">
                    <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#0b1528]/5 text-[#0b1528]">
                      <MapIcon className="h-8 w-8 stroke-[1.5]" />
                    </div>
                    <h4 className="mt-4 font-serif text-lg font-bold text-[#0b1528]">
                      {t("heritage", "buildTitle")}
                    </h4>
                    <p className="mt-1 max-w-sm text-xs text-slate-500">
                      {t("heritage", "buildSubtitle", {
                        city: displayCityName,
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {}
        <section aria-labelledby="heritage-stays" className="space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2
              id="heritage-stays"
              className="font-serif text-2xl font-bold text-[#0b1528] sm:text-3xl"
            >
              {t("heritage", "staysTitle")}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {t("heritage", "staysSubtitle", { city: displayCityName })}
            </p>
          </div>

          {hotels.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {hotels.map((hotel) => {
                const image = localImage(hotel.images?.[0])
                return (
                  <Link
                    key={hotel.id}
                    href={`/hotel/${hotel.id}`}
                    className="group flex items-center gap-4 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:border-[#e4bd55]/60 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                      {image ? (
                        <Image
                          src={image}
                          alt={hotel.name}
                          fill
                          sizes="112px"
                          className="object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Building2 className="h-8 w-8 text-[#0b1528]/30" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-serif text-base font-bold text-[#0b1528]">
                        {hotel.name}
                      </h3>
                      <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate-500">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-[#e4bd55]" />{" "}
                        {hotel.address}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="flex items-center text-xs font-bold text-[#B8860B]">
                          <Star className="h-3.5 w-3.5 fill-current mr-1" />{" "}
                          {hotel.starRating}
                        </span>
                        <span className="rounded-xl bg-[#0b1528] px-3 py-1 text-[11px] font-bold text-white shadow-sm">
                          {t("heritage", "viewStay")}
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <EmptyState
              icon={Building2}
              title={t("heritage", "staysEmptyTitle")}
              description={t("heritage", "staysEmptyBody", {
                city: displayCityName,
              })}
            />
          )}
        </section>
      </div>

      {}
      {fullStoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl animate-in fade-in zoom-in-95">
            <div className="sticky top-0 z-10 flex items-center justify-between bg-[#0b1528] px-6 py-5 text-white">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-[#e4bd55]" />
                <h3 className="font-serif text-lg font-bold">
                  {t("heritage", "fullStoryTitle", { city: displayCityName })}
                </h3>
              </div>
              <button
                onClick={() => setFullStoryOpen(false)}
                className="rounded-full bg-white/10 p-1.5 text-white hover:bg-white/20 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 sm:p-8 space-y-8">
              <div className="space-y-3">
                <p className="font-serif text-lg font-bold text-[#0b1528] leading-relaxed">
                  {fullStoryData?.lead ?? history?.overview}
                </p>
              </div>

              {}
              {fullStoryData?.sections && fullStoryData.sections.length > 0 ? (
                <div className="space-y-6">
                  {fullStoryData.sections.map((sec, idx) => (
                    <div
                      key={idx}
                      className="border-t border-slate-100 pt-5 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-serif text-xl font-bold text-[#0b1528]">
                          {sec.heading}
                        </h4>
                        {sec.era && (
                          <span className="rounded-full bg-[#e4bd55]/20 px-3 py-0.5 text-xs font-bold text-[#0b1528]">
                            {sec.era}
                          </span>
                        )}
                      </div>
                      <p className="text-sm leading-relaxed text-slate-700">
                        {sec.body}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}

              {}
              {fullStoryData?.keyDates && fullStoryData.keyDates.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-3">
                  <h4 className="font-serif text-base font-bold text-[#0b1528] flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[#e4bd55]" />
                    {t("heritage", "keyHistoricalDates")}
                  </h4>
                  <div className="space-y-2">
                    {fullStoryData.keyDates.map((kd, idx) => (
                      <div
                        key={idx}
                        className="flex items-baseline gap-3 text-xs"
                      >
                        <span className="w-16 shrink-0 font-bold text-[#0b1528] bg-white px-2 py-1 rounded border border-slate-200 text-center">
                          {kd.year}
                        </span>
                        <span className="text-slate-700">{kd.event}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500 space-y-1">
                <span className="font-bold text-[#0b1528] flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  {t("heritage", "curatorSourceTitle")}
                </span>
                <p>
                  {fullStoryData?.curatorNote ??
                    t("heritage", "curatorSourceNote")}
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={() => setFullStoryOpen(false)}
                  className="rounded-xl bg-[#0b1528] text-xs font-bold text-white hover:bg-[#1E3A5F]"
                >
                  {t("heritage", "close")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {}
      {timelineDetailEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between bg-[#0b1528] px-6 py-4 text-white">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-[#e4bd55]" />
                <h3 className="font-serif text-lg font-bold">
                  {timelineDetailEntry.period}
                </h3>
              </div>
              <button
                onClick={() => setTimelineDetailEntry(null)}
                className="rounded-full bg-white/10 p-1.5 text-white hover:bg-white/20 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <h4 className="font-serif text-xl font-bold text-[#0b1528]">
                {timelineDetailEntry.title}
              </h4>
              <p className="text-sm leading-relaxed text-slate-700">
                {timelineDetailEntry.body}
              </p>

              {timelineDetailEntry.highlights &&
                timelineDetailEntry.highlights.length > 0 && (
                  <div className="space-y-1.5 rounded-2xl bg-slate-50 p-4 border border-slate-200">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#e4bd55]">
                      {t("heritage", "periodHighlights")}
                    </span>
                    <ul className="space-y-1 text-xs text-slate-700 list-disc list-inside">
                      {timelineDetailEntry.highlights.map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  </div>
                )}

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  {timelineDetailEntry.citation.name}
                </span>
                {timelineDetailEntry.relatedPlaceId && (
                  <Link
                    href={`/discover/${timelineDetailEntry.relatedPlaceId}`}
                    className="inline-flex items-center font-bold text-[#0b1528] underline underline-offset-2 hover:text-[#e4bd55]"
                  >
                    {t("heritage", "viewRelatedPlace")}{" "}
                    <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {}
      {selectedStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between bg-[#0b1528] px-6 py-4 text-white">
              <h3 className="font-serif text-lg font-bold">
                {selectedStory.title}
              </h3>
              <button
                onClick={() => setSelectedStory(null)}
                className="rounded-full bg-white/10 p-1.5 text-white hover:bg-white/20 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm leading-relaxed text-slate-700">
                {selectedStory.body}
              </p>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
                <span>
                  {t("heritage", "citationLabel")}:{" "}
                  {selectedStory.citation?.name}
                </span>
                {selectedStory.placeId && (
                  <Link
                    href={`/discover/${selectedStory.placeId}`}
                    className="inline-flex items-center rounded-xl bg-[#0b1528] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#1E3A5F]"
                  >
                    {t("discover", "details")}{" "}
                    <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {}
      {addToTripPlace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between bg-[#0b1528] px-6 py-4 text-white">
              <h3 className="font-serif text-lg font-bold">
                {t("heritage", "addToTrip")}
              </h3>
              <button
                onClick={() => setAddToTripPlace(null)}
                className="rounded-full bg-white/10 p-1.5 text-white hover:bg-white/20 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmAddToTrip} className="p-6 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#e4bd55]">
                  {categoryLabel(addToTripPlace.category)}
                </span>
                <h4 className="font-serif text-base font-bold text-[#0b1528]">
                  {addToTripPlace.name}
                </h4>
                <p className="text-xs text-slate-500 truncate">
                  {addToTripPlace.address}
                </p>
              </div>

              {trips.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-xs text-slate-500 mb-3">
                    {t("heritage", "noTripsBody")}
                  </p>
                  <Link
                    href="/trips"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#0b1528] px-4 py-2 text-xs font-bold text-white"
                  >
                    <Plus className="h-3.5 w-3.5" />{" "}
                    {t("heritage", "createTrip")}
                  </Link>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                      {t("heritage", "tripLabel")}
                    </label>
                    <select
                      value={addTripId}
                      onChange={(e) => {
                        setAddTripId(e.target.value)
                        const found = trips.find(
                          (item) => item.id === e.target.value,
                        )
                        if (found) setAddTripDate(found.startDate.slice(0, 10))
                      }}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-[#0b1528] outline-none focus:border-[#e4bd55]"
                    >
                      {trips.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                        {t("heritage", "dateLabel")}
                      </label>
                      <input
                        type="date"
                        value={addTripDate}
                        onChange={(e) => setAddTripDate(e.target.value)}
                        required
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold outline-none focus:border-[#e4bd55]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                        {t("heritage", "startTimeLabel")}
                      </label>
                      <input
                        type="time"
                        value={addTripTime}
                        onChange={(e) => setAddTripTime(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold outline-none focus:border-[#e4bd55]"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setAddToTripPlace(null)}
                      className="text-xs font-semibold"
                    >
                      {t("discover", "cancel")}
                    </Button>
                    <Button
                      type="submit"
                      loading={addingToTrip}
                      className="rounded-xl bg-[#0b1528] text-xs font-bold text-white hover:bg-[#1E3A5F]"
                    >
                      {t("heritage", "addToTrip")}
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
