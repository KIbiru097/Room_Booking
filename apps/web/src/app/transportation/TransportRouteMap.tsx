"use client"

// Estimated driving time (approx 25-30 km/h in city traffic)
/* Top Bar with Route Controls */ /* Route Selector Dropdowns */ /* Map Container */ /* Direct Route Polyline */ /* Hub Markers */ /* Floating Route Summary Overlay */

import { useEffect, useMemo, useState } from "react"
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet"
import L from "leaflet"
import { ArrowRight, Car, Compass } from "lucide-react"

export interface TransitHub {
  id: string
  name: string
  amharicName?: string
  category: "AIRPORT" | "HOTEL" | "BUSINESS" | "LANDMARK"
  lat: number
  lng: number
  description: string
}

export const POPULAR_HUBS: TransitHub[] = [
  {
    id: "bole-airport",
    name: "Bole International Airport (ADD)",
    amharicName: "ቦሌ ዓለም አቀፍ አውሮፕላን ማረፊያ",
    category: "AIRPORT",
    lat: 8.9778,
    lng: 38.7993,
    description: "Main international terminal & arrivals pickup zone.",
  },
  {
    id: "skylight-hotel",
    name: "Ethiopian Skylight Hotel",
    amharicName: "የኢትዮጵያ ስካይላይት ሆቴል",
    category: "HOTEL",
    lat: 8.9835,
    lng: 38.793,
    description: "Premier luxury hotel 5 minutes from Bole Airport.",
  },
  {
    id: "hyatt-regency",
    name: "Hyatt Regency Addis Ababa",
    amharicName: "ሃያት ሬጀንሲ አዲስ አበባ",
    category: "HOTEL",
    lat: 9.012,
    lng: 38.7635,
    description: "Luxury hotel located directly by Meskel Square.",
  },
  {
    id: "sheraton-addis",
    name: "Sheraton Addis, Luxury Collection",
    amharicName: "ሸራተን አዲስ ሆቴል",
    category: "HOTEL",
    lat: 9.019,
    lng: 38.7595,
    description: "Iconic hilltop hotel overlooking the capital.",
  },
  {
    id: "kazanchis-eca",
    name: "Kazanchis & UNECA Hub",
    amharicName: "ካዛንቺስ እና የተባበሩት መንግስታት ኮሚሽን",
    category: "BUSINESS",
    lat: 9.0175,
    lng: 38.7675,
    description: "Diplomatic & commercial center of Addis Ababa.",
  },
  {
    id: "meskel-square",
    name: "Meskel Square Transit Center",
    amharicName: "መስቀል አደባባይ",
    category: "LANDMARK",
    lat: 9.0105,
    lng: 38.7612,
    description: "Central transport junction & Light Rail interchange.",
  },
  {
    id: "bole-medhanialem",
    name: "Bole Medhanialem & Edna Mall",
    amharicName: "ቦሌ መድኃኔዓለም",
    category: "LANDMARK",
    lat: 8.9961,
    lng: 38.7885,
    description: "Vibrant dining, shopping, and entertainment quarter.",
  },
  {
    id: "au-headquarters",
    name: "African Union Headquarters (AU)",
    amharicName: "የአፍሪካ ህብረት ዋና መስሪያ ቤት",
    category: "BUSINESS",
    lat: 8.9985,
    lng: 38.7445,
    description: "Continental diplomatic headquarters in Sarbet.",
  },
  {
    id: "piazza-historic",
    name: "Piazza & Historic Center",
    amharicName: "ፒያሳ የታሪክ ማዕከል",
    category: "LANDMARK",
    lat: 9.0345,
    lng: 38.7516,
    description: "Old city heritage district, jewelry market & cafes.",
  },
  {
    id: "entoto-park",
    name: "Entoto Natural & Wellness Park",
    amharicName: "እንጦጦ ፓርክ",
    category: "LANDMARK",
    lat: 9.091,
    lng: 38.762,
    description: "Highland mountain retreat with panoramic views of Addis.",
  },
]

function createHubIcon(
  category: string,
  isPickup: boolean,
  isDropoff: boolean,
) {
  const size =
    isPickup ||
    isDropoff
      ? 44
      : 34
  let bgColor = "#0b1528"
  let borderColor = "#ffffff"
  let iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e4bd55" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>`

  if (
    category ===
    "AIRPORT"
  ) {
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e4bd55" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>`
  } else if (
    category ===
    "HOTEL"
  ) {
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e4bd55" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>`
  }

  if (isPickup) {
    bgColor = "#10B981"
    borderColor = "#ffffff"
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"/><path d="m19 15-7 7-7-7"/></svg>`
  } else if (isDropoff) {
    bgColor = "#e4bd55"
    borderColor = "#0b1528"
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0b1528" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`
  }

  const ringStyle =
    isPickup ||
    isDropoff
      ? "box-shadow: 0 0 0 4px rgba(212,175,55,0.4), 0 8px 18px rgba(0,0,0,0.3);"
      : "box-shadow: 0 4px 12px rgba(0,0,0,0.2);"

  return L.divIcon({
    className: "transport-custom-hub",
    html: `
      <div style="width: ${size}px; height: ${size}px; border-radius: 9999px; background: ${bgColor}; border: 3px solid ${borderColor}; display: flex; align-items: center; justify-content: center; ${ringStyle} transition: transform 0.2s ease;">
        ${iconSvg}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [
      size /
        2,
      size /
        2,
    ],
    popupAnchor: [0, -size / 2 - 4],
  })
}

function FitRouteBounds({
  pickup,
  dropoff,
}: {
  pickup: TransitHub
  dropoff: TransitHub
}) {
  const map = useMap()
  useEffect(() => {
    const coords: [number, number][] = [
      [pickup.lat, pickup.lng],
      [dropoff.lat, dropoff.lng],
    ]
    map.fitBounds(coords, { padding: [50, 50], maxZoom: 15, animate: true })
  }, [pickup, dropoff, map])
  return null
}

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371
  const toRad = (val: number) => (val * Math.PI) / 180
  const dLat = toRad(
    lat2 -
      lat1,
  )
  const dLng = toRad(
    lng2 -
      lng1,
  )
  const a =
    Math.sin(
      dLat /
        2,
    ) **
      2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(
        dLng /
          2,
      ) **
        2
  return (
    R *
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(
        1 -
          a,
      ),
    )
  )
}

interface TransportRouteMapProps {
  onSelectRoute?: (pickupName: string, dropoffName: string) => void
}

export default function TransportRouteMap({
  onSelectRoute,
}: TransportRouteMapProps) {
  const [pickupHubId, setPickupHubId] = useState<string>("bole-airport")
  const [dropoffHubId, setDropoffHubId] = useState<string>("hyatt-regency")

  const pickupHub = useMemo(
    () =>
      POPULAR_HUBS.find(
        (h) =>
          h.id ===
          pickupHubId,
      ) ??
      POPULAR_HUBS[0],
    [pickupHubId],
  )
  const dropoffHub = useMemo(
    () =>
      POPULAR_HUBS.find(
        (h) =>
          h.id ===
          dropoffHubId,
      ) ??
      POPULAR_HUBS[2],
    [dropoffHubId],
  )

  const directDistance = useMemo(
    () =>
      distanceKm(pickupHub.lat, pickupHub.lng, dropoffHub.lat, dropoffHub.lng),
    [pickupHub, dropoffHub],
  )
  const driveMinutes = Math.max(10, Math.round((directDistance * 1.3) / 0.45))

  return (
    <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-[#e4bd55]" />
            <h3 className="font-serif text-lg font-bold text-[#0b1528] dark:text-white">
              Transfer Route & Hub Estimator
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Select standard transit hubs to visualize your route, distance, and
            estimated travel time.
          </p>
        </div>

        {}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <label className="text-[11px] font-bold text-slate-500">
              From:
            </label>
            <select
              value={pickupHubId}
              onChange={(e) => setPickupHubId(e.target.value)}
              className="bg-transparent text-xs font-semibold text-[#0b1528] outline-none dark:text-white"
            >
              {POPULAR_HUBS.map((hub) => (
                <option
                  key={`from-${hub.id}`}
                  value={hub.id}
                  className="dark:bg-slate-900"
                >
                  {hub.name}
                </option>
              ))}
            </select>
          </div>

          <ArrowRight className="hidden h-4 w-4 text-slate-400 sm:block" />

          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800">
            <span className="h-2 w-2 rounded-full bg-[#e4bd55]" />
            <label className="text-[11px] font-bold text-slate-500">To:</label>
            <select
              value={dropoffHubId}
              onChange={(e) => setDropoffHubId(e.target.value)}
              className="bg-transparent text-xs font-semibold text-[#0b1528] outline-none dark:text-white"
            >
              {POPULAR_HUBS.map((hub) => (
                <option
                  key={`to-${hub.id}`}
                  value={hub.id}
                  className="dark:bg-slate-900"
                >
                  {hub.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {}
      <div className="relative h-80 w-full overflow-hidden rounded-2xl border border-slate-200 bg-[#E8EEF2] sm:h-96 dark:border-slate-800">
        <MapContainer
          center={[9.0105, 38.7612]}
          zoom={12}
          scrollWheelZoom
          className="h-full w-full z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />

          <FitRouteBounds pickup={pickupHub} dropoff={dropoffHub} />

          {}
          <Polyline
            positions={[
              [pickupHub.lat, pickupHub.lng],
              [dropoffHub.lat, dropoffHub.lng],
            ]}
            pathOptions={{
              color: "#0b1528",
              weight: 4,
              dashArray: "6, 8",
              opacity: 0.85,
            }}
          />

          {}
          {POPULAR_HUBS.map((hub) => {
            const isPickup = hub.id === pickupHubId
            const isDropoff = hub.id === dropoffHubId

            return (
              <Marker
                key={hub.id}
                position={[hub.lat, hub.lng]}
                icon={createHubIcon(hub.category, isPickup, isDropoff)}
              >
                <Popup>
                  <div className="min-w-[180px] p-2 space-y-2 text-slate-800">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                      <span className="text-[10px] font-bold uppercase text-[#e4bd55]">
                        {hub.category}
                      </span>
                      {isPickup && (
                        <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800">
                          Pickup Point
                        </span>
                      )}
                      {isDropoff && (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-800">
                          Drop-off Point
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-serif font-bold text-sm text-[#0b1528]">
                        {hub.name}
                      </h4>
                      {hub.amharicName && (
                        <p className="text-[11px] font-medium text-slate-500">
                          {hub.amharicName}
                        </p>
                      )}
                      <p className="mt-1 text-[11px] text-slate-500">
                        {hub.description}
                      </p>
                    </div>
                    <div className="flex gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setPickupHubId(hub.id)}
                        className="flex-1 rounded-lg bg-emerald-600 px-2 py-1 text-center text-[10px] font-bold text-white hover:bg-emerald-700 transition"
                      >
                        Set Pickup
                      </button>
                      <button
                        type="button"
                        onClick={() => setDropoffHubId(hub.id)}
                        className="flex-1 rounded-lg bg-[#0b1528] px-2 py-1 text-center text-[10px] font-bold text-white hover:bg-[#1E3A5F] transition"
                      >
                        Set Drop-off
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>

        {}
        <div className="pointer-events-none absolute bottom-4 left-4 z-[400] flex flex-wrap items-center gap-3 rounded-2xl bg-white/95 px-4 py-2.5 shadow-lg backdrop-blur dark:bg-slate-900/95">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#e4bd55]">
              Route Proximity
            </span>
            <p className="text-sm font-bold text-[#0b1528] dark:text-white">
              ~{(directDistance * 1.2).toFixed(1)} km · ~{driveMinutes} min
              drive
            </p>
          </div>
          {onSelectRoute && (
            <button
              type="button"
              onClick={() => onSelectRoute(pickupHub.name, dropoffHub.name)}
              className="pointer-events-auto inline-flex items-center gap-1.5 rounded-xl bg-[#0b1528] px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#1E3A5F] transition"
            >
              <Car className="h-3.5 w-3.5 text-[#e4bd55]" />
              Use This Route
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
