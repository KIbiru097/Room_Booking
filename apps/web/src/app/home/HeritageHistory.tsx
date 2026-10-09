"use client" /* Featured editorial story */ /* Supporting stories */

import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"

const STORIES = [
  {
    city: "Gondar",
    title: "Royal castles and the story of the Ethiopian Empire",
    img: "/images/mirror/960px-et-gondar-asv2018-02-img18-fasil-ghebbi-da9fb96d.jpg",
    era: "17th Century",
  },
  {
    city: "Lalibela",
    title: "Rock-hewn churches carved into history",
    img: "/images/mirror/960px-bete-giyorgis-lalibela-ethiopia-ab2f88c0.jpg",
    era: "12th Century",
  },
  {
    city: "Axum",
    title: "Ancient kingdom, obelisks and archaeological heritage",
    img: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=1200&q=75",
    era: "1st Century",
  },
  {
    city: "Harar",
    title: "Ancient walls, culture and living traditions",
    img: "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?auto=format&fit=crop&w=1200&q=75",
    era: "13th Century",
  },
]

export default function HeritageHistory() {
  const [featured, ...rest] = STORIES
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#B8963E]">
            Heritage &amp; History
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#0b1528] mt-1.5">
            Walk through Ethiopia&rsquo;s history
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Discover the stories, people and places that shaped Ethiopia.
          </p>
        </div>
        <div className="flex lg:justify-end items-end gap-3">
          <Link
            href="/discover/heritage"
            className="rounded-xl bg-[#0b1528] text-white text-sm font-semibold px-5 py-2.5 hover:bg-[#12233a] transition-colors"
          >
            Explore History
          </Link>
          <Link
            href="/discover/heritage"
            className="rounded-xl border border-[#0b1528]/20 text-[#0b1528] text-sm font-semibold px-5 py-2.5 hover:border-[#B8963E] hover:text-[#B8963E] transition-colors"
          >
            View Heritage Places
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {}
        <Link
          href="/discover/heritage"
          className="group relative rounded-3xl overflow-hidden min-h-[420px] block shadow-lg hover:shadow-2xl transition-all"
        >
          <Image
            src={featured.img}
            alt={featured.city}
            fill
            sizes="(min-width:1024px) 50vw, 100vw"
            className="object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B1528]/92 via-[#0B1528]/25 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-7 text-white">
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#E7C868]">
              {featured.era} · {featured.city}
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold mt-2 max-w-md leading-snug">
              {featured.title}
            </h3>
            <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#E7C868] group-hover:gap-2.5 transition-all">
              Read the story <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </Link>

        {}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {rest.map((s) => (
            <Link
              key={s.city}
              href="/discover/heritage"
              className="group relative rounded-3xl overflow-hidden aspect-[4/5] block shadow-md hover:shadow-xl transition-all"
            >
              <Image
                src={s.img}
                alt={s.city}
                fill
                sizes="(min-width:1024px) 25vw, 50vw"
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B1528]/90 via-[#0B1528]/15 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#E7C868]">
                  {s.city}
                </span>
                <p className="font-serif text-base font-bold mt-1 leading-snug">
                  {s.title}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
