import { Router } from 'express'
import { registerStudent, login, changePassword } from '../controllers/authController.js'
import { authMiddleware } from '../middlewares/authMiddleware.js'

const router = Router()

// Student self-register
router.post('/register', registerStudent)

// Login
router.post('/login', login)

// Change password
router.post('/change-password', authMiddleware, changePassword)

export default router