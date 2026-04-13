import bcrypt from "bcryptjs"
import User from "../models/user.model.js"
import { generateToken } from "../utils/generateToken.js"

function formatUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    city: user.city,
    role: user.role,
    avatar: user.avatar ?? null,
    createdAt: user.createdAt,
  }
}

export async function register(req, res, next) {
  try {
    const { name, email, password, city } = req.body

    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        error: "Name must be at least 2 characters",
        code: "VALIDATION_ERROR",
      })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({
        error: "Please enter a valid email address",
        code: "VALIDATION_ERROR",
      })
    }

    if (!password || password.length < 8) {
      return res.status(400).json({
        error: "Password must be at least 8 characters",
        code: "VALIDATION_ERROR",
      })
    }

    if (!city || !city.trim()) {
      return res.status(400).json({
        error: "City is required",
        code: "VALIDATION_ERROR",
      })
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return res.status(400).json({
        error: "Email already exists",
        code: "EMAIL_EXISTS",
      })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      city: city.trim(),
    })

    const token = generateToken(user)

    return res.status(201).json({
      user: formatUser(user),
      token,
    })
  } catch (error) {
    next(error)
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
        code: "VALIDATION_ERROR",
      })
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })

    if (!user) {
      return res.status(401).json({
        error: "Invalid email or password",
        code: "INVALID_CREDENTIALS",
      })
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
      return res.status(401).json({
        error: "Invalid email or password",
        code: "INVALID_CREDENTIALS",
      })
    }

    const token = generateToken(user)

    return res.status(200).json({
      user: formatUser(user),
      token,
    })
  } catch (error) {
    next(error)
  }
}

export async function getMe(req, res, next) {
  try {
    return res.status(200).json({
      id: req.user._id.toString(),
      name: req.user.name,
      email: req.user.email,
      city: req.user.city,
      role: req.user.role,
      avatar: req.user.avatar ?? null,
    })
  } catch (error) {
    next(error)
  }
}