"use client" /* Recommended hotels */ /* Nearby places */ /* Experiences + saved + recent */

import Link from "next/link"
import Image from "next/image"
import {
  Building2,
  MapPin,
  Backpack,
  Heart,
  Clock,
  ArrowRight,
} from "lucide-react"

const RECOMMENDED_HOTELS = [
  {
    name: "Hyatt Regency Addis Ababa",
    city: "Addis Ababa",
    img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=70",
  },
  {
    name: "Skylight Hotel",
    city: "Addis Ababa",
    img: "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=600&q=70",
  },
  {
    name: "Haile Resort Hawassa",
    city: "Hawassa",
    img: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=70",
  },
]

const NEARBY_PLACES = [
  {
    name: "National Museum",
    cat: "Heritage",
    img: "https://images.unsplash.com/photo-1554907984-15263bfd63bd?auto=format&fit=crop&w=600&q=70",
  },
  {
    name: "Tomoca Coffee",
    cat: "Coffee",
    img: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=600&q=70",
  },
  {
    name: "Entoto Park",
    cat: "Nature",
    img: "/images/mirror/960px-entoto-hills-29046897801-6f51aa16.jpg",
  },
]

const EXPERIENCES_RECO = [
  { name: "Coffee ceremony", mins: "90 min" },
  { name: "Jazz night at Fendika", mins: "Evening" },
  { name: "Mount Entoto sunrise hike", mins: "Half day" },
]

export default function PersonalizedDiscovery() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-20">
      <div className="max-w-2xl mb-8">
        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#B8963E]">
          For You
        </span>
        <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#0b1528] mt-1.5">
          Made for your journey
        </h2>
        <p className="text-sm text-slate-500 mt-2">
          Recommendations shaped by where you stay, what you save and what you
          explore.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {}
        <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="inline-flex items-center gap-2 text-sm font-bold text-[#0b1528]">
              <Building2 className="w-4 h-4 text-[#B8963E]" />
              Recommended hotels
            </h3>
            <Link
              href="/search"
              className="text-[11px] font-bold text-[#B8963E] hover:underline"
            >
              See all
            </Link>
          </div>
          <div className="space-y-3">
            {RECOMMENDED_HOTELS.map((h) => (
              <Link
                key={h.name}
                href="/search"
                className="flex items-center gap-3 rounded-2xl p-2 hover:bg-slate-50 transition-colors"
              >
                <span className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0">
                  <Image
                    src={h.img}
                    alt={h.name}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-bold text-[#0b1528] truncate">
                    {h.name}
                  </span>
                  <span className="block text-[11px] text-slate-400">
                    {h.city}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>

        {}
        <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="inline-flex items-center gap-2 text-sm font-bold text-[#0b1528]">
              <MapPin className="w-4 h-4 text-[#B8963E]" />
              Nearby places
            </h3>
            <Link
              href="/discover"
              className="text-[11px] font-bold text-[#B8963E] hover:underline"
            >
              See all
            </Link>
          </div>
          <div className="space-y-3">
            {NEARBY_PLACES.map((p) => (
              <Link
                key={p.name}
                href="/discover"
                className="flex items-center gap-3 rounded-2xl p-2 hover:bg-slate-50 transition-colors"
              >
                <span className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0">
                  <Image
                    src={p.img}
                    alt={p.name}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-bold text-[#0b1528] truncate">
                    {p.name}
                  </span>
                  <span className="block text-[11px] text-slate-400">
                    {p.cat}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>

        {}
        <div className="space-y-6">
          <div className="rounded-3xl bg-[#0b1528] text-white p-5 shadow-sm">
            <h3 className="inline-flex items-center gap-2 text-sm font-bold mb-4">
              <Backpack className="w-4 h-4 text-[#E7C868]" />
              Recommended experiences
            </h3>
            <ul className="space-y-2.5">
              {EXPERIENCES_RECO.map((e) => (
                <li
                  key={e.name}
                  className="flex items-center justify-between gap-3 text-xs"
                >
                  <span className="text-white/85">{e.name}</span>
                  <span className="inline-flex items-center gap-1 text-[#E7C868] shrink-0">
                    <Clock className="w-3 h-3" />
                    {e.mins}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="inline-flex items-center gap-2 text-sm font-bold text-[#0b1528]">
                <Heart className="w-4 h-4 text-[#B8963E]" />
                Saved &amp; recently viewed
              </h3>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Your saves and views live here as you explore.</span>
              <Link
                href="/favorites"
                className="inline-flex items-center gap-1 font-bold text-[#B8963E] hover:gap-2 transition-all shrink-0"
              >
                Open <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
