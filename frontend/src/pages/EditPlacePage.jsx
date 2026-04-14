import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { getPlaceById, updatePlace } from "../api/places"
import { useToast } from "../components/ui/Toast"

const CATEGORIES = [
  "Sight",
  "Restaurants",
  "Bars",
  "Entertainment",
  "Team Events",
]

const PRICE_LEVELS = ["$", "$$", "$$$", "$$$$"]
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_IMAGE_SIZE = 5 * 1024 * 1024

export default function EditPlacePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showToast, ToastComponent } = useToast()

  const [form, setForm] = useState({
    name: "",
    category: "Restaurants",
    comment: "",
    priceLevel: "$$",
    city: "",
    address: "",
  })

  const [errors, setErrors] = useState({})
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState("")
  const [existingImage, setExistingImage] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState("")

  const validateField = (name, value) => {
    switch (name) {
      case "name":
        if (!value.trim()) return "Place name is required"
        if (value.trim().length < 2) return "Place name must be at least 2 characters"
        return ""

      case "category":
        if (!value) return "Category is required"
        return ""

      case "comment":
        if (!value.trim()) return "Comment is required"
        if (value.trim().length < 10) return "Comment must be at least 10 characters"
        return ""

      case "priceLevel":
        if (!value) return "Price level is required"
        return ""

      case "city":
        if (!value.trim()) return "City is required"
        return ""

      default:
        return ""
    }
  }

  const validateForm = () => {
    const newErrors = {
      name: validateField("name", form.name),
      category: validateField("category", form.category),
      comment: validateField("comment", form.comment),
      priceLevel: validateField("priceLevel", form.priceLevel),
      city: validateField("city", form.city),
      image: errors.image || "",
    }

    Object.keys(newErrors).forEach((key) => {
      if (!newErrors[key]) delete newErrors[key]
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  useEffect(() => {
    const fetchPlace = async () => {
      try {
        setLoading(true)
        setSubmitError("")

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
        const message = err.response?.data?.error || "Failed to load place"
        setSubmitError(message)
        showToast(message, "error")
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

    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, value),
    }))
  }

  const handleBlur = (e) => {
    const { name, value } = e.target
    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, value),
    }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        image: "Only JPG, PNG, or WEBP images are allowed",
      }))
      setImage(null)
      setPreview("")
      return
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setErrors((prev) => ({
        ...prev,
        image: "Image must be smaller than 5MB",
      }))
      setImage(null)
      setPreview("")
      return
    }

    setErrors((prev) => ({
      ...prev,
      image: "",
    }))

    setImage(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError("")

    const isValid = validateForm()
    if (!isValid) {
      showToast("Please fix the form errors before submitting.", "error")
      return
    }

    try {
      setSaving(true)

      const formData = new FormData()
      formData.append("name", form.name.trim())
      formData.append("category", form.category)
      formData.append("comment", form.comment.trim())
      formData.append("priceLevel", form.priceLevel)
      formData.append("city", form.city.trim())
      formData.append("address", form.address.trim())

      if (image) {
        formData.append("image", image)
      }

      await updatePlace(id, formData)
      showToast("Place updated successfully.", "success")

      setTimeout(() => {
        navigate("/places")
      }, 700)
    } catch (err) {
      const message = err.response?.data?.error || "Failed to update place"
      setSubmitError(message)
      showToast(message, "error")
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
          {ToastComponent}
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

        {submitError && (
          <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#001910]">
              Place name
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`h-12 w-full rounded-xl border px-4 ${
                errors.name ? "border-red-500" : ""
              }`}
              placeholder="Pizza 4P's"
            />
            {errors.name && (
              <p className="mt-2 text-sm text-red-600">{errors.name}</p>
            )}
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
                onBlur={handleBlur}
                className={`h-12 w-full rounded-xl border px-4 ${
                  errors.category ? "border-red-500" : ""
                }`}
              >
                {CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-2 text-sm text-red-600">{errors.category}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#001910]">
                Price level
              </label>
              <select
                name="priceLevel"
                value={form.priceLevel}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`h-12 w-full rounded-xl border px-4 ${
                  errors.priceLevel ? "border-red-500" : ""
                }`}
              >
                {PRICE_LEVELS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              {errors.priceLevel && (
                <p className="mt-2 text-sm text-red-600">{errors.priceLevel}</p>
              )}
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
              onBlur={handleBlur}
              className={`h-12 w-full rounded-xl border px-4 ${
                errors.city ? "border-red-500" : ""
              }`}
              placeholder="Ho Chi Minh City"
            />
            {errors.city && (
              <p className="mt-2 text-sm text-red-600">{errors.city}</p>
            )}
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
              onBlur={handleBlur}
              className={`min-h-[120px] w-full rounded-xl border px-4 py-3 ${
                errors.comment ? "border-red-500" : ""
              }`}
              placeholder="Why do you recommend this place?"
            />
            {errors.comment && (
              <p className="mt-2 text-sm text-red-600">{errors.comment}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#001910]">
              Image
            </label>

            <div
              className={`rounded-2xl border border-dashed bg-[#f8fbf3] p-4 ${
                errors.image ? "border-red-500" : "border-[#b8c8a7]"
              }`}
            >
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

            {errors.image && (
              <p className="mt-2 text-sm text-red-600">{errors.image}</p>
            )}

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
              className="rounded-full bg-[#355e1d] px-6 py-3 font-medium text-white disabled:opacity-60"
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

      {ToastComponent}
    </div>
  )
}