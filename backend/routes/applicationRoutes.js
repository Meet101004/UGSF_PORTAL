import { Router } from 'express'
import { authMiddleware } from '../middlewares/authMiddleware.js'
import upload from '../middlewares/upload.js'
import {
  createApplication, getMyApplication,
  listMyAssignments, getMyAssignmentById,
  listMyAssignmentTasks, createMyAssignmentTask, updateMyAssignmentTask,
  studentListTasks, submitTaskWork
} from '../controllers/applicationController.js'

const router = Router()

// Student
router.post('/', authMiddleware, createApplication)
router.get('/me', authMiddleware, getMyApplication)

// Faculty
router.get('/faculty/assignments', authMiddleware, listMyAssignments)
router.get('/faculty/assignments/:id', authMiddleware, getMyAssignmentById)
router.get('/faculty/assignments/:id/tasks', authMiddleware, listMyAssignmentTasks)
router.post('/faculty/assignments/:id/tasks', authMiddleware, createMyAssignmentTask)
router.patch('/faculty/assignments/:id/tasks/:taskId', authMiddleware, updateMyAssignmentTask)

// Student tasks + submission (uses your memory-storage upload)
router.get('/student/assignments/:id/tasks', authMiddleware, studentListTasks)
router.post('/student/assignments/:id/tasks/:taskId/submissions',
  authMiddleware,
  upload.single('file'),
  submitTaskWork
)

export default router