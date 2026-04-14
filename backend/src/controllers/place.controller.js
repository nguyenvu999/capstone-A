import path from "path"
import Place from "../models/place.model.js"
import { supabaseAdmin } from "../config/supabase.js"

function formatPlace(place) {
  return {
    id: place._id.toString(),
    name: place.name,
    category: place.category,
    comment: place.comment,
    priceLevel: place.priceLevel,
    city: place.city,
    address: place.address,
    imageUrl: place.imageUrl,
    createdBy: place.createdBy,
    createdAt: place.createdAt,
    updatedAt: place.updatedAt,
  }
}

async function uploadImageToSupabase(file) {
  if (!file) {
    return { imageUrl: null, imagePath: null }
  }

  const extension = path.extname(file.originalname) || ".jpg"
  const fileName = `places/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}${extension}`

  const { error: uploadError } = await supabaseAdmin.storage
    .from(process.env.SUPABASE_BUCKET)
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    })

  if (uploadError) {
    throw new Error(uploadError.message)
  }

  const { data } = supabaseAdmin.storage
    .from(process.env.SUPABASE_BUCKET)
    .getPublicUrl(fileName)

  return {
    imageUrl: data.publicUrl,
    imagePath: fileName,
  }
}

async function removeImageFromSupabase(imagePath) {
  if (!imagePath) return

  await supabaseAdmin.storage
    .from(process.env.SUPABASE_BUCKET)
    .remove([imagePath])
}

export async function createPlace(req, res, next) {
  try {
    const { name, category, comment, priceLevel, city, address } = req.body

    if (!name || !category || !comment || !priceLevel || !city) {
      return res.status(400).json({
        error: "Name, category, comment, price level, and city are required",
      })
    }

    const { imageUrl, imagePath } = await uploadImageToSupabase(req.file)

    const place = await Place.create({
      name: name.trim(),
      category,
      comment: comment.trim(),
      priceLevel,
      city: city.trim(),
      address: address?.trim() || "",
      imageUrl,
      imagePath,
      createdBy: req.user._id,
    })

    return res.status(201).json(formatPlace(place))
  } catch (error) {
    next(error)
  }
}

export async function getPlaces(req, res, next) {
  try {
    const { category, city, priceLevel, mine } = req.query

    const filter = {}

    if (category) filter.category = category
    if (city) filter.city = city
    if (priceLevel) filter.priceLevel = priceLevel
    if (mine === "true") filter.createdBy = req.user._id

    const places = await Place.find(filter)
      .sort({ createdAt: -1 })
      .populate("createdBy", "name email")

    return res.status(200).json(places.map(formatPlace))
  } catch (error) {
    next(error)
  }
}

export async function getPlaceById(req, res, next) {
  try {
    const place = await Place.findById(req.params.id).populate(
      "createdBy",
      "name email"
    )

    if (!place) {
      return res.status(404).json({ error: "Place not found" })
    }

    return res.status(200).json(formatPlace(place))
  } catch (error) {
    next(error)
  }
}

export async function updatePlace(req, res, next) {
  try {
    const place = await Place.findById(req.params.id)

    if (!place) {
      return res.status(404).json({ error: "Place not found" })
    }

    if (place.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "You can only edit your own places" })
    }

    const { name, category, comment, priceLevel, city, address } = req.body

    if (req.file) {
      await removeImageFromSupabase(place.imagePath)

      const { imageUrl, imagePath } = await uploadImageToSupabase(req.file)
      place.imageUrl = imageUrl
      place.imagePath = imagePath
    }

    if (name !== undefined) place.name = name.trim()
    if (category !== undefined) place.category = category
    if (comment !== undefined) place.comment = comment.trim()
    if (priceLevel !== undefined) place.priceLevel = priceLevel
    if (city !== undefined) place.city = city.trim()
    if (address !== undefined) place.address = address.trim()

    await place.save()

    return res.status(200).json(formatPlace(place))
  } catch (error) {
    next(error)
  }
}

export async function deletePlace(req, res, next) {
  try {
    const place = await Place.findById(req.params.id)

    if (!place) {
      return res.status(404).json({ error: "Place not found" })
    }

    if (place.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "You can only delete your own places" })
    }

    await removeImageFromSupabase(place.imagePath)
    await place.deleteOne()

    return res.status(200).json({ message: "Place deleted successfully" })
  } catch (error) {
    next(error)
  }
}