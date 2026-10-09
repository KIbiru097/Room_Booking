"use client"

import { MapPin } from "lucide-react"

export default function CoordinatePreview({
  lat,
  lng,
}: {
  lat: string
  lng: string
}) {
  const latitude = Number(lat)
  const longitude = Number(lng)
  const valid =
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  const mapUrl = valid
    ? `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`
    : ""

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
      <span className="inline-flex items-center gap-1.5 text-slate-600">
        <MapPin className="h-3.5 w-3.5 text-[#e4bd55]" />
        {valid
          ? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
          : "Enter valid latitude and longitude"}
      </span>
      {valid && (
        <a
          href={mapUrl}
          target="_blank"
          rel="noreferrer"
          className="font-bold text-[#2563EB] hover:underline"
        >
          Preview on OpenStreetMap
        </a>
      )}
    </div>
  )
}
