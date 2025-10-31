import StudentApplication from '../models/StudentApplication.js'
// import User from '../models/User.js'
import Interview from '../models/Interview.js'
import User from '../models/User.js'
import Assignment from '../models/Assignment.js'
import mongoose from 'mongoose'
import fs from 'fs'
import path from 'path'

// Map to canonical department code (fixed set)
function normalizeDepartment(input) {
  const s = String(input || '').trim().toUpperCase()

  // exact allowed values
  const ALLOWED = ['IT', 'CE', 'CSE', 'ME', 'CIVIL', 'EE', 'EC', 'AIML']
  if (ALLOWED.includes(s)) return s

  // common aliases -> map to fixed codes
  if (['CS', 'COMP', 'COMPUTER', 'CSIT'].includes(s)) return 'CSE'
  if (['MECH', 'MECHANICAL'].includes(s)) return 'ME'
  if (['ELECTRICAL', 'E&EE'].includes(s)) return 'EE'
  if (['ELECTRONICS', 'ECE', 'E&CE'].includes(s)) return 'EC'
  if (['CIV', 'CIV ENGINEERING'].includes(s)) return 'CIVIL'
  if (['AI', 'ML', 'AI&ML', 'AI-ML'].includes(s)) return 'AIML'

  return '' // unknown -> invalid
}

async function findHodForDepartment(department) {
  return User.findOne({ role: 'hod', department }, { _id: 1 }).lean()
}

// POST /applications
export async function createApplication(req, res) {
  const studentId = req.user.sub
  const { name, fatherName, email, cgpa, fatherIncome, department } = req.body
  if (!name || !email) return res.status(400).json({ error: 'name and email are required' })
  if (!fatherName) return res.status(400).json({ error: 'fatherName is required' })

  const existing = await StudentApplication.findOne({ student: studentId })
  if (existing) {
    // Block new applications when one already exists
    if (existing.status === 'rejected') {
      return res.status(403).json({ error: 'application was rejected. You cannot submit a new application.' })
    }
    return res.status(409).json({ error: 'application already exists' })
  }

  // Use student's typed department (normalized). Return 400 if unknown.
  const deptResolved = normalizeDepartment(department)
  if (!deptResolved) {
    return res.status(400).json({
      error: 'invalid department',
      allowed: ['IT','CE','CSE','ME','CIVIL','EE','EC','AIML']
    })
  }
  const hod = await findHodForDepartment(deptResolved)
  if (!hod) return res.status(404).json({ error: `No HOD found for department ${deptResolved}` })

  const app = await StudentApplication.create({
    student: studentId,
    name: name.trim(),
    fatherName: fatherName.trim(),
    email: String(email || '').toLowerCase().trim(),
    cgpa,
    fatherIncome,
    department: deptResolved,
    assignedHod: hod._id,
    status: 'submitted',
    messages: [{ text: 'Application submitted', by: 'system' }]
  })

  return res.status(201).json({
    id: app._id,
    status: app.status,
    department: app.department,
    assignedHod: app.assignedHod
  })
}

// GET /applications/me
export async function getMyApplication(req, res) {
  try {
    const uid = req.user.sub
    const app = await StudentApplication.findOne({ student: uid }).lean()
    if (!app) return res.json({ exists: false })

    // Upcoming interview (keep your existing logic if present)
    let nextInterview = null
    try {
      const next = await Interview.findOne({
        student: uid,
        result: 'pending',
        scheduledAt: { $gte: new Date() }
      }).sort({ scheduledAt: 1 }).lean()
      if (next) {
        nextInterview = {
          scheduledAt: next.scheduledAt,
          mode: next.mode,
          meetingUrl: next.meetingUrl || '',
          location: next.location || ''
        }
      }
    } catch {}

    // Find active assignment
    const activeAssign = await Assignment.findOne({ student: uid, status: 'active' })
      .populate('faculty', 'name email')
      .populate('project', 'docLink')
      .lean()

    // Prefer Assignment data; fallback to fields stored on application (if you already save them there)
    const assignedProjectTitle =
      activeAssign?.projectTitle || app.assignedProjectTitle || ''
    const assignedProjectDescription =
      activeAssign?.projectDesc || app.assignedProjectDescription || ''
    const assignedAt =
      activeAssign?.createdAt || app.assignedAt || null
    const assignedFaculty = activeAssign?.faculty
      ? { _id: activeAssign.faculty._id, name: activeAssign.faculty.name, email: activeAssign.faculty.email }
      : null
    const assignedProjectLink =
      activeAssign?.projectLink || activeAssign?.project?.docLink || app.assignedProjectLink || ''
    const assignedAssignmentId = activeAssign?._id || null

    res.json({
      exists: true,
      id: app._id,
      name: app.name,
      email: app.email,
      department: app.department,
      status: app.status,
      lastUpdate: app.updatedAt,
      message: app.message || '',
      documents: app.documents || {},
      nextInterview,

      // NEW: project assignment fields
      assignedProjectTitle,
      assignedProjectDescription,
      assignedProjectLink,
      assignedAt,
      assignedFaculty,
      assignedAssignmentId // NEW
    })
  } catch (e) {
    console.error('getMyApplication', e)
    res.status(500).json({ error: 'server error' })
  }
}

// PATCH /applications/:id/documents/:type
export async function uploadApplicationDocument(req, res) {
  const { id, type } = req.params
  const allowed = ['aadharCard', 'incomeCertificate', 'resume', 'resultsheet']
  if (!allowed.includes(type)) return res.status(400).json({ error: 'invalid document type' })

  const fileId = req.file?.id
  const url = req.file?.url || (fileId ? `/files/${fileId}` : null)
  if (!url) return res.status(400).json({ error: 'upload failed' })

  // Enforce status rules
  const app = await StudentApplication.findOne({ _id: id, student: req.user.sub })
  if (!app) return res.status(404).json({ error: 'application not found' })
  if (app.status === 'rejected') {
    return res.status(403).json({ error: 'cannot upload documents to a rejected application' })
  }
  if (app.status !== 'submitted') {
    return res.status(403).json({ error: 'uploads allowed only when application is pending' })
  }

  app.documents = app.documents || {}
  app.documents[type] = {
    url,
    filename: req.file?.filename,
    mimetype: req.file?.mimetype,
    size: req.file?.size
  }
  await app.save()

  return res.json({ success: true, documents: app.documents })
}

// Allow student to update their application while HOD-marked pending
export async function updateMyApplication(req, res) {
  try {
    const uid = req.user.sub
    const app = await StudentApplication.findOne({ student: uid })
    if (!app) return res.status(404).json({ error: 'application not found' })

    // Only allow updates when status is submitted and HOD has touched it
    const messages = app.messages || []
    const lastHod = messages.filter(m => m.by === 'hod').slice(-1)[0] || null
    const hodMarkedPending = app.status === 'submitted' && !!lastHod
    if (!hodMarkedPending) {
      return res.status(400).json({ error: 'updates allowed only when HOD marked pending' })
    }

    const { name, email, fatherName, cgpa, fatherIncome, department } = req.body || {}
    if (name !== undefined) app.name = String(name).trim()
    if (email !== undefined) app.email = String(email).trim()
    if (fatherName !== undefined) app.fatherName = String(fatherName).trim()
    if (cgpa !== undefined && cgpa !== null && cgpa !== '') app.cgpa = Number(cgpa)
    if (fatherIncome !== undefined && fatherIncome !== null && fatherIncome !== '') app.fatherIncome = Number(fatherIncome)
    if (department !== undefined) app.department = String(department).trim()

    await app.save()
    res.json({ ok: true })
  } catch (e) {
    console.error('updateMyApplication', e)
    res.status(500).json({ error: 'server error' })
  }
}

export async function listMyAssignments(req, res) {
  try {
    const me = await User.findById(req.user.sub).lean()
    if (!me || me.role?.toLowerCase() !== 'faculty') return res.status(403).json({ error: 'forbidden' })

    const { status = 'active' } = req.query
    const q = { faculty: me._id }
    if (status === 'active') q.status = 'active'
    if (status === 'completed') q.status = 'completed'

    const rows = await Assignment.find(q)
      .populate('student', 'name email')
      .populate('project', 'docLink title')
      .sort({ createdAt: -1 })
      .lean()

    res.json(rows.map(r => ({
      _id: r._id,
      student: r.student ? { _id: r.student._id, name: r.student.name, email: r.student.email } : null,
      projectTitle: r.projectTitle,
      projectDesc: r.projectDesc || '',
      projectLink: r.projectLink || r.project?.docLink || '',
      startDate: r.startDate || null,
      endDate: r.endDate || null,
      status: r.status
    })))
  } catch (e) {
    console.error('listMyAssignments', e)
    res.status(500).json({ error: 'server error' })
  }
}

export async function getMyAssignmentById(req, res) {
  try {
    const me = await User.findById(req.user.sub).lean()
    if (!me || me.role?.toLowerCase() !== 'faculty') return res.status(403).json({ error: 'forbidden' })

    const a = await Assignment.findOne({ _id: req.params.id, faculty: me._id })
      .populate('student', 'name email')
      .populate('project', 'docLink title description')
      .lean()
    if (!a) return res.status(404).json({ error: 'not found' })

    res.json({
      _id: a._id,
      student: a.student ? { _id: a.student._id, name: a.student.name, email: a.student.email } : null,
      projectTitle: a.projectTitle,
      projectDesc: a.projectDesc || a.project?.description || '',
      projectLink: a.projectLink || a.project?.docLink || '',
      startDate: a.startDate || null,
      endDate: a.endDate || null,
      status: a.status
    })
  } catch (e) {
    console.error('getMyAssignmentById', e)
    res.status(500).json({ error: 'server error' })
  }
}

// List tasks (with submissions) for an assignment owned by the logged-in faculty
export async function listMyAssignmentTasks(req, res) {
  try {
    const me = await User.findById(req.user.sub).lean()
    if (!me || String(me.role).toLowerCase() !== 'faculty') return res.status(403).json({ error: 'forbidden' })

    const a = await Assignment.findOne({ _id: req.params.id, faculty: me._id }).lean()
    if (!a) return res.status(404).json({ error: 'not found' })

    const tasks = (a.tasks || []).slice().sort((x, y) => {
      const dx = x.dueDate ? new Date(x.dueDate).getTime() : 0
      const dy = y.dueDate ? new Date(y.dueDate).getTime() : 0
      return dx - dy
    })
    // tasks already contain submissions sub-array
    res.json(tasks)
  } catch (e) {
    console.error('listMyAssignmentTasks', e)
    res.status(500).json({ error: 'server error' })
  }
}

export async function createMyAssignmentTask(req, res) {
  try {
    const me = await User.findById(req.user.sub).lean()
    if (!me || String(me.role).toLowerCase() !== 'faculty') return res.status(403).json({ error: 'forbidden' })

    console.log('createMyAssignmentTask params:', req.params)
    console.log('createMyAssignmentTask body:', req.body)

    const { title, details, dueDate } = req.body || {}
    const cleanTitle = String(title || '').trim()
    if (!cleanTitle) return res.status(400).json({ error: 'title is required' })

    // validate assignment id
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'invalid assignment id' })
    }

    const a = await Assignment.findOne({ _id: req.params.id, faculty: me._id }).lean()
    if (!a) return res.status(404).json({ error: 'assignment not found for this faculty' })

    const newTask = {
      _id: new mongoose.Types.ObjectId(),
      title: cleanTitle,
      details: String(details || ''),
      dueDate: dueDate ? new Date(dueDate) : undefined,
      status: 'pending',
      createdAt: new Date()
    }

    await Assignment.updateOne({ _id: a._id }, { $push: { tasks: newTask } })
    res.status(201).json(newTask)
  } catch (e) {
    console.error('createMyAssignmentTask error:', e)
    res.status(500).json({ error: 'server error' })
  }
}

export async function updateMyAssignmentTask(req, res) {
  try {
    const me = await User.findById(req.user.sub).lean()
    if (!me || String(me.role).toLowerCase() !== 'faculty') return res.status(403).json({ error: 'forbidden' })

    const { id, taskId } = req.params
    const { status, title, details, dueDate } = req.body || {}

    const a = await Assignment.findOne({ _id: id, faculty: me._id })
    if (!a) return res.status(404).json({ error: 'not found' })

    const t = a.tasks.id(taskId)
    if (!t) return res.status(404).json({ error: 'task not found' })

    if (typeof title === 'string') t.title = title.trim()
    if (typeof details === 'string') t.details = details
    if (dueDate !== undefined) t.dueDate = dueDate ? new Date(dueDate) : undefined
    if (status === 'completed' && t.status !== 'completed') {
      t.status = 'completed'
      t.completedAt = new Date()
    } else if (status === 'pending' && t.status !== 'pending') {
      t.status = 'pending'
      t.completedAt = null
    }

    await a.save()
    res.json(t)
  } catch (e) {
    console.error('updateMyAssignmentTask', e)
    res.status(500).json({ error: 'server error' })
  }
}

export async function studentListTasks(req, res) {
  try {
    const uid = req.user.sub
    const a = await Assignment.findOne({ _id: req.params.id, student: uid }).lean()
    if (!a) return res.status(404).json({ error: 'not found' })
    const tasks = (a.tasks || []).slice().sort((x, y) => {
      const dx = x.dueDate ? new Date(x.dueDate).getTime() : 0
      const dy = y.dueDate ? new Date(y.dueDate).getTime() : 0
      return dx - dy
    })
    res.json(tasks)
  } catch (e) {
    console.error('studentListTasks', e)
    res.status(500).json({ error: 'server error' })
  }
}

export async function submitTaskWork(req, res) {
  try {
    const uid = req.user.sub
    const { id, taskId } = req.params
    const { note, link } = req.body || {}

    const a = await Assignment.findOne({ _id: id, student: uid })
    if (!a) return res.status(404).json({ error: 'not found' })
    const t = a.tasks.id(taskId)
    if (!t) return res.status(404).json({ error: 'task not found' })

    // NEW: block uploads on completed tasks
    if (t.status === 'completed') {
      return res.status(400).json({ error: 'task already completed; ask faculty to reopen' })
    }

    // Save memory file buffer to disk under /uploads/submissions/<assignmentId>/
    let fileUrl = '', filename = '', mimetype = '', size = 0
    if (req.file && req.file.buffer) {
      const uploadsRoot = path.join(process.cwd(), 'uploads', 'submissions', String(id))
      if (!fs.existsSync(uploadsRoot)) fs.mkdirSync(uploadsRoot, { recursive: true })

      const safeName = String(req.file.originalname || 'file')
        .replace(/[^a-zA-Z0-9._-]/g, '_')
      const storedName = `${Date.now()}_${safeName}`
      const fullPath = path.join(uploadsRoot, storedName)

      fs.writeFileSync(fullPath, req.file.buffer)
      // Absolute URL so links work in faculty UI
      fileUrl = `${req.protocol}://${req.get('host')}/uploads/submissions/${id}/${storedName}`
      filename = req.file.originalname || storedName
      mimetype = req.file.mimetype || ''
      size = req.file.size || fs.statSync(fullPath).size
    }

    t.submissions.push({
      note: String(note || ''),
      link: String(link || ''),
      fileUrl,
      filename,
      mimetype,
      size,
      submittedAt: new Date()
    })

    await a.save()
    return res.status(201).json(t.submissions[t.submissions.length - 1])
  } catch (e) {
    console.error('submitTaskWork', e)
    res.status(500).json({ error: 'server error' })
  }
}