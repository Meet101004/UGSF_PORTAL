import { Router } from 'express'
import multer from 'multer'
import { authenticate as authMiddleware, requireRole } from '../middlewares/authMiddleware.js'
import upload, { storeInGridFS } from '../middlewares/upload.js'
import {
  createUserByAdmin,
  listHods,
  createProjectByAdmin,
  listProjectsAdmin,
  assignProjectToHod,
  bulkUploadProjectsExcel, downloadProjectsTemplate
} from '../controllers/adminController.js'

const router = Router()

router.post('/users', authMiddleware, requireRole('admin'), createUserByAdmin)
// HODs
router.get('/hods', authMiddleware, requireRole('admin'), listHods)

// Projects
router.get('/projects', authMiddleware, requireRole('admin'), listProjectsAdmin)
router.post(
  '/projects',
  authMiddleware,
  requireRole('admin'),
  upload.single('docFile'),      // multer memory
  storeInGridFS,                 // saves to GridFS, sets req.file.id
  createProjectByAdmin
)
router.patch('/projects/:id/assign-hod', authMiddleware, requireRole('admin'), assignProjectToHod)

// Excel bulk import
const excelUpload = multer({ storage: multer.memoryStorage() })
router.post(
  '/projects/bulk-excel',
  authMiddleware,
  requireRole('admin'),
  excelUpload.single('excel'),
  bulkUploadProjectsExcel
)

router.get(
  '/projects/template',
  authMiddleware,
  requireRole('admin'),
  downloadProjectsTemplate
)

export default router