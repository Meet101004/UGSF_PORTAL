import { Router } from 'express'
import { authMiddleware } from '../middlewares/authMiddleware.js'
import upload from '../middlewares/upload.js'
import User from '../models/User.js'

const router = Router()

// Upload/replace profile image
router.patch('/me/profile-image',
  authMiddleware,
  upload.single('profileImage'),
  async (req, res, next) => {
    try {
      if (!req.file?.id) return res.status(400).json({ error: 'no file uploaded' })
      const imageUrl = req.file.url || `/files/${req.file.id}`
      await User.findByIdAndUpdate(req.user.sub, { imageUrl })
      return res.json({ imageUrl })
    } catch (err) { next(err) }
  }
)

export default router