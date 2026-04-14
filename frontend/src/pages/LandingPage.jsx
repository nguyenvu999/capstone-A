import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
  ChevronRight,
  MapPin,
  Utensils,
  Wine,
  Music2,
  Users,
  Filter,
  Route,
  CalendarDays,
  Bookmark,
} from "lucide-react"
import AuthModal from "../components/landing/AuthModal"
import { useAuth } from "../context/AuthContext"
import { getPlaces } from "../api/places"

export default function LandingPage() {
  const [authMode, setAuthMode] = useState(null)
  const { user, isLoggedIn, logoutUser } = useAuth()

  const [places, setPlaces] = useState([])
  const [placesLoading, setPlacesLoading] = useState(false)
  const [placesError, setPlacesError] = useState("")

  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        setPlacesLoading(true)
        setPlacesError("")
        const response = await getPlaces()
        setPlaces(response.data || [])
      } catch (error) {
        setPlacesError(error.response?.data?.error || "Failed to load places")
      } finally {
        setPlacesLoading(false)
      }
    }

    if (isLoggedIn) {
      fetchPlaces()
    } else {
      setPlaces([])
    }
  }, [isLoggedIn])

  return (
    <div className='min-h-screen bg-[#94AB71] text-[#001910] [font-family:"Nunito_Sans",sans-serif]'>
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/20 bg-white/30 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-10">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#dce8c8]">
              <MapPin className="h-6 w-6 text-[#355e1d]" />
            </div>
            <span className="text-2xl font-semibold text-black">NetSuggest</span>
          </Link>

          <nav className="hidden items-center gap-10 font-medium text-[#355e1d] md:flex">
            <a href="#categories" className="transition hover:text-black">
              Categories
            </a>
            <a href="#places" className="transition hover:text-black">
              Places
            </a>
            <a href="#map" className="transition hover:text-black">
              Map
            </a>
            <a href="#planner" className="transition hover:text-black">
              Planner
            </a>
          </nav>

          {isLoggedIn ? (
            <div className="flex items-center gap-3">
              <Link
                to="/places"
                className="rounded-full border border-[#355e1d] px-4 py-2 text-sm font-medium text-[#355e1d] transition hover:bg-[#355e1d] hover:text-white"
              >
                My Places
              </Link>

              <Link
                to="/places/new"
                className="rounded-full bg-[#355e1d] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#2d4f18]"
              >
                Add Place
              </Link>

              <span className="max-w-[180px] truncate text-sm font-semibold text-[#16351e]">
                {user?.name}
              </span>

              <button
                type="button"
                onClick={logoutUser}
                className="rounded-full border border-[#355e1d] px-4 py-2 text-sm font-medium text-[#355e1d] transition hover:bg-[#355e1d] hover:text-white"
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAuthMode("login")}
              className="rounded-full bg-[#355e1d] px-5 py-2.5 font-medium text-white transition hover:bg-[#2d4f18]"
            >
              Sign in
            </button>
          )}
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(148,171,113,0.22),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(199,217,181,0.35),transparent_30%)]" />
          <div className="relative mx-auto max-w-7xl px-6 py-20 text-center lg:px-8 lg:py-28">
            <h2 className="mx-auto mt-6 max-w-4xl text-5xl font-bold leading-tight text-[#001910] sm:text-6xl">
              Find the best places for your team
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#385723]">
              Discover restaurants, bars, entertainment, and team activities near your office.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              {isLoggedIn ? (
                <>
                  <Link
                    to="/places"
                    className="inline-flex items-center justify-center rounded-full bg-[#385723] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#2d4f18]"
                  >
                    Explore Places
                    <ChevronRight className="ml-2" size={18} />
                  </Link>                 
                </>
              ) : (
                <>
                  <button
                    onClick={() => setAuthMode("login")}
                    className="inline-flex items-center justify-center rounded-full bg-[#385723] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#2d4f18]"
                  >
                    Explore Places
                    <ChevronRight className="ml-2" size={18} />
                  </button>

                  <button
                    onClick={() => setAuthMode("register")}
                    className="rounded-full border border-[#94AB71] px-6 py-3 text-sm font-medium text-[#385723] transition hover:bg-[#C7D9B5]"
                  >
                    Create Itinerary
                  </button>
                </>
              )}
            </div>

            <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Categories" value="5" />
              <StatCard
                label="Recommended Places"
                value={isLoggedIn ? String(places.length) : "0"}
              />
              <StatCard label="Team Event Planner" value="Built-in" />
              <StatCard label="Route Optimization" value="Available" />
            </div>
          </div>
        </section>

        <section id="categories" className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#94AB71]">
              Categories
            </p>
            <h3 className="mt-3 text-3xl font-semibold tracking-tight text-[#001910] sm:text-4xl">
              Explore places by type
            </h3>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-5">
            <CategoryCard icon={<MapPin size={22} />} title="Sight" />
            <CategoryCard icon={<Utensils size={22} />} title="Restaurants" />
            <CategoryCard icon={<Wine size={22} />} title="Bars" />
            <CategoryCard icon={<Music2 size={22} />} title="Entertainment" />
            <CategoryCard icon={<Users size={22} />} title="Team Events" />
          </div>
        </section>

        <section id="places" className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#94AB71]">
                Recommended Places
              </p>
              <h3 className="mt-3 text-3xl font-semibold tracking-tight text-[#001910] sm:text-4xl">
                Simple suggestions for colleagues
              </h3>
              <p className="mt-4 leading-8 text-[#385723]">
                Browse places with category, comment, price level, and image.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <FilterChip label="Category" />
              <FilterChip label="Location" />
              <FilterChip label="Price" />
              <FilterChip label="Opening Hours" />
            </div>
          </div>

          <div className="mt-12">
            {!isLoggedIn ? (
              <div className="rounded-[28px] border border-[#C7D9B5] bg-white/80 p-8 text-center shadow-sm">
                <p className="text-lg font-medium text-[#001910]">
                  Sign in to see places added by users.
                </p>
              </div>
            ) : placesLoading ? (
              <div className="rounded-[28px] border border-[#C7D9B5] bg-white/80 p-8 text-center shadow-sm">
                <p className="text-[#385723]">Loading places...</p>
              </div>
            ) : placesError ? (
              <div className="rounded-[28px] border border-red-200 bg-red-50 p-8 text-center shadow-sm">
                <p className="text-red-600">{placesError}</p>
              </div>
            ) : places.length === 0 ? (
              <div className="rounded-[28px] border border-[#C7D9B5] bg-white/80 p-8 text-center shadow-sm">
                <p className="text-lg font-medium text-[#001910]">No places yet.</p>
                <p className="mt-2 text-sm text-[#385723]">
                  Start by adding your first recommended place.
                </p>
                <Link
                  to="/places/new"
                  className="mt-5 inline-flex rounded-full bg-[#355e1d] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#2d4f18]"
                >
                  Add Place
                </Link>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {places.map((place) => (
                  <PlaceCard
                    key={place.id}
                    image={place.imageUrl}
                    name={place.name}
                    category={place.category}
                    comment={place.comment}
                    price={place.priceLevel}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        <section id="map" className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="mb-6">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#94AB71]">
              Map View
            </p>
            <h3 className="mt-3 text-3xl font-semibold tracking-tight text-[#001910] sm:text-4xl">
              View places on the map
            </h3>
          </div>

          <div className="overflow-hidden rounded-[32px] border border-[#C7D9B5] bg-white p-3 shadow-sm">
            {isLoggedIn ? (
              <Link
                to="/places"
                className="flex h-[420px] w-full items-center justify-center rounded-[24px] border border-dashed border-[#94AB71] bg-[#F9FAF5] text-center transition hover:bg-[#f3f6eb]"
              >
                <div className="px-6">
                  <MapPin className="mx-auto text-[#385723]" size={34} />
                  <p className="mt-4 text-lg font-medium text-[#001910]">
                    Interactive Map Area
                  </p>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-[#385723]">
                    Continue to your places and map-related features.
                  </p>
                </div>
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setAuthMode("login")}
                className="flex h-[420px] w-full items-center justify-center rounded-[24px] border border-dashed border-[#94AB71] bg-[#F9FAF5] text-center transition hover:bg-[#f3f6eb]"
              >
                <div className="px-6">
                  <MapPin className="mx-auto text-[#385723]" size={34} />
                  <p className="mt-4 text-lg font-medium text-[#001910]">
                    Interactive Map Area
                  </p>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-[#385723]">
                    Sign in to explore recommended places, filters, and route optimization.
                  </p>
                </div>
              </button>
            )}
          </div>
        </section>

        <section id="planner" className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="rounded-[32px] border border-[#C7D9B5] bg-white p-8 shadow-sm">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#94AB71]">
                Team Planner
              </p>
              <h3 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-[#001910]">
                Plan outings in a simpler way
              </h3>
              <p className="mt-5 leading-8 text-[#385723]">
                Save places, compare options, and organize a small team plan.
                Users can build a personal itinerary and select multiple places in one flow.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <MiniInfoCard
                  icon={<CalendarDays size={18} />}
                  title="Event planning"
                  text="Choose places suitable for dinners, casual meetups, or team activities."
                />
                <MiniInfoCard
                  icon={<Bookmark size={18} />}
                  title="Saved itinerary"
                  text="Keep your own list of places and prepare a better social plan."
                />
              </div>
            </div>

            <div className="rounded-[32px] border border-[#94AB71] bg-[#385723] p-8 text-white">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#C7D9B5]">
                Main Features
              </p>

              <div className="mt-6 space-y-5">
                <FeatureRow
                  icon={<Filter size={18} />}
                  title="Filter places"
                  text="Browse by category, location, price, and opening hours."
                />
                <FeatureRow
                  icon={<Route size={18} />}
                  title="Route optimization"
                  text="Automatically arrange saved places into a better route."
                />
                <FeatureRow
                  icon={<Users size={18} />}
                  title="Team event suggestions"
                  text="Find suitable locations for group activities and after-work plans."
                />
                <FeatureRow
                  icon={<MapPin size={18} />}
                  title="Register new place"
                  text="Allow users to add new places with GPS and map integration."
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-24 bg-[#355e1d] text-white">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
          <div className="grid max-w-3xl grid-cols-1 gap-16 border-b border-white/10 pb-14 md:grid-cols-2">
            <div>
              <h3 className="mb-6 text-xl font-semibold text-white">About NetSuggest</h3>
              <ul className="space-y-4 text-white/75">
                <li>
                  <a href="#" className="transition hover:text-white">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="transition hover:text-white">
                    Press
                  </a>
                </li>
                <li>
                  <a href="#" className="transition hover:text-white">
                    Resources and Policies
                  </a>
                </li>
                <li>
                  <a href="#" className="transition hover:text-white">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="transition hover:text-white">
                    Trust & Safety
                  </a>
                </li>
                <li>
                  <a href="#" className="transition hover:text-white">
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-6 text-xl font-semibold text-white">Explore</h3>
              <ul className="space-y-4 text-white/75">
                <li>
                  <a href="#" className="transition hover:text-white">
                    Write a Review
                  </a>
                </li>
                <li>
                  <a href="#" className="transition hover:text-white">
                    Add a Place
                  </a>
                </li>
                <li>
                  <a href="#" className="transition hover:text-white">
                    Join
                  </a>
                </li>
                <li>
                  <a href="#" className="transition hover:text-white">
                    Travel Stories
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-14 flex flex-col items-center justify-between gap-6 border-t border-white/15 pt-8 md:flex-row">
            <div>
              <p className="text-sm text-white/70">© 2026 NetSuggest. All rights reserved.</p>
              <div className="mt-3 flex flex-wrap gap-5 text-sm text-white/70">
                <a href="#" className="transition hover:text-white">
                  Terms of Use
                </a>
                <a href="#" className="transition hover:text-white">
                  Privacy and Cookies Statement
                </a>
                <a href="#" className="transition hover:text-white">
                  Cookie consent
                </a>
                <a href="#" className="transition hover:text-white">
                  Contact us
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <AuthModal authMode={authMode} setAuthMode={setAuthMode} />
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-[24px] border border-[#C7D9B5] bg-white/70 p-5 text-center shadow-sm">
      <p className="text-sm text-[#385723]">{label}</p>
      <h3 className="mt-2 text-3xl font-semibold text-[#001910]">{value}</h3>
    </div>
  )
}

function CategoryCard({ icon, title }) {
  return (
    <div className="rounded-[28px] border border-[#C7D9B5] bg-white/80 p-6 transition hover:-translate-y-1 hover:shadow-md">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#C7D9B5] text-[#385723]">
        {icon}
      </div>
      <h4 className="mt-5 text-xl font-semibold text-[#001910]">{title}</h4>
    </div>
  )
}

function PlaceCard({ image, name, category, comment, price }) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-[#C7D9B5] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      {image ? (
        <img src={image} alt={name} className="h-52 w-full object-cover" />
      ) : (
        <div className="flex h-52 items-center justify-center bg-[#edf2e5] text-[#6b7a60]">
          No image
        </div>
      )}

      <div className="p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-[#001910]">{name}</h3>
          <span className="rounded-full bg-[#C7D9B5] px-3 py-1 text-xs text-[#385723]">
            {category}
          </span>
        </div>
        <p className="mt-3 text-sm leading-7 text-[#385723]">{comment}</p>
        <div className="mt-4 flex items-center justify-between">
          <span className="font-medium text-[#385723]">{price}</span>
          <Link
            to="/places"
            className="rounded-full bg-[#385723] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#94AB71]"
          >
            View
          </Link>
        </div>
      </div>
    </div>
  )
}

function FilterChip({ label }) {
  return (
    <button className="rounded-full border border-[#C7D9B5] bg-white px-4 py-2 text-sm text-[#385723] transition hover:bg-[#C7D9B5] hover:text-[#001910]">
      {label}
    </button>
  )
}

function MiniInfoCard({ icon, title, text }) {
  return (
    <div className="rounded-[24px] border border-[#C7D9B5] bg-[#F9FAF5] p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#C7D9B5] text-[#385723]">
        {icon}
      </div>
      <h4 className="mt-4 text-lg font-semibold text-[#001910]">{title}</h4>
      <p className="mt-2 text-sm leading-7 text-[#385723]">{text}</p>
    </div>
  )
}

function FeatureRow({ icon, title, text }) {
  return (
    <div className="border-b border-[#6f8a55] pb-4 last:border-b-0">
      <div className="flex items-start gap-3">
        <div className="mt-1 text-[#C7D9B5]">{icon}</div>
        <div>
          <h4 className="text-lg font-medium text-white">{title}</h4>
          <p className="mt-2 text-[#EAF3E2]">{text}</p>
        </div>
      </div>
    </div>
  )
}