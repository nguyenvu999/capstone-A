import multer from "multer"

export function errorHandler(err, req, res, next) {
  console.error(err)

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        error: "Image must be smaller than 5MB",
      })
    }
  }

  if (err.message === "Only JPG, PNG, and WEBP images are allowed") {
    return res.status(400).json({
      error: err.message,
    })
  }

  return res.status(500).json({
    error: err.message || "Internal server error",
  })
}