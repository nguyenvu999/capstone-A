import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { deletePlace, getPlaces } from "../api/places"

export default function PlacesPage() {
  const [places, setPlaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchPlaces = async () => {
    try {
      setLoading(true)
      const response = await getPlaces()
      setPlaces(response.data)
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load places")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlaces()
  }, [])

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Delete this place?")
    if (!confirmed) return

    try {
      await deletePlace(id)
      setPlaces((prev) => prev.filter((item) => item.id !== id))
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete place")
    }
  }

  if (loading) {
    return <div className="p-8">Loading places...</div>
  }

  if (error) {
    return <div className="p-8 text-red-600">{error}</div>
  }

  return (
    <div className="min-h-screen bg-[#f7f9f3] px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-[#001910]">Places</h1>
          <Link
            to="/places/new"
            className="rounded-full bg-[#355e1d] px-5 py-3 font-medium text-white"
          >
            Add place
          </Link>
        </div>

        {places.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 shadow-sm">
            No places yet.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {places.map((place) => (
              <div
                key={place.id}
                className="overflow-hidden rounded-3xl bg-white shadow-sm"
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
                    <h2 className="text-xl font-semibold">{place.name}</h2>
                    <span className="rounded-full bg-[#e7efda] px-3 py-1 text-xs text-[#355e1d]">
                      {place.category}
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-[#385723]">{place.comment}</p>

                  <div className="mt-4 space-y-1 text-sm text-[#5b655d]">
                    <p>Price: {place.priceLevel}</p>
                    <p>City: {place.city}</p>
                    {place.address && <p>Address: {place.address}</p>}
                  </div>

                  <div className="mt-5 flex gap-3">
                    <button
                      onClick={() => handleDelete(place.id)}
                      className="rounded-full border border-red-300 px-4 py-2 text-sm text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}