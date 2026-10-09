"use client" /* HERO SECTION */ /* CATEGORIES SECTION */ /* EXPLORE ETHIOPIA SECTION */ /* NEARBY DISCOVERY SECTION */ /* HERITAGE & HISTORY SECTION */ /* HOTEL CONNECTION SECTION */ /* EXPERIENCES SECTION */ /* PERSONALIZED DISCOVERY SECTION */ /* AI TRAVEL COMPANION PANEL */ /* FINAL CTA SECTION */ /* AI CHAT MODAL */

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

const images = {
  hero: "https://images.unsplash.com/photo-1572888195250-3037a59d3578?auto=format&fit=crop&w=2200&q=88",
  mountain:
    "https://images.unsplash.com/photo-1573403092240-26095e118918?auto=format&fit=crop&w=1200&q=85",
  highland:
    "https://images.unsplash.com/photo-1573402828455-643c2789fb46?auto=format&fit=crop&w=1200&q=85",
  gondar:
    "https://images.unsplash.com/photo-1608634193723-1865aa4416ce?auto=format&fit=crop&w=1400&q=85",
  village:
    "https://images.unsplash.com/photo-1658823235938-c424fa0875d6?auto=format&fit=crop&w=1200&q=85",
  church:
    "https://images.unsplash.com/photo-1597807132214-cd7d59a77714?auto=format&fit=crop&w=1200&q=85",
  culture:
    "https://images.unsplash.com/photo-1572793792870-22f51f2f7e75?auto=format&fit=crop&w=1200&q=85",
  coffee:
    "https://images.unsplash.com/photo-1774529233247-d3f34ed11994?auto=format&fit=crop&w=1000&q=85",
  market:
    "https://images.unsplash.com/photo-1778079247396-9c0e01c83c8b?auto=format&fit=crop&w=1000&q=85",
  ceremony:
    "https://images.unsplash.com/photo-1691826280486-2a7f9a40441c?auto=format&fit=crop&w=1000&q=85",
  road: "https://images.unsplash.com/photo-1483671174579-bab2a5293389?auto=format&fit=crop&w=1400&q=85",
}

const tabs = [
  "Hotels",
  "Destinations",
  "Heritage",
  "Restaurants",
  "Coffee",
  "Experiences",
  "Events",
]
const cities = [
  "Addis Ababa",
  "Gondar",
  "Lalibela",
  "Bahir Dar",
  "Hawassa",
  "Arba Minch",
]
const categories = [
  ["bed", "Hotels", "Thoughtful stays"],
  ["column", "Heritage", "Living history"],
  ["food", "Food", "Local tables"],
  ["coffee", "Coffee", "The birthplace"],
  ["spark", "Experiences", "Go deeper"],
  ["ticket", "Events", "What's on"],
  ["mountain", "Nature", "Wild Ethiopia"],
  ["people", "Culture", "Meet & learn"],
]

function Icon({ name, size = 20 }: { name: string ;size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    pin: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    heart: (
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5a5.5 5.5 0 0 0 1-8.9Z" />
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    globe: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
      </>
    ),
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    north: (
      <>
        <path d="m12 3 5 18-5-4-5 4 5-18Z" />
      </>
    ),
    moon: <path d="M20 16A9 9 0 0 1 8 4a9 9 0 1 0 12 12Z" />,
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M19 5l-1.5 1.5m-11 11L5 19" />
      </>
    ),
    close: <path d="m6 6 12 12M18 6 6 18" />,
    bed: (
      <>
        <path d="M3 19v-9m18 9v-6a3 3 0 0 0-3-3H9a3 3 0 0 0-3 3v2m-3 0h18" />
        <path d="M7 10V7h5v3" />
      </>
    ),
    column: (
      <>
        <path d="M5 21h14M7 18h10M8 7v11m4-11v11m4-11v11M5 7h14L12 3 5 7Z" />
      </>
    ),
    food: (
      <>
        <path d="M7 3v8m-3-8v5a3 3 0 0 0 6 0V3M7 11v10M17 3v18M17 3c3 2 3 7 0 9" />
      </>
    ),
    coffee: (
      <>
        <path d="M4 8h13v7a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Z" />
        <path d="M17 10h2a3 3 0 0 1 0 6h-2M8 4v2m4-2v2" />
      </>
    ),
    spark: (
      <path d="m12 2 1.5 6.5L20 10l-6.5 1.5L12 18l-1.5-6.5L4 10l6.5-1.5L12 2Z" />
    ),
    ticket: (
      <>
        <path d="M3 7h18v4a2 2 0 0 0 0 4v4H3v-4a2 2 0 0 0 0-4V7Z" />
        <path d="M13 7v12" />
      </>
    ),
    mountain: <path d="m3 20 7-14 4 8 2-3 5 9H3Z" />,
    people: (
      <>
        <circle cx="9" cy="8" r="3" />
        <circle cx="17" cy="9" r="2" />
        <path d="M3 20a6 6 0 0 1 12 0m0-5a5 5 0 0 1 6 5" />
      </>
    ),
    map: (
      <>
        <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" />
        <path d="M9 3v15m6-12v15" />
      </>
    ),
    home: <path d="m3 11 9-8 9 8v10h-6v-6H9v6H3V11Z" />,
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M7 3v4m10-4v4M3 10h18" />
      </>
    ),
    send: <path d="m22 2-8 20-3-9-9-3 20-8Z" />,
  }
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.spark}
    </svg>
  )
}

function SectionTitle({
  eyebrow,
  title,
  subtitle,
  light = false,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  light?: boolean
}) {
  return (
    <header className={`section-title ${light ? "light" : ""}`}>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h2>{title}</h2>
      {subtitle && <p>{subtitle}</p>}
    </header>
  )
}

export default function HomePage() {
  const router = useRouter()
  const [searchTab, setSearchTab] = useState("Hotels")
  const [query, setQuery] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [nearbyFilter, setNearbyFilter] = useState("All")
  const [radius, setRadius] = useState("5 km")
  const [selectedPlace, setSelectedPlace] = useState(0)
  const [favorites, setFavorites] = useState<string[]>([])
  const [aiOpen, setAiOpen] = useState(false)
  const [aiPrompt, setAiPrompt] = useState("")

  const toggleFavorite = (name: string) => {
    setFavorites((items) =>
      items.includes(name)
        ? items.filter((item) => item !== name)
        : [...items, name],
    )
  }

  const nearbyPlaces = [
    {
      name: "Fasil Ghebbi",
      category: "Heritage",
      distance: "2.4 km",
      time: "8 min",
      rating: "4.8",
      image: images.gondar,
      desc: "Explore Gondar's extraordinary royal enclosure.",
    },
    {
      name: "Walia Coffee",
      category: "Coffee",
      distance: "650 m",
      time: "6 min",
      rating: "4.9",
      image: images.coffee,
      desc: "Single-origin coffee, roasted in the highlands.",
    },
    {
      name: "Four Sisters",
      category: "Food",
      distance: "1.1 km",
      time: "14 min",
      rating: "4.7",
      image: images.market,
      desc: "A warm table of northern Ethiopian flavors.",
    },
  ]

  const handleSearch = () => {
    const q = query.trim()
    if (searchTab === "Hotels") {
      router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search")
    } else if (searchTab === "Heritage") {
      router.push(
        q
          ? `/discover/heritage?q=${encodeURIComponent(q)}`
          : "/discover/heritage",
      )
    } else {
      router.push(
        q
          ? `/discover?tab=${encodeURIComponent(searchTab.toLowerCase())}&q=${encodeURIComponent(q)}`
          : `/discover?tab=${encodeURIComponent(searchTab.toLowerCase())}`,
      )
    }
  }

  return (
    <div className="flashcard-home-page -mt-18">
      <main>
        {}
        <section
          className="hero"
          id="discover"
          style={{ backgroundImage: `url(${images.hero})` }}
        >
          <div className="hero-overlay" />
          <div className="hero-content">
            <p className="hero-kicker">
              The soul of Ethiopia, thoughtfully discovered
            </p>
            <h1>
              Discover Ethiopia.
              <br />
              <em>Stay somewhere meaningful.</em>
            </h1>
            <p className="hero-copy">
              Hotels, heritage, experiences, food and places worth discovering —
              all in one journey.
            </p>
            <div className="search-shell">
              <div
                className="search-tabs"
                role="tablist"
                aria-label="Search categories"
              >
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={`button ${searchTab === tab ? "active" : ""}`}
                    onClick={() => setSearchTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="search-row">
                <div className="search-input-wrap">
                  <Icon name="pin" size={22} />
                  <label>
                    <span>Where do you want to explore?</span>
                    <input
                      value={query}
                      onChange={(event) => {
                        setQuery(event.target.value)
                        setShowSuggestions(true)
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSearch()
                      }}
                      placeholder={`Search Ethiopia for ${searchTab.toLowerCase()}`}
                    />
                  </label>
                  {query && (
                    <button
                      type="button"
                      className="button clear-btn"
                      onClick={() => setQuery("")}
                      aria-label="Clear search"
                    >
                      <Icon name="close" size={18} />
                    </button>
                  )}
                  {showSuggestions && (
                    <div className="suggestions">
                      <div className="suggestion-head">
                        <span>
                          {query
                            ? "Suggested destinations"
                            : "Recently explored"}
                        </span>
                        <button
                          type="button"
                          className="button"
                          onClick={() => setShowSuggestions(false)}
                          aria-label="Close suggestions"
                        >
                          <Icon name="close" size={16} />
                        </button>
                      </div>
                      {cities.slice(0, 3).map((city, index) => (
                        <button
                          key={city}
                          type="button"
                          className="button"
                          onClick={() => {
                            setQuery(city)
                            setShowSuggestions(false)
                          }}
                        >
                          <span className="suggestion-icon">
                            <Icon name="pin" size={17} />
                          </span>
                          <span>
                            <strong>{city}</strong>
                            <small>
                              {index === 0
                                ? "Capital city · Art, food & culture"
                                : "Heritage · Stays · Experiences"}
                            </small>
                          </span>
                          <Icon name="arrow" size={16} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  className="button near-btn"
                  onClick={() => {
                    setQuery("Near my location")
                    setShowSuggestions(false)
                  }}
                >
                  <Icon name="north" size={19} />
                  <span>Explore near me</span>
                </button>
                <button
                  type="button"
                  className="button search-btn"
                  onClick={handleSearch}
                  aria-label="Search"
                >
                  <Icon name="search" size={22} />
                  <span>Search</span>
                </button>
              </div>
            </div>
            <div className="quick-cities">
              <span>Quick escape</span>
              {cities.map((city) => (
                <button
                  key={city}
                  type="button"
                  className="button"
                  onClick={() => {
                    setQuery(city)
                  }}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
          <div className="hero-credit">
            Simien Mountains National Park <span>13°14′ N</span>
          </div>
        </section>

        {}
        <section className="categories content-section">
          <SectionTitle
            eyebrow="Begin your journey"
            title="What are you looking for?"
          />
          <div className="category-grid">
            {categories.map(([icon, label, desc], index) => (
              <button
                key={label}
                type="button"
                className={`button category-item ${
                  index === 0 ? "active" : ""
                }`}
                onClick={() => {
                  if (label === "Hotels") router.push("/search")
                  else if (label === "Heritage")
                    router.push("/discover/heritage")
                  else router.push(`/discover?tab=${label.toLowerCase()}`)
                }}
              >
                <span className="category-icon">
                  <Icon name={icon} size={23} />
                </span>
                <span>
                  <strong>{label}</strong>
                  <small>{desc}</small>
                </span>
                <Icon name="arrow" size={16} />
              </button>
            ))}
          </div>
        </section>

        {}
        <section className="explore-section content-section" id="destinations">
          <SectionTitle
            eyebrow="Cities & landscapes"
            title="Explore Ethiopia"
            subtitle="Every city has a story."
          />
          <div className="destination-grid">
            <article
              className="destination-card destination-feature"
              style={{ backgroundImage: `url(${images.gondar})` }}
            >
              <div className="card-shade" />
              <span className="number">01</span>
              <div className="destination-copy">
                <span>Amhara Region</span>
                <h3>Gondar</h3>
                <p>Castles, culture & imperial history</p>
                <button
                  type="button"
                  className="button"
                  onClick={() => router.push("/discover/heritage/gondar")}
                >
                  Discover Gondar <Icon name="arrow" size={17} />
                </button>
              </div>
            </article>
            <article
              className="destination-card"
              style={{ backgroundImage: `url(${images.church})` }}
              onClick={() => router.push("/discover/heritage/lalibela")}
            >
              <div className="card-shade" />
              <span className="number">02</span>
              <div className="destination-copy">
                <span>Sacred architecture</span>
                <h3>Lalibela</h3>
              </div>
            </article>
            <article
              className="destination-card small"
              style={{ backgroundImage: `url(${images.highland})` }}
              onClick={() => router.push("/discover")}
            >
              <div className="card-shade" />
              <span className="number">03</span>
              <div className="destination-copy">
                <span>The highlands</span>
                <h3>Simien</h3>
              </div>
            </article>
            <article
              className="destination-card small"
              style={{ backgroundImage: `url(${images.village})` }}
              onClick={() => router.push("/discover")}
            >
              <div className="card-shade" />
              <span className="number">04</span>
              <div className="destination-copy">
                <span>Culture & craft</span>
                <h3>Arba Minch</h3>
              </div>
            </article>
          </div>
          <div className="section-link">
            <button
              type="button"
              className="button"
              onClick={() => router.push("/discover")}
            >
              View all destinations <Icon name="arrow" size={17} />
            </button>
          </div>
        </section>

        {}
        <section className="nearby-section" id="explore">
          <div className="nearby-heading content-section">
            <SectionTitle
              eyebrow="Local discovery"
              title="There's more around you."
              subtitle="Discover places worth walking to from where you're staying."
            />
            <div className="radius">
              <span>Search radius</span>
              {["1 km", "5 km", "10 km", "15 km"].map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`button ${radius === item ? "active" : ""}`}
                  onClick={() => setRadius(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className="map-layout">
            <div className="map-panel">
              <div className="map-art">
                <div className="road r1" />
                <div className="road r2" />
                <div className="road r3" />
                <div className="river" />
                {nearbyPlaces.map((place, index) => (
                  <button
                    key={place.name}
                    type="button"
                    className={`button map-marker marker-${index + 1} ${
                      selectedPlace === index ? "active" : ""
                    }`}
                    onClick={() => setSelectedPlace(index)}
                    aria-label={`Select ${place.name}`}
                  >
                    <span>{index + 1}</span>
                  </button>
                ))}
                <div className="hotel-marker">
                  <Icon name="bed" size={18} />
                  <span>Your stay</span>
                </div>
                <button
                  type="button"
                  className="button map-expand"
                  onClick={() => router.push("/discover")}
                >
                  <Icon name="map" size={18} /> Full-screen map
                </button>
              </div>
              <div className="map-attribution">
                Gondar, Ethiopia <span>Map view · {radius}</span>
              </div>
            </div>
            <div className="places-panel">
              <div className="filter-row">
                {[
                  "All",
                  "Food",
                  "Coffee",
                  "Heritage",
                  "Museums",
                  "Shopping",
                ].map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`button ${
                      nearbyFilter === item ? "active" : ""
                    }`}
                    onClick={() => setNearbyFilter(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <div className="place-count">
                <span>
                  {nearbyFilter === "All"
                    ? "18 places nearby"
                    : `4 ${nearbyFilter.toLowerCase()} places`}
                </span>
                <button type="button" className="button">
                  Sort by distance
                </button>
              </div>
              {nearbyPlaces
                .filter(
                  (p) => nearbyFilter === "All" || p.category === nearbyFilter,
                )
                .map((place, index) => (
                  <article
                    className={`place-card ${
                      selectedPlace === index ? "selected" : ""
                    }`}
                    key={place.name}
                    onClick={() => setSelectedPlace(index)}
                  >
                    <img src={place.image} alt={place.name} />
                    <div className="place-copy">
                      <div>
                        <span className="place-category">{place.category}</span>
                        <span className="rating">★ {place.rating}</span>
                      </div>
                      <h3>{place.name}</h3>
                      <p>{place.desc}</p>
                      <div className="place-meta">
                        <span>
                          <Icon name="pin" size={15} /> {place.distance}
                        </span>
                        <span>{place.time} walk</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className={`button favorite ${
                        favorites.includes(place.name) ? "active" : ""
                      }`}
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFavorite(place.name)
                      }}
                      aria-label={`Favorite ${place.name}`}
                    >
                      <Icon name="heart" size={18} />
                    </button>
                    <button
                      type="button"
                      className="button directions"
                      onClick={() => router.push("/discover")}
                    >
                      Get directions <Icon name="arrow" size={16} />
                    </button>
                  </article>
                ))}
              {nearbyFilter === "Museums" && (
                <div className="empty-state">
                  <Icon name="map" size={28} />
                  <h3>No nearby museums found</h3>
                  <p>Try widening your search radius.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {}
        <section className="heritage-section" id="heritage">
          <div className="heritage-inner content-section">
            <SectionTitle
              eyebrow="UNESCO & beyond"
              title="Walk through Ethiopia's history."
              subtitle="Discover the stories behind the places."
            />
            <div className="heritage-layout">
              <article
                className="heritage-main"
                style={{ backgroundImage: `url(${images.church})` }}
              >
                <div className="card-shade" />
                <div>
                  <span className="gold-tag">A sacred wonder</span>
                  <h3>Lalibela</h3>
                  <p>Stone churches carved into living rock.</p>
                  <button
                    type="button"
                    className="button"
                    onClick={() => router.push("/discover/heritage/lalibela")}
                  >
                    Explore the story <Icon name="arrow" size={17} />
                  </button>
                </div>
              </article>
              <div className="heritage-list">
                {[
                  [
                    "Fasil Ghebbi",
                    "The Camelot of Africa",
                    images.gondar,
                    "gondar",
                  ],
                  [
                    "Aksum",
                    "Kingdoms, stelae and legends",
                    images.mountain,
                    "axum",
                  ],
                  [
                    "Harar Jugol",
                    "A labyrinth of living heritage",
                    images.culture,
                    "harar",
                  ],
                ].map(([name, desc, image, slug], index) => (
                  <article
                    key={name}
                    className="cursor-pointer"
                    onClick={() => router.push(`/discover/heritage/${slug}`)}
                  >
                    <span>0{index + 2}</span>
                    <img src={image} alt={name} />
                    <div>
                      <h3>{name}</h3>
                      <p>{desc}</p>
                    </div>
                    <Icon name="arrow" size={19} />
                  </article>
                ))}
                <button
                  type="button"
                  className="button heritage-all"
                  onClick={() => router.push("/discover/heritage")}
                >
                  Explore all heritage <Icon name="arrow" size={17} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {}
        <section className="connection-section content-section">
          <SectionTitle
            eyebrow="From stay to story"
            title="Your hotel is only the beginning."
            subtitle="A meaningful stay connects you to everything around it."
          />
          <div className="connection-layout">
            <article className="stay-card">
              <div
                className="stay-image"
                style={{ backgroundImage: `url(${images.village})` }}
              >
                <span>Your stay</span>
              </div>
              <div>
                <p>Bishoftu · Lakeside retreat</p>
                <h3>Kuriftu Resort</h3>
                <div>
                  <span className="rating">★ 4.8</span>
                  <span>Exceptional</span>
                </div>
              </div>
            </article>
            <div className="journey-line">
              {[
                [
                  "5 min walk",
                  "coffee",
                  "Tomoca Coffee",
                  "Fresh roast & ceremony",
                ],
                [
                  "8 min walk",
                  "food",
                  "Lakeside Table",
                  "Seasonal Ethiopian dining",
                ],
                [
                  "12 min walk",
                  "column",
                  "Lake Hora",
                  "Crater lake & birdlife",
                ],
                [
                  "20 min",
                  "spark",
                  "Oromo Culture Walk",
                  "Local stories & craft",
                ],
              ].map(([time, icon, name, desc], index) => (
                <div
                  className="journey-stop cursor-pointer"
                  key={name}
                  onClick={() => router.push("/discover")}
                >
                  <span className="connector">{index + 1}</span>
                  <span className="journey-icon">
                    <Icon name={icon} size={20} />
                  </span>
                  <div>
                    <small>{time}</small>
                    <h3>{name}</h3>
                    <p>{desc}</p>
                  </div>
                  <Icon name="arrow" size={18} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {}
        <section
          className="experience-section content-section"
          id="experiences"
        >
          <div className="section-heading-row">
            <SectionTitle
              eyebrow="Curated encounters"
              title="Do more than stay."
              subtitle="Turn your trip into a story."
            />
            <button
              type="button"
              className="button"
              onClick={() => router.push("/discover?tab=experiences")}
            >
              Explore experiences <Icon name="arrow" size={17} />
            </button>
          </div>
          <div className="experience-rail">
            {[
              [
                "Coffee ceremony",
                "2 hours · Addis Ababa",
                "From $24",
                images.coffee,
              ],
              [
                "Highland trek",
                "Full day · Simien",
                "From $68",
                images.mountain,
              ],
              [
                "A table in Gondar",
                "3 hours · Gondar",
                "From $38",
                images.market,
              ],
              [
                "Culture & craft",
                "Half day · Dorze",
                "From $42",
                images.ceremony,
              ],
            ].map(([name, meta, price, image]) => (
              <article
                className="experience-card cursor-pointer"
                key={name}
                onClick={() => router.push("/discover?tab=experiences")}
              >
                <div className="experience-image">
                  <img src={image} alt={name} />
                  <button
                    type="button"
                    className={`button favorite ${
                      favorites.includes(name) ? "active" : ""
                    }`}
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleFavorite(name)
                    }}
                    aria-label={`Favorite ${name}`}
                  >
                    <Icon name="heart" size={19} />
                  </button>
                  <span className="rating">★ 4.9</span>
                </div>
                <span>Authentic experience</span>
                <h3>{name}</h3>
                <p>{meta}</p>
                <strong>
                  {price} <small>/ person</small>
                </strong>
              </article>
            ))}
          </div>
        </section>

        {}
        <section className="personalized-section">
          <div className="content-section">
            <SectionTitle
              eyebrow="Chosen for you"
              title="Made for your journey"
              subtitle="Recommendations based on where you're going and what you love."
            />
            <div className="recommendation-head">
              <h3>Near your stay</h3>
              <button
                type="button"
                className="button"
                onClick={() => router.push("/discover")}
              >
                See all <Icon name="arrow" size={16} />
              </button>
            </div>
            <div className="recommendation-rail">
              {[
                [
                  "Fasil Ghebbi",
                  "Gondar · 8 min walk",
                  images.gondar,
                  "Heritage near you",
                  "/discover/heritage/gondar",
                ],
                [
                  "Walia Coffee House",
                  "Gondar · 6 min walk",
                  images.coffee,
                  "Matches your taste",
                  "/discover",
                ],
                [
                  "Gondar Hills",
                  "Gondar · 18 min drive",
                  images.highland,
                  "Worth the detour",
                  "/discover",
                ],
              ].map(([name, location, image, label, href]) => (
                <article
                  className="recommend-card cursor-pointer"
                  key={name}
                  onClick={() => router.push(href)}
                >
                  <div>
                    <img src={image} alt={name} />
                    <span>{label}</span>
                    <button
                      type="button"
                      className={`button favorite ${
                        favorites.includes(name) ? "active" : ""
                      }`}
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFavorite(name)
                      }}
                      aria-label={`Favorite ${name}`}
                    >
                      <Icon name="heart" size={18} />
                    </button>
                  </div>
                  <h3>{name}</h3>
                  <p>
                    <Icon name="pin" size={14} /> {location}
                  </p>
                  <span className="rating">
                    ★ 4.8 <small>(124)</small>
                  </span>
                </article>
              ))}
            </div>
          </div>
        </section>

        {}
        <section className="ai-section content-section">
          <div className="ai-panel">
            <div className="ai-orb">
              <span>Y</span>
            </div>
            <div className="ai-copy">
              <span className="eyebrow">YayeTech intelligence</span>
              <h2>Your Ethiopia travel companion.</h2>
              <p>Ask about places, history, hotels, food or what to do next.</p>
            </div>
            <div className="ai-action">
              <div className="prompt-chips">
                {[
                  "What's worth seeing in Gondar?",
                  "Plan my weekend",
                  "What is near my hotel?",
                ].map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className="button"
                    onClick={() => setAiPrompt(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
              <div className="ai-input">
                <input
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setAiOpen(true)
                  }}
                  placeholder="Ask YayeTech AI anything about Ethiopia..."
                />
                <button
                  type="button"
                  className="button"
                  onClick={() => setAiOpen(true)}
                >
                  Ask AI <Icon name="send" size={17} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {}
        <section
          className="final-cta"
          style={{ backgroundImage: `url(${images.road})` }}
        >
          <div className="card-shade" />
          <div>
            <span className="eyebrow">Your journey, your way</span>
            <h2>
              Your Ethiopia story
              <br />
              starts here.
            </h2>
            <p>
              Find a place to stay. Discover somewhere new. Experience Ethiopia.
            </p>
            <div>
              <button
                type="button"
                className="button gold-btn"
                onClick={() => router.push("/discover")}
              >
                Explore Ethiopia <Icon name="arrow" size={17} />
              </button>
              <button
                type="button"
                className="button outline-btn"
                onClick={() => router.push("/search")}
              >
                Find a hotel
              </button>
            </div>
          </div>
        </section>
      </main>

      {}
      {aiOpen && (
        <div className="modal-backdrop" onClick={() => setAiOpen(false)}>
          <div className="ai-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="button modal-close"
              onClick={() => setAiOpen(false)}
              aria-label="Close AI assistant"
            >
              <Icon name="close" />
            </button>
            <div className="ai-orb">
              <span>Y</span>
            </div>
            <span className="eyebrow">YayeTech AI</span>
            <h2>Where should we go next?</h2>
            <p>
              Tell me what you enjoy, how much time you have, or where
              you&apos;re staying.
            </p>
            <div className="modal-message">
              {aiPrompt || "What would you like to discover in Ethiopia?"}
            </div>
            <div className="ai-input">
              <input
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                autoFocus
                placeholder="Ask about Ethiopia..."
              />
              <button
                type="button"
                className="button"
                onClick={() => setAiOpen(false)}
              >
                <Icon name="send" size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
