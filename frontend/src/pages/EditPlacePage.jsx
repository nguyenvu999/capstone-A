import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { getPlaceById, updatePlace } from "../api/places"

const CATEGORIES = [
  "Sight",
  "Restaurants",
  "Bars",
  "Entertainment",
  "Team Events",
]

const PRICE_LEVELS = ["$", "$$", "$$$", "$$$$"]

export default function EditPlacePage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: "",
    category: "Restaurants",
    comment: "",
    priceLevel: "$$",
    city: "",
    address: "",
  })

  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState("")
  const [existingImage, setExistingImage] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchPlace = async () => {
      try {
        setLoading(true)
        setError("")

        const response = await getPlaceById(id)
        const place = response.data

        setForm({
          name: place.name || "",
          category: place.category || "Restaurants",
          comment: place.comment || "",
          priceLevel: place.priceLevel || "$$",
          city: place.city || "",
          address: place.address || "",
        })

        setExistingImage(place.imageUrl || "")
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load place")
      } finally {
        setLoading(false)
      }
    }

    fetchPlace()
  }, [id])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImage(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    try {
      setSaving(true)

      const formData = new FormData()
      formData.append("name", form.name)
      formData.append("category", form.category)
      formData.append("comment", form.comment)
      formData.append("priceLevel", form.priceLevel)
      formData.append("city", form.city)
      formData.append("address", form.address)

      if (image) {
        formData.append("image", image)
      }

      await updatePlace(id, formData)
      navigate("/places")
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update place")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f9f3] px-6 py-10">
        <div className="mx-auto max-w-2xl rounded-3xl bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/places")}
              className="inline-flex items-center justify-center rounded-full border border-[#355e1d] px-4 py-2 text-sm font-medium text-[#355e1d] transition hover:bg-[#355e1d] hover:text-white"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back
            </button>
            <h1 className="text-3xl font-bold text-[#001910]">Edit Place</h1>
          </div>

          <p className="text-[#385723]">Loading place...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f7f9f3] px-6 py-10">
      <div className="mx-auto max-w-2xl rounded-3xl bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/places")}
            className="inline-flex items-center justify-center rounded-full border border-[#355e1d] px-4 py-2 text-sm font-medium text-[#355e1d] transition hover:bg-[#355e1d] hover:text-white"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back
          </button>

          <h1 className="text-3xl font-bold text-[#001910]">Edit Place</h1>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#001910]">
              Place name
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="h-12 w-full rounded-xl border px-4"
              placeholder="Pizza 4P's"
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#001910]">
                Category
              </label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="h-12 w-full rounded-xl border px-4"
              >
                {CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#001910]">
                Price level
              </label>
              <select
                name="priceLevel"
                value={form.priceLevel}
                onChange={handleChange}
                className="h-12 w-full rounded-xl border px-4"
              >
                {PRICE_LEVELS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#001910]">
              City
            </label>
            <input
              name="city"
              value={form.city}
              onChange={handleChange}
              className="h-12 w-full rounded-xl border px-4"
              placeholder="Ho Chi Minh City"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#001910]">
              Address
            </label>
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              className="h-12 w-full rounded-xl border px-4"
              placeholder="Optional address"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#001910]">
              Comment
            </label>
            <textarea
              name="comment"
              value={form.comment}
              onChange={handleChange}
              className="min-h-[120px] w-full rounded-xl border px-4 py-3"
              placeholder="Why do you recommend this place?"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#001910]">
              Image
            </label>

            <div className="rounded-2xl border border-dashed border-[#b8c8a7] bg-[#f8fbf3] p-4">
              <input
                id="edit-place-image"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleImageChange}
                className="hidden"
              />

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-[#355e1d]">
                    Replace place image
                  </p>
                  <p className="mt-1 text-xs text-[#6b7a60]">
                    JPG, PNG or WEBP. Max 5MB.
                  </p>
                </div>

                <label
                  htmlFor="edit-place-image"
                  className="inline-flex cursor-pointer items-center justify-center rounded-full bg-[#355e1d] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#2d4f18]"
                >
                  Choose Image
                </label>
              </div>

              <div className="mt-3 rounded-xl bg-white px-4 py-3 text-sm text-[#4f5d52]">
                {image ? image.name : "No new file chosen"}
              </div>
            </div>

            {(preview || existingImage) && (
              <div className="mt-4">
                <p className="mb-2 text-sm text-[#385723]">
                  {preview ? "New image preview" : "Current image"}
                </p>
                <img
                  src={preview || existingImage}
                  alt="Place preview"
                  className="h-52 w-full rounded-2xl object-cover"
                />
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-[#355e1d] px-6 py-3 font-medium text-white"
            >
              {saving ? "Updating..." : "Update place"}
            </button>

            <button
              type="button"
              onClick={() => navigate("/places")}
              className="rounded-full border px-6 py-3 font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}