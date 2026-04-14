import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { createPlace } from "../api/places"

const CATEGORIES = [
  "Sight",
  "Restaurants",
  "Bars",
  "Entertainment",
  "Team Events",
]

const PRICE_LEVELS = ["$", "$$", "$$$", "$$$$"]

export default function AddPlacePage() {
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
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
      setLoading(true)

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

      await createPlace(formData)
      navigate("/places")
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create place")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f9f3] px-6 py-10">
      <div className="mx-auto max-w-2xl rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-3xl font-bold text-[#001910]">Add New Place</h1>

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
                id="place-image"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleImageChange}
                className="hidden"
              />

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-[#355e1d]">
                    Upload a place image
                  </p>
                  <p className="mt-1 text-xs text-[#6b7a60]">
                    JPG, PNG or WEBP. Max 5MB.
                  </p>
                </div>

                <label
                  htmlFor="place-image"
                  className="inline-flex cursor-pointer items-center justify-center rounded-full bg-[#355e1d] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#2d4f18]"
                >
                  Choose Image
                </label>
              </div>

              <div className="mt-3 rounded-xl bg-white px-4 py-3 text-sm text-[#4f5d52]">
                {image ? image.name : "No file chosen"}
              </div>
            </div>

            {preview && (
              <div className="mt-4">
                <p className="mb-2 text-sm text-[#385723]">Image preview</p>
                <img
                  src={preview}
                  alt="Preview"
                  className="h-52 w-full rounded-2xl object-cover"
                />
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-[#355e1d] px-6 py-3 font-medium text-white"
            >
              {loading ? "Saving..." : "Create place"}
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