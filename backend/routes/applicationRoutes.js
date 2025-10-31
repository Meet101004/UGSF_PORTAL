import { Router } from 'express'
import { authMiddleware } from '../middlewares/authMiddleware.js'
import {
  createApplication,
  getMyApplication,
  listMyAssignments,
  getMyAssignmentById
} from '../controllers/applicationController.js'
 
const router = Router()
 
// Student creates application
router.post('/', authMiddleware, createApplication)

// Student views their application
router.get('/me', authMiddleware, getMyApplication)

// Faculty: list and view own assignments
router.get('/faculty/assignments', authMiddleware, listMyAssignments)
router.get('/faculty/assignments/:id', authMiddleware, getMyAssignmentById)
 
export default router