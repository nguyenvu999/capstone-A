export function errorHandler(err, req, res, next) {
  console.error(err)

  return res.status(500).json({
    error: "Internal server error",
    code: "INTERNAL_SERVER_ERROR",
  })
}