import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const JWT_SECRET = process.env.JWT_SECRET || 'devsecret'

export async function registerStudent(req, res) {
  const { name, email, password } = req.body
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email and password are required' })
  }

  const exists = await User.findOne({ email: email.toLowerCase().trim() })
  if (exists) return res.status(409).json({ error: 'email already registered' })

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash,
    role: 'student' // enforce student role
  })

  return res.status(201).json({ id: user._id, email: user.email, role: user.role })
}

export async function login(req, res) {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'email and password are required' })

  const user = await User.findOne({ email: email.toLowerCase().trim() })
  if (!user) return res.status(401).json({ error: 'invalid credentials' })

  const ok = await bcrypt.compare(password, user.passwordHash)
  if (!ok) return res.status(401).json({ error: 'invalid credentials' })

  const token = jwt.sign({ sub: user._id, role: user.role }, JWT_SECRET, { expiresIn: '8h' })
  return res.json({
    token,
    role: user.role,
    mustChangePassword: !!user.mustChangePassword,
    user: { id: user._id, name: user.name, email: user.email, imageUrl: user.imageUrl }
  })
}

// For first-time login (HOD/Faculty) and general password updates
export async function changePassword(req, res) {
  const { oldPassword, newPassword } = req.body
  if (!oldPassword) return res.status(400).json({ error: 'oldPassword required' })
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'newPassword must be at least 6 characters' })
  }

  const user = await User.findById(req.user.sub)
  if (!user) return res.status(404).json({ error: 'user not found' })

  const ok = await bcrypt.compare(oldPassword, user.passwordHash)
  if (!ok) return res.status(401).json({ error: 'old password incorrect' })

  user.passwordHash = await bcrypt.hash(newPassword, 10)
  user.mustChangePassword = false
  await user.save()

  return res.json({ success: true })
}