import mongoose from "mongoose"

const placeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["Sight", "Restaurants", "Bars", "Entertainment", "Team Events"],
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    priceLevel: {
      type: String,
      required: true,
      enum: ["$", "$$", "$$$", "$$$$"],
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      default: "",
      trim: true,
    },
    imageUrl: {
      type: String,
      default: null,
    },
    imagePath: {
      type: String,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

const Place = mongoose.model("Place", placeSchema)

export default Place