import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, MapPin, Tag, DollarSign, User } from "lucide-react"
import { getPlaceById } from "../api/places"

export default function PlaceDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [place, setPlace] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchPlace = async () => {
      try {
        setLoading(true)
        setError("")
        const response = await getPlaceById(id)
        setPlace(response.data)
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load place")
      } finally {
        setLoading(false)
      }
    }

    fetchPlace()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f9f3] px-6 py-10">
        <div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-[#385723]">Loading place...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f7f9f3] px-6 py-10">
        <div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/places")}
              className="inline-flex items-center justify-center rounded-full border border-[#355e1d] px-4 py-2 text-sm font-medium text-[#355e1d] transition hover:bg-[#355e1d] hover:text-white"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back
            </button>
          </div>

          <p className="text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!place) return null

  return (
    <div className="min-h-screen bg-[#f7f9f3] px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/places")}
            className="inline-flex items-center justify-center rounded-full border border-[#355e1d] px-4 py-2 text-sm font-medium text-[#355e1d] transition hover:bg-[#355e1d] hover:text-white"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back
          </button>
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
          {place.imageUrl ? (
            <img
              src={place.imageUrl}
              alt={place.name}
              className="h-[320px] w-full object-cover"
            />
          ) : (
            <div className="flex h-[320px] items-center justify-center bg-[#edf2e5] text-[#6b7a60]">
              No image
            </div>
          )}

          <div className="p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-[#001910]">{place.name}</h1>
                <p className="mt-2 text-[#385723]">
                  Detailed information for this place
                </p>
              </div>

              <span className="w-fit rounded-full bg-[#e7efda] px-4 py-2 text-sm font-medium text-[#355e1d]">
                {place.category}
              </span>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <InfoCard
                icon={<Tag size={18} />}
                label="Category"
                value={place.category}
              />
              <InfoCard
                icon={<DollarSign size={18} />}
                label="Price level"
                value={place.priceLevel}
              />
              <InfoCard
                icon={<MapPin size={18} />}
                label="City"
                value={place.city}
              />
              <InfoCard
                icon={<MapPin size={18} />}
                label="Address"
                value={place.address || "No address provided"}
              />
              <InfoCard
                icon={<User size={18} />}
                label="Created by"
                value={place.createdBy?.name || "Unknown"}
              />
              <InfoCard
                icon={<User size={18} />}
                label="Created at"
                value={new Date(place.createdAt).toLocaleString()}
              />
            </div>

            <div className="mt-8 rounded-2xl bg-[#f8fbf3] p-5">
              <h2 className="text-lg font-semibold text-[#001910]">Comment</h2>
              <p className="mt-3 leading-8 text-[#385723]">{place.comment}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoCard({ icon, label, value }) {
  return (
    <div className="rounded-2xl border border-[#e4ebda] bg-white p-4">
      <div className="flex items-center gap-2 text-[#355e1d]">
        {icon}
        <span className="text-sm font-semibold">{label}</span>
      </div>
      <p className="mt-3 text-[#001910]">{value}</p>
    </div>
  )
}