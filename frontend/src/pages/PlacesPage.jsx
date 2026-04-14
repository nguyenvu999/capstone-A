import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft, MapPin, Search, Plus, FolderOpen } from "lucide-react"
import { deletePlace, getPlaces } from "../api/places"
import { useAuth } from "../context/AuthContext"
import { useToast } from "../components/ui/Toast"
import ConfirmDialog from "../components/ui/ConfirmDialog"

const CATEGORIES = [
  "",
  "Sight",
  "Restaurants",
  "Bars",
  "Entertainment",
  "Team Events",
]

const PRICE_LEVELS = ["", "$", "$$", "$$$", "$$$$"]

export default function PlacesPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showToast, ToastComponent } = useToast()

  const [places, setPlaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [placeToDelete, setPlaceToDelete] = useState(null)

  const [filters, setFilters] = useState({
    search: "",
    category: "",
    city: "",
    priceLevel: "",
  })

  const fetchPlaces = async () => {
    try {
      setLoading(true)
      setError("")
      const response = await getPlaces()
      setPlaces(response.data)
    } catch (err) {
      const message = err.response?.data?.error || "Failed to load places"
      setError(message)
      showToast(message, "error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlaces()
  }, [])

  const openDeleteDialog = (place) => {
    setPlaceToDelete(place)
  }

  const closeDeleteDialog = () => {
    if (deleteLoading) return
    setPlaceToDelete(null)
  }

  const confirmDelete = async () => {
    if (!placeToDelete) return

    try {
      setDeleteLoading(true)
      await deletePlace(placeToDelete.id)

      setPlaces((prev) => prev.filter((item) => item.id !== placeToDelete.id))
      showToast("Place deleted successfully.", "success")
      setPlaceToDelete(null)
    } catch (err) {
      const message = err.response?.data?.error || "Failed to delete place"
      showToast(message, "error")
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const filteredPlaces = useMemo(() => {
    const searchText = filters.search.trim().toLowerCase()
    const cityText = filters.city.trim().toLowerCase()

    return places.filter((place) => {
      const matchSearch =
        !searchText || place.name?.toLowerCase().includes(searchText)

      const matchCategory =
        !filters.category || place.category === filters.category

      const matchCity =
        !cityText || place.city?.toLowerCase().includes(cityText)

      const matchPrice =
        !filters.priceLevel || place.priceLevel === filters.priceLevel

      return matchSearch && matchCategory && matchCity && matchPrice
    })
  }, [places, filters])

  const hasActiveFilters = Boolean(
    filters.search || filters.category || filters.city || filters.priceLevel
  )

  if (error) {
    return (
      <div className="min-h-screen bg-[#f7f9f3] px-6 py-10">
        <div className="mx-auto max-w-6xl rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-red-600">{error}</p>
        </div>
        {ToastComponent}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f7f9f3] px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="inline-flex items-center justify-center rounded-full border border-[#355e1d] px-4 py-2 text-sm font-medium text-[#355e1d] transition hover:bg-[#355e1d] hover:text-white"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back
            </button>

            <h1 className="text-3xl font-bold text-[#001910]">Places</h1>
          </div>

          <Link
            to="/places/new"
            className="inline-flex items-center rounded-full bg-[#355e1d] px-5 py-3 font-medium text-white transition hover:bg-[#2d4f18]"
          >
            <Plus size={16} className="mr-2" />
            Add place
          </Link>
        </div>

        <div className="mb-8 rounded-3xl bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6b7a60]"
              />
              <input
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search by place name"
                className="h-12 w-full rounded-xl border px-4 pl-11"
              />
            </div>

            <select
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="h-12 rounded-xl border px-4"
            >
              {CATEGORIES.map((item) => (
                <option key={item || "all"} value={item}>
                  {item || "All categories"}
                </option>
              ))}
            </select>

            <input
              name="city"
              value={filters.city}
              onChange={handleFilterChange}
              placeholder="Search by city"
              className="h-12 rounded-xl border px-4"
            />

            <select
              name="priceLevel"
              value={filters.priceLevel}
              onChange={handleFilterChange}
              className="h-12 rounded-xl border px-4"
            >
              {PRICE_LEVELS.map((item) => (
                <option key={item || "all"} value={item}>
                  {item || "All prices"}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <PlacesSkeleton />
        ) : filteredPlaces.length === 0 ? (
          <EmptyState hasActiveFilters={hasActiveFilters} />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredPlaces.map((place) => {
              const isOwner = user?.id === place.createdBy?.id

              return (
                <div
                  key={place.id}
                  className="overflow-hidden rounded-3xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  {place.imageUrl ? (
                    <img
                      src={place.imageUrl}
                      alt={place.name}
                      className="h-52 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-52 items-center justify-center bg-[#edf2e5] text-[#6b7a60]">
                      No image
                    </div>
                  )}

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-xl font-semibold text-[#001910]">
                        {place.name}
                      </h2>
                      <span className="rounded-full bg-[#e7efda] px-3 py-1 text-xs text-[#355e1d]">
                        {place.category}
                      </span>
                    </div>

                    <p className="mt-3 text-sm text-[#385723]">{place.comment}</p>

                    <div className="mt-4 space-y-1 text-sm text-[#5b655d]">
                      <p>Price: {place.priceLevel}</p>
                      <p>City: {place.city}</p>
                      {place.address && <p>Address: {place.address}</p>}
                      <p>
                        Created by: {place.createdBy?.name || "Unknown"}
                        {isOwner && (
                          <span className="ml-2 rounded-full bg-[#eef5e5] px-2 py-1 text-xs text-[#355e1d]">
                            You
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <Link
                        to={`/places/${place.id}`}
                        className="rounded-full border border-[#355e1d] px-4 py-2 text-sm text-[#355e1d] transition hover:bg-[#355e1d] hover:text-white"
                      >
                        View
                      </Link>

                      {isOwner && (
                        <>
                          <Link
                            to={`/places/${place.id}/edit`}
                            className="rounded-full border border-[#355e1d] px-4 py-2 text-sm text-[#355e1d] transition hover:bg-[#355e1d] hover:text-white"
                          >
                            Edit
                          </Link>

                          <button
                            onClick={() => openDeleteDialog(place)}
                            className="rounded-full border border-red-300 px-4 py-2 text-sm text-red-600 transition hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!placeToDelete}
        title="Delete this place?"
        message={
          placeToDelete
            ? `You are about to permanently delete "${placeToDelete.name}". This action cannot be undone.`
            : ""
        }
        confirmText="Delete place"
        cancelText="Keep it"
        confirmVariant="danger"
        loading={deleteLoading}
        onConfirm={confirmDelete}
        onCancel={closeDeleteDialog}
      />

      {ToastComponent}
    </div>
  )
}

function PlacesSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-3xl bg-white shadow-sm"
        >
          <div className="h-52 w-full animate-pulse bg-[#e8eee0]" />
          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="h-6 w-40 animate-pulse rounded bg-[#e8eee0]" />
              <div className="h-6 w-20 animate-pulse rounded-full bg-[#e8eee0]" />
            </div>

            <div className="mt-4 space-y-2">
              <div className="h-4 w-full animate-pulse rounded bg-[#e8eee0]" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-[#e8eee0]" />
              <div className="h-4 w-4/6 animate-pulse rounded bg-[#e8eee0]" />
            </div>

            <div className="mt-5 space-y-2">
              <div className="h-4 w-24 animate-pulse rounded bg-[#e8eee0]" />
              <div className="h-4 w-32 animate-pulse rounded bg-[#e8eee0]" />
              <div className="h-4 w-36 animate-pulse rounded bg-[#e8eee0]" />
            </div>

            <div className="mt-5 flex gap-3">
              <div className="h-10 w-20 animate-pulse rounded-full bg-[#e8eee0]" />
              <div className="h-10 w-20 animate-pulse rounded-full bg-[#e8eee0]" />
              <div className="h-10 w-20 animate-pulse rounded-full bg-[#e8eee0]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState({ hasActiveFilters }) {
  return (
    <div className="rounded-3xl bg-white px-8 py-14 text-center shadow-sm">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eef5e5] text-[#355e1d]">
        {hasActiveFilters ? <Search size={28} /> : <FolderOpen size={28} />}
      </div>

      <h2 className="mt-5 text-2xl font-bold text-[#001910]">
        {hasActiveFilters ? "No matching places found" : "No places yet"}
      </h2>

      <p className="mx-auto mt-3 max-w-xl leading-7 text-[#5b655d]">
        {hasActiveFilters
          ? "Try changing your search text, city, category, or price level to see more results."
          : "Start building your collection by adding the first recommended place for your team."}
      </p>

      <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
        {!hasActiveFilters && (
          <Link
            to="/places/new"
            className="inline-flex items-center rounded-full bg-[#355e1d] px-5 py-3 font-medium text-white transition hover:bg-[#2d4f18]"
          >
            <Plus size={16} className="mr-2" />
            Add your first place
          </Link>
        )}

        <Link
          to="/"
          className="inline-flex items-center rounded-full border border-[#355e1d] px-5 py-3 font-medium text-[#355e1d] transition hover:bg-[#355e1d] hover:text-white"
        >
          <MapPin size={16} className="mr-2" />
          Back to landing page
        </Link>
      </div>
    </div>
  )
}