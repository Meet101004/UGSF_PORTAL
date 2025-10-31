import { Router } from 'express'
import { authenticate, restrictTo } from '../middlewares/authMiddleware.js'
import {
  listDepartmentApplications,
  getApplicationForHod,
  setApplicationStatus,
  listInterviews,
  scheduleInterview,
  setInterviewResult,
  getAssignmentOptions,
  createAssignment,
  listAssignments
} from '../controllers/hodController.js'

const router = Router()

// Applications
router.get('/applications', authenticate, restrictTo('hod'), listDepartmentApplications)
router.get('/applications/:id', authenticate, restrictTo('hod'), getApplicationForHod)
router.patch('/applications/:id/status', authenticate, restrictTo('hod'), setApplicationStatus)

// Interviews
router.get('/interviews', authenticate, restrictTo('hod'), listInterviews)
router.post('/interviews', authenticate, restrictTo('hod'), scheduleInterview)
router.patch('/interviews/:id/result', authenticate, restrictTo('hod'), setInterviewResult)

// Assignments
router.get('/assignments/options', authenticate, restrictTo('hod'), getAssignmentOptions)
router.post('/assignments', authenticate, restrictTo('hod'), createAssignment)
router.get('/assignments', authenticate, restrictTo('hod'), listAssignments)

export default router