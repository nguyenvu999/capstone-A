import jwt from "jsonwebtoken"
import User from "../models/user.model.js"

export async function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Invalid token",
        code: "INVALID_TOKEN",
      })
    }

    const token = authHeader.split(" ")[1]

    let decoded
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET)
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          error: "Token expired",
          code: "TOKEN_EXPIRED",
        })
      }

      return res.status(401).json({
        error: "Invalid token",
        code: "INVALID_TOKEN",
      })
    }

    const user = await User.findById(decoded.userId).select("-password")

    if (!user) {
      return res.status(401).json({
        error: "Invalid token",
        code: "INVALID_TOKEN",
      })
    }

    req.user = user
    next()
  } catch (error) {
    next(error)
  }
}