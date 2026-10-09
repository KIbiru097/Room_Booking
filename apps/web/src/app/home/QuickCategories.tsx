"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import {
  Building2,
  Landmark,
  UtensilsCrossed,
  Coffee,
  Mountain,
  Theater,
  Backpack,
  PartyPopper,
  ArrowRight,
} from "lucide-react"

const CATEGORIES = [
  {
    id: "hotels",
    label: "Hotels",
    icon: Building2,
    href: "/search",
    img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=70",
  },
  {
    id: "heritage",
    label: "Heritage",
    icon: Landmark,
    href: "/discover/heritage",
    img: "/images/mirror/960px-et-gondar-asv2018-02-img18-fasil-ghebbi-da9fb96d.jpg",
  },
  {
    id: "food",
    label: "Food & Restaurants",
    icon: UtensilsCrossed,
    href: "/discover",
    img: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=70",
  },
  {
    id: "coffee",
    label: "Coffee",
    icon: Coffee,
    href: "/discover",
    img: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=600&q=70",
  },
  {
    id: "nature",
    label: "Nature",
    icon: Mountain,
    href: "/discover",
    img: "/images/mirror/960px-entoto-hills-29046897801-6f51aa16.jpg",
  },
  {
    id: "culture",
    label: "Culture",
    icon: Theater,
    href: "/discover",
    img: "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?auto=format&fit=crop&w=600&q=70",
  },
  {
    id: "experiences",
    label: "Experiences",
    icon: Backpack,
    href: "/discover",
    img: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=600&q=70",
  },
  {
    id: "events",
    label: "Events",
    icon: PartyPopper,
    href: "/discover",
    img: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=600&q=70",
  },
]

export default function QuickCategories() {
  return (
    <section className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 -mt-8">
      <div className="rounded-3xl bg-white shadow-xl border border-slate-100 p-4 sm:p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {CATEGORIES.map((c) => (
            <Link
              key={c.id}
              href={c.href}
              className="group relative rounded-2xl overflow-hidden aspect-[3/4] sm:aspect-[4/5] block"
            >
              <Image
                src={c.img}
                alt={c.label}
                fill
                sizes="(min-width:1024px) 12vw, 50vw"
                className="object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B1528]/85 via-[#0B1528]/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3 flex flex-col items-center gap-1 text-white">
                <c.icon className="w-5 h-5 text-[#E7C868]" />
                <span className="text-[11px] font-semibold text-center leading-tight">
                  {c.label}
                </span>
              </div>
              <div className="absolute inset-0 rounded-2xl ring-0 ring-[#E7C868]/60 group-hover:ring-2 transition-all" />
            </Link>
          ))}
        </div>
      </div>
      <div className="flex justify-center mt-4">
        <Link
          href="/discover"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0b1528] hover:text-[#B8963E] transition-colors"
        >
          See all discovery categories
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </section>
  )
}
