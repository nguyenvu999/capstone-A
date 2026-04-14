import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { deletePlace, getPlaces } from "../api/places"

export default function PlacesPage() {
  const navigate = useNavigate()
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
    return (
      <div className="min-h-screen bg-[#f7f9f3] px-6 py-10">
        <div className="mx-auto max-w-6xl rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-[#385723]">Loading places...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f7f9f3] px-6 py-10">
        <div className="mx-auto max-w-6xl rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-red-600">{error}</p>
        </div>
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
            className="rounded-full bg-[#355e1d] px-5 py-3 font-medium text-white transition hover:bg-[#2d4f18]"
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
                  </div>

                  <div className="mt-5 flex gap-3">
                    <Link
                      to={`/places/${place.id}/edit`}
                      className="rounded-full border border-[#355e1d] px-4 py-2 text-sm text-[#355e1d] transition hover:bg-[#355e1d] hover:text-white"
                    >
                      Edit
                    </Link>

                    <button
                      onClick={() => handleDelete(place.id)}
                      className="rounded-full border border-red-300 px-4 py-2 text-sm text-red-600 transition hover:bg-red-50"
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