"use client"

import Image from "next/image"
import { ArrowRight, Clock, MapPin, Star } from "lucide-react"

const EXPERIENCES = [
  {
    title: "Guided Tours",
    img: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=70",
    duration: "Full day",
    location: "Gondar",
    price: "From ETB 2,500",
    rating: 4.8,
  },
  {
    title: "Cultural Experiences",
    img: "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?auto=format&fit=crop&w=800&q=70",
    duration: "3 hours",
    location: "Harar",
    price: "From ETB 900",
    rating: 4.9,
  },
  {
    title: "Food Experiences",
    img: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=70",
    duration: "2 hours",
    location: "Addis Ababa",
    price: "From ETB 750",
    rating: 4.7,
  },
  {
    title: "Nature & Hiking",
    img: "/images/mirror/960px-entoto-hills-29046897801-6f51aa16.jpg",
    duration: "Full day",
    location: "Simien Mountains",
    price: "From ETB 3,200",
    rating: 4.9,
  },
  {
    title: "Photography",
    img: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=70",
    duration: "Half day",
    location: "Lalibela",
    price: "From ETB 1,800",
    rating: 4.8,
  },
  {
    title: "Local Activities",
    img: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=800&q=70",
    duration: "90 min",
    location: "Addis Ababa",
    price: "From ETB 500",
    rating: 4.6,
  },
]

export default function Experiences() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-20">
      <div className="max-w-2xl mb-8">
        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#B8963E]">
          Experiences
        </span>
        <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#0b1528] mt-1.5">
          Do more than stay.
        </h2>
        <p className="text-sm text-slate-500 mt-2">
          Curated, verified experiences led by local hosts across Ethiopia.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {EXPERIENCES.map((e) => (
          <div
            key={e.title}
            className="group rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-all overflow-hidden"
          >
            <div className="relative aspect-[16/10] overflow-hidden">
              <Image
                src={e.img}
                alt={e.title}
                fill
                sizes="(min-width:1024px) 33vw, 100vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-white/90 backdrop-blur-sm text-[10px] font-bold text-[#0b1528] px-2.5 py-1">
                <Star className="w-3 h-3 fill-[#E7C868] text-[#E7C868]" />
                {e.rating}
              </span>
            </div>
            <div className="p-5">
              <h3 className="font-serif text-lg font-bold text-[#0b1528]">
                {e.title}
              </h3>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11px] text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {e.duration}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {e.location}
                </span>
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                <span className="text-sm font-bold text-[#0b1528]">
                  {e.price}
                </span>
                <button className="inline-flex items-center gap-1 text-xs font-bold text-[#B8963E] hover:gap-2 transition-all">
                  View experience <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
