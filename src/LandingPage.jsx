import React, { useState } from "react";
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
  X,
  ArrowLeft,
  Eye,
} from "lucide-react";

const places = [
  {
    name: "Nyhavn",
    category: "Sight",
    comment: "Colorful waterfront area, good for a short team walk.",
    price: "$",
    image:
      "https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Kødbyens Fiskebar",
    category: "Restaurants",
    comment: "A popular option for team dinners and small gatherings.",
    price: "$$$",
    image:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Generator Bar",
    category: "Bars",
    comment: "Casual place for after-work drinks.",
    price: "$$",
    image:
      "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Tivoli Gardens",
    category: "Entertainment",
    comment: "A lively destination for group outings.",
    price: "$$",
    image:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Escape Room Copenhagen",
    category: "Team Events",
    comment: "A strong option for team bonding activities.",
    price: "$$",
    image:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Torvehallerne",
    category: "Restaurants",
    comment: "A flexible food market with many choices.",
    price: "$$",
    image:
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80",
  },
];

export default function LandingPage() {
  const [authMode, setAuthMode] = useState(null); // null | "login" | "register"

  return (
    <div className='min-h-screen bg-[#94AB71] text-[#001910] [font-family:"Nunito_Sans",sans-serif]'>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/30 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#dce8c8] flex items-center justify-center">
              <MapPin className="w-6 h-6 text-[#355e1d]" />
            </div>

            <span className="text-2xl font-semibold text-black">
              NetSuggest
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-10 text-[#355e1d] font-medium">
            <a href="#categories" className="hover:text-black transition">
              Categories
            </a>
            <a href="#places" className="hover:text-black transition">
              Places
            </a>
            <a href="#map" className="hover:text-black transition">
              Map
            </a>
            <a href="#planner" className="hover:text-black transition">
              Planner
            </a>
          </nav>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setAuthMode("login")}
              className="bg-[#355e1d] text-white px-5 py-2.5 rounded-full font-medium hover:bg-[#2d4f18] transition"
            >
              Sign in
            </button>
          </div>
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
              Discover restaurants, bars, entertainment, and team activities
              near your office.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <button className="inline-flex items-center justify-center rounded-full bg-[#385723] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#94AB71]">
                Explore Places
                <ChevronRight className="ml-2" size={18} />
              </button>

              <button className="rounded-full border border-[#94AB71] px-6 py-3 text-sm font-medium text-[#385723] transition hover:bg-[#C7D9B5]">
                Create Itinerary
              </button>
            </div>

            <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Categories" value="5" />
              <StatCard label="Recommended Places" value="120+" />
              <StatCard label="Team Event Planner" value="Built-in" />
              <StatCard label="Route Optimization" value="Available" />
            </div>
          </div>
        </section>

        <section
          id="categories"
          className="mx-auto max-w-7xl px-6 py-16 lg:px-8"
        >
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

          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {places.map((place) => (
              <PlaceCard key={place.name} {...place} />
            ))}
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
                  Sign in to explore recommended places, filters, and route
                  optimization.
                </p>
              </div>
            </button>
          </div>
        </section>

        <section
          id="planner"
          className="mx-auto max-w-7xl px-6 py-16 lg:px-8"
        >
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
                Users can build a personal itinerary and select multiple places
                in one flow.
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

      <footer className="bg-[#355e1d] text-white mt-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 pb-14 border-b border-white/10 max-w-3xl">
            <div>
              <h3 className="text-xl font-semibold mb-6 text-white">
                About NetSuggest
              </h3>
              <ul className="space-y-4 text-white/75">
                <li>
                  <a href="#" className="hover:text-white transition">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Press
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Resources and Policies
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Trust & Safety
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-6 text-white">
                Explore
              </h3>
              <ul className="space-y-4 text-white/75">
                <li>
                  <a href="#" className="hover:text-white transition">
                    Write a Review
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Add a Place
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Join
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Travel Stories
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-14 pt-8 border-t border-white/15 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-white/70 text-sm">
                © 2026 Tripadvisor LLC All rights reserved.
              </p>

              <div className="flex flex-wrap gap-5 mt-3 text-sm text-white/70">
                <a href="#" className="hover:text-white transition">
                  Terms of Use
                </a>
                <a href="#" className="hover:text-white transition">
                  Privacy and Cookies Statement
                </a>
                <a href="#" className="hover:text-white transition">
                  Cookie consent
                </a>
                <a href="#" className="hover:text-white transition">
                  How the site works
                </a>
                <a href="#" className="hover:text-white transition">
                  Contact us
                </a>
                <a href="#" className="hover:text-white transition">
                  Accessibility Statement
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {authMode && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="relative w-full max-w-[520px] rounded-[22px] bg-white px-7 pt-6 pb-5 shadow-2xl">
            <button
              type="button"
              onClick={() =>
                authMode === "register"
                  ? setAuthMode("login")
                  : setAuthMode(null)
              }
              className="absolute left-4 top-4 text-[#17341e] hover:opacity-70"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={() => setAuthMode(null)}
              className="absolute right-4 top-4 text-[#17341e] hover:opacity-70"
            >
              <X className="h-5 w-5" />
            </button>

            {authMode === "login" ? (
              <>
                <div className="mb-5 mt-3">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#003b1f]">
                    <MapPin className="h-6 w-6 text-white" />
                  </div>

                  <h2 className="text-[30px] font-bold leading-[34px] tracking-tight text-[#001910]">
                    Welcome back.
                  </h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-[14px] font-semibold text-[#16351e]">
                      Email address
                    </label>

                    <input
                      type="email"
                      placeholder="Email"
                      className="h-[48px] w-full rounded-[12px] border border-[#8ea183] px-4 text-[15px] outline-none transition focus:border-[#355e1d]"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-[14px] font-semibold text-[#16351e]">
                      Password
                    </label>

                    <div className="relative">
                      <input
                        type="password"
                        placeholder="Password"
                        className="h-[48px] w-full rounded-[12px] border border-[#8ea183] px-4 pr-11 text-[15px] outline-none transition focus:border-[#355e1d]"
                      />

                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#355e1d]"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="text-[14px] text-[#355e1d] underline hover:text-black"
                  >
                    Forgot password?
                  </button>

                  <button
                    type="button"
                    className="h-[50px] w-full rounded-full bg-[#003b1f] text-[17px] font-semibold text-white transition hover:bg-[#002814]"
                  >
                    Sign in
                  </button>
                </div>

                <div className="mt-6 text-center">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="h-px flex-1 bg-[#d7ddd4]" />
                    <span className="text-[14px] text-[#5f6a60]">
                      Not a member?
                    </span>
                    <div className="h-px flex-1 bg-[#d7ddd4]" />
                  </div>

                  <p className="text-[14px] text-[#355e1d]">
                    <button
                      type="button"
                      onClick={() => setAuthMode("register")}
                      className="font-bold underline"
                    >
                      Join
                    </button>{" "}
                    to unlock the best of NetSuggest.
                  </p>

                  <p className="mt-5 text-[11px] leading-5 text-[#6b746c]">
                    By proceeding, you agree to our{" "}
                    <span className="underline">Terms of Use</span> and confirm
                    you have read our{" "}
                    <span className="underline">
                      Privacy and Cookie Statement
                    </span>
                    .
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="mb-5 mt-3">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#003b1f]">
                    <MapPin className="h-6 w-6 text-white" />
                  </div>

                  <h2 className="max-w-[360px] text-[26px] font-bold leading-[30px] tracking-tight text-[#001910]">
                    Join to unlock the best of NetSuggest
                  </h2>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-2 block text-[14px] font-semibold text-[#16351e]">
                        First Name
                      </label>
                      <input
                        type="text"
                        placeholder="First Name"
                        className="h-[48px] w-full rounded-[12px] border border-[#8ea183] px-4 text-[15px] outline-none transition focus:border-[#355e1d]"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-[14px] font-semibold text-[#16351e]">
                        Last Name
                      </label>
                      <input
                        type="text"
                        placeholder="Last Name"
                        className="h-[48px] w-full rounded-[12px] border border-[#8ea183] px-4 text-[15px] outline-none transition focus:border-[#355e1d]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-[14px] font-semibold text-[#16351e]">
                      Email address
                    </label>
                    <input
                      type="email"
                      placeholder="Email"
                      className="h-[48px] w-full rounded-[12px] border border-[#8ea183] px-4 text-[15px] outline-none transition focus:border-[#355e1d]"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-[14px] font-semibold text-[#16351e]">
                      Create a password
                    </label>

                    <div className="relative">
                      <input
                        type="password"
                        placeholder="Password"
                        className="h-[48px] w-full rounded-[12px] border border-[#8ea183] px-4 pr-11 text-[15px] outline-none transition focus:border-[#355e1d]"
                      />

                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#355e1d]"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="h-[50px] w-full rounded-full bg-[#003b1f] text-[17px] font-semibold text-white transition hover:bg-[#002814]"
                  >
                    Join
                  </button>
                </div>

                <div className="mt-6 text-center">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="h-px flex-1 bg-[#d7ddd4]" />
                    <span className="text-[14px] text-[#5f6a60]">
                      Already a member?
                    </span>
                    <div className="h-px flex-1 bg-[#d7ddd4]" />
                  </div>

                  <p className="text-[14px] text-[#355e1d]">
                    <button
                      type="button"
                      onClick={() => setAuthMode("login")}
                      className="font-bold underline"
                    >
                      Sign in
                    </button>{" "}
                    using your NetSuggest account.
                  </p>

                  <p className="mt-5 text-[11px] leading-5 text-[#6b746c]">
                    By proceeding, you agree to our{" "}
                    <span className="underline">Terms of Use</span> and confirm
                    you have read our{" "}
                    <span className="underline">
                      Privacy and Cookie Statement
                    </span>
                    .
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-[24px] border border-[#C7D9B5] bg-white/70 p-5 text-center shadow-sm">
      <p className="text-sm text-[#385723]">{label}</p>
      <h3 className="mt-2 text-3xl font-semibold text-[#001910]">{value}</h3>
    </div>
  );
}

function CategoryCard({ icon, title }) {
  return (
    <div className="rounded-[28px] border border-[#C7D9B5] bg-white/80 p-6 transition hover:-translate-y-1 hover:shadow-md">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#C7D9B5] text-[#385723]">
        {icon}
      </div>
      <h4 className="mt-5 text-xl font-semibold text-[#001910]">{title}</h4>
    </div>
  );
}

function PlaceCard({ image, name, category, comment, price }) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-[#C7D9B5] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <img src={image} alt={name} className="h-52 w-full object-cover" />

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
          <button className="rounded-full bg-[#385723] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#94AB71]">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function FilterChip({ label }) {
  return (
    <button className="rounded-full border border-[#C7D9B5] bg-white px-4 py-2 text-sm text-[#385723] transition hover:bg-[#C7D9B5] hover:text-[#001910]">
      {label}
    </button>
  );
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
  );
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
  );
}