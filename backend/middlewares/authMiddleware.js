import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const JWT_SECRET = process.env.JWT_SECRET || 'devsecret'

// Authenticate JWT and attach req.user
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Please provide a valid authentication token' })
    }

    const token = authHeader.split(' ')[1]
    let decoded
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired token' })
    }

    // Your login signs { sub, role }, but also support { id }
    const userId = decoded.sub || decoded.id
    if (!userId) return res.status(401).json({ message: 'Invalid token payload' })

    const user = await User.findById(userId)
    if (!user) return res.status(401).json({ message: 'User not found or deleted' })

    // Attach normalized user info
    req.user = {
      sub: user._id.toString(),
      id: user._id.toString(), // for compatibility
      email: user.email,
      role: user.role,
      name: user.name
    }

    return next()
  } catch (error) {
    console.error('Authentication middleware error:', error)
    return res.status(500).json({ message: 'Server error in authentication' })
  }
}

// Restrict by roles
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Authentication required' })
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to perform this action' })
    }
    next()
  }
}

// Aliases to match existing imports in routes (backward compatibility)
export const authMiddleware = authenticate
export const requireRole = restrictTo