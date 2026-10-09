"use client" /* Intelligent discovery search */

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  Search,
  MapPin,
  ArrowRight,
  Navigation,
  Building2,
  Landmark,
  UtensilsCrossed,
  Coffee,
  Mountain,
  Theater,
  Backpack,
  PartyPopper,
} from "lucide-react"

const TABS = [
  { id: "hotels", label: "Hotels", icon: Building2, href: "/search" },
  {
    id: "destinations",
    label: "Destinations",
    icon: MapPin,
    href: "/discover",
  },
  {
    id: "heritage",
    label: "Heritage",
    icon: Landmark,
    href: "/discover/heritage",
  },
  {
    id: "restaurants",
    label: "Restaurants",
    icon: UtensilsCrossed,
    href: "/discover",
  },
  { id: "coffee", label: "Coffee", icon: Coffee, href: "/discover" },
  {
    id: "experiences",
    label: "Experiences",
    icon: Backpack,
    href: "/discover",
  },
  { id: "events", label: "Events", icon: PartyPopper, href: "/discover" },
]

const CITY_HINTS = [
  "Addis Ababa",
  "Gondar",
  "Lalibela",
  "Axum",
  "Bahir Dar",
  "Harar",
  "Hawassa",
]

export default function DiscoverHero() {
  const router = useRouter()
  const [tab, setTab] = useState("hotels")
  const [query, setQuery] = useState("")

  const go = () => {
    const tab_ = TABS.find((t) => t.id === tab)
    const q = query.trim()
    if (tab === "hotels") {
      router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search")
      return
    }
    router.push(
      `${tab_?.href ?? "/discover"}${q ? `?q=${encodeURIComponent(q)}` : ""}`,
    )
  }

  return (
    <section className="relative h-[68vh] min-h-[540px] max-h-[720px] flex items-end overflow-hidden bg-[#0B1528]">
      <Image
        src="/images/discover-hero-highlands.jpg"
        alt="Ethiopian highlands at golden hour"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B1528]/55 via-[#0B1528]/35 to-[#0B1528]/92" />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 pb-12 sm:pb-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl"
        >
          <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#E7C868]">
            <span className="h-px w-8 bg-[#E7C868]/70" />
            Discover Ethiopia
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.08] mt-4">
            Discover Ethiopia.
            <br />
            <span className="text-[#E7C868]">Stay somewhere meaningful.</span>
          </h1>
          <p className="text-sm sm:text-base text-white/80 mt-4 max-w-xl leading-relaxed">
            Find extraordinary places, verified heritage, unforgettable
            experiences, and hotels close to everything you want to explore.
          </p>
        </motion.div>

        {}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-8 max-w-3xl"
        >
          <div className="flex flex-wrap gap-2 mb-3">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  tab === t.id
                    ? "bg-[#E7C868] text-[#0B1528] shadow-md"
                    : "bg-white/10 text-white/85 backdrop-blur-sm border border-white/15 hover:bg-white/20"
                }`}
              >
                <t.icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 rounded-2xl bg-white/95 backdrop-blur-md shadow-2xl p-2 pl-4">
            <Search className="w-5 h-5 text-slate-400 shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && go()}
              placeholder="What are you looking for? Search Addis Ababa, Gondar, Lalibela…"
              className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none min-w-0 py-2"
            />
            <button
              onClick={go}
              className="shrink-0 rounded-xl bg-[#0b1528] hover:bg-[#12233a] text-white text-sm font-semibold px-5 py-2.5 transition-colors"
            >
              Explore Ethiopia
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-3.5">
            <Link
              href="/discover"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/85 hover:text-[#E7C868] transition-colors"
            >
              <Navigation className="w-3.5 h-3.5" />
              Explore near me
            </Link>
            <span className="text-white/30">|</span>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {CITY_HINTS.slice(0, 4).map((c) => (
                <Link
                  key={c}
                  href={`/search?city=${encodeURIComponent(c)}`}
                  className="text-xs text-white/60 hover:text-white transition-colors"
                >
                  {c}
                </Link>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
