import express from "express"
import { protect } from "../middlewares/auth.middleware.js"
import { uploadPlaceImage } from "../middlewares/upload.middleware.js"
import {
  createPlace,
  deletePlace,
  getPlaceById,
  getPlaces,
  updatePlace,
} from "../controllers/place.controller.js"

const router = express.Router()

router.get("/", protect, getPlaces)
router.get("/:id", protect, getPlaceById)
router.post("/", protect, uploadPlaceImage.single("image"), createPlace)
router.put("/:id", protect, uploadPlaceImage.single("image"), updatePlace)
router.delete("/:id", protect, deletePlace)

export default router