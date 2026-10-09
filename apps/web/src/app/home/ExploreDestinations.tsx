"use client" /* Asymmetric editorial grid */

import Link from "next/link"
import Image from "next/image"
import { Building2, MapPin, ArrowRight } from "lucide-react"

interface Destination {
  city: string
  tagline: string
  hotels: number
  places: number
  img: string
}

const DESTINATIONS: Destination[] = [
  {
    city: "Addis Ababa",
    tagline:
      "Diplomatic capital, jazz, coffee culture and Meskel Square energy.",
    hotels: 120,
    places: 84,
    img: "https://upload.wikimedia.org/wikipedia/commons/6/63/Night_view_of_Meskel_Square.jpg",
  },
  {
    city: "Gondar",
    tagline: "Royal castles and the story of the Ethiopian Empire.",
    hotels: 32,
    places: 27,
    img: "/images/mirror/960px-et-gondar-asv2018-02-img18-fasil-ghebbi-da9fb96d.jpg",
  },
  {
    city: "Lalibela",
    tagline: "Rock-hewn churches carved into history.",
    hotels: 24,
    places: 18,
    img: "/images/mirror/960px-bete-giyorgis-lalibela-ethiopia-ab2f88c0.jpg",
  },
  {
    city: "Axum",
    tagline: "Ancient kingdom, obelisks and archaeological heritage.",
    hotels: 15,
    places: 16,
    img: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=1200&q=75",
  },
  {
    city: "Bahir Dar",
    tagline: "Lake Tana monasteries and the Blue Nile Falls.",
    hotels: 28,
    places: 22,
    img: "/images/mirror/960px-entoto-hills-29046897801-6f51aa16.jpg",
  },
  {
    city: "Harar",
    tagline: "Ancient walls, culture and living traditions.",
    hotels: 12,
    places: 25,
    img: "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?auto=format&fit=crop&w=1200&q=75",
  },
  {
    city: "Hawassa",
    tagline: "Lakeside resorts, birdlife and sunset promenades.",
    hotels: 20,
    places: 14,
    img: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=75",
  },
]

function DestinationCard({ dest, tall }: { dest: Destination ;tall?: boolean }) {
  return (
    <Link
      href={`/search?city=${encodeURIComponent(dest.city)}`}
      className={`group relative rounded-3xl overflow-hidden block shadow-md hover:shadow-2xl transition-all duration-300 ${
        tall ? "aspect-[3/4]" : "aspect-[4/3]"
      }`}
    >
      <Image
        src={dest.img}
        alt={dest.city}
        fill
        sizes="(min-width:1024px) 33vw, 100vw"
        className="object-cover group-hover:scale-105 transition-transform duration-700"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0B1528]/90 via-[#0B1528]/20 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 text-white">
        <h3 className="font-serif text-2xl font-bold">{dest.city}</h3>
        <p className="text-xs text-white/75 mt-1 leading-relaxed max-w-md">
          {dest.tagline}
        </p>
        <div className="flex items-center gap-4 mt-3 text-[11px] font-medium">
          <span className="inline-flex items-center gap-1.5 text-[#E7C868]">
            <Building2 className="w-3.5 h-3.5" />
            {dest.hotels} hotels
          </span>
          <span className="inline-flex items-center gap-1.5 text-white/70">
            <MapPin className="w-3.5 h-3.5" />
            {dest.places} places
          </span>
        </div>
        <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#E7C868] group-hover:gap-2.5 transition-all">
          Explore <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </Link>
  )
}

export default function ExploreDestinations() {
  const [addis, gondar, lalibela, axum, bahirDar, harar, hawassa] = DESTINATIONS
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-20">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#B8963E]">
            Destinations
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#0b1528] mt-1.5">
            Explore Ethiopia
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            From ancient kingdoms to unforgettable landscapes.
          </p>
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 lg:row-span-2">
          <DestinationCard dest={addis} tall />
        </div>
        <DestinationCard dest={gondar} />
        <DestinationCard dest={lalibela} />
        <DestinationCard dest={axum} />
        <DestinationCard dest={bahirDar} />
        <DestinationCard dest={harar} />
        <DestinationCard dest={hawassa} />
      </div>
    </section>
  )
}
