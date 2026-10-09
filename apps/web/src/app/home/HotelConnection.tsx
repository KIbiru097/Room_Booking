"use client" /* Hotel card side */ /* Around your stay */

import Link from "next/link"
import Image from "next/image"
import { ArrowRight, MapPin } from "lucide-react"

const NEARBY = [
  { name: "Lake Bishoftu", mins: 5, kind: "Nature escape" },
  { name: "Local Restaurant", mins: 8, kind: "Food & injera" },
  { name: "Cultural Experience", mins: 12, kind: "Coffee ceremony" },
  { name: "Heritage Site", mins: 15, kind: "Living history" },
]

export default function HotelConnection() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-20">
      <div className="rounded-3xl bg-[#0B1528] text-white overflow-hidden shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {}
          <div className="relative min-h-[340px] lg:min-h-[440px]">
            <Image
              src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=75"
              alt="Kuriftu Resort, Bishoftu"
              fill
              sizes="(min-width:1024px) 50vw, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0B1528]/20 to-[#0B1528]/70 lg:bg-gradient-to-r lg:from-transparent lg:to-[#0B1528]/90" />
            <div className="absolute inset-x-0 bottom-0 p-7 bg-gradient-to-t from-[#0B1528]/90 to-transparent">
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#E7C868]">
                Featured stay
              </span>
              <h3 className="font-serif text-3xl font-bold mt-1.5">
                Kuriftu Resort
              </h3>
              <p className="inline-flex items-center gap-1.5 text-xs text-white/75 mt-1">
                <MapPin className="w-3.5 h-3.5" /> Bishoftu
              </p>
              <div className="flex gap-3 mt-5">
                <Link
                  href="/search"
                  className="rounded-xl bg-[#E7C868] text-[#0B1528] text-sm font-bold px-5 py-2.5 hover:bg-white transition-colors"
                >
                  View Hotel
                </Link>
                <Link
                  href="/discover"
                  className="rounded-xl border border-white/25 text-white text-sm font-semibold px-5 py-2.5 hover:border-[#E7C868] hover:text-[#E7C868] transition-colors"
                >
                  Explore Nearby
                </Link>
              </div>
            </div>
          </div>

          {}
          <div className="p-8 sm:p-10 flex flex-col justify-center">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#E7C868]">
              Stay + Discover
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold mt-2 mb-3">
              Your hotel is only the beginning.
            </h2>
            <p className="text-sm text-white/65 leading-relaxed max-w-md mb-8">
              Every YayeTech stay comes with the world around it — verified
              places, real distances, and experiences worth your time.
            </p>

            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/45 mb-4">
              Around your stay
            </p>
            <ol className="space-y-0">
              {NEARBY.map((n, i) => (
                <li key={n.name} className="flex items-center gap-4">
                  <div className="flex flex-col items-center">
                    <span className="w-11 text-right text-xs font-bold text-[#E7C868] shrink-0">
                      {n.mins} min
                    </span>
                    {i < NEARBY.length - 1 && (
                      <span className="w-px h-8 bg-white/15 my-1" />
                    )}
                  </div>
                  <div className="pb-1">
                    <p className="text-sm font-semibold">{n.name}</p>
                    <p className="text-[11px] text-white/50">{n.kind}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="flex items-center gap-2 mt-8 text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
              <span>Book a stay</span>
              <ArrowRight className="w-3 h-3 text-[#E7C868]" />
              <span>Discover the area</span>
              <ArrowRight className="w-3 h-3 text-[#E7C868]" />
              <span className="text-[#E7C868]">Experience Ethiopia</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
