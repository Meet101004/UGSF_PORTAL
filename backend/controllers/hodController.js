import Assignment from '../models/Assignment.js'
import Project from '../models/Project.js'
import StudentApplication from '../models/StudentApplication.js'
import Interview from '../models/Interview.js'
import User from '../models/User.js'

// GET /hod/assignments/options -> list students/faculties/projects not already assigned (active)
export async function getAssignmentOptions(req, res) {
  const me = await User.findById(req.user.sub).lean()
  if (!me || me.role !== 'hod') return res.status(403).json({ error: 'forbidden' })

  // Eligible apps in HOD department
  const apps = await StudentApplication.find({
    department: me.department,
    $or: [{ status: 'accepted' }, { finalResult: 'pass' }]
  }).select('student name email').lean()

  const studentIds = apps.map(a => a.student)
  // Active assignments for these students (department-scoped via apps)
  const activeAss = await Assignment.find({
    student: { $in: studentIds },
    status: 'active'
  }).select('student faculty projectTitle').lean()

  const assignedStudentIds = new Set(activeAss.map(a => String(a.student)))
  const assignedFacultyIds = new Set(activeAss.map(a => String(a.faculty)))
  const usedProjectTitles = new Set(activeAss.map(a => (a.projectTitle || '').trim()).filter(Boolean))

  // Students not yet assigned
  const students = apps
    .filter(a => !assignedStudentIds.has(String(a.student)))
    .map(a => ({ _id: a.student, name: a.name, email: a.email }))

  // Faculties in dept not currently assigned (active)
  const faculties = (await User.find({ role: 'faculty', department: me.department })
    .select('_id name email').sort({ name: 1 }).lean())
    .filter(f => !assignedFacultyIds.has(String(f._id)))

  // Projects in dept not used by an active assignment (by title)
  const projects = (await Project.find({ department: me.department, active: { $ne: false } })
    .select('_id title description docLink').sort({ createdAt: -1 }).lean())
    .filter(p => !usedProjectTitles.has((p.title || '').trim()))

  res.json({ students, faculties, projects })
}

// POST /hod/assignments -> create assignment
export async function createAssignment(req, res) {
  const me = await User.findById(req.user.sub).lean()
  if (!me || me.role !== 'hod') return res.status(403).json({ error: 'forbidden' })

  const { studentId, facultyId, projectId, projectTitle, projectDesc, startDate, endDate } = req.body || {}
  if (!studentId || !facultyId || (!projectId && !projectTitle)) {
    return res.status(400).json({ error: 'studentId, facultyId and project (id or title) are required' })
  }

  // Validate student eligibility in HOD dept
  const app = await StudentApplication.findOne({
    student: studentId,
    department: me.department,
    $or: [{ status: 'accepted' }, { finalResult: 'pass' }]
  })
  if (!app) return res.status(400).json({ error: 'student not eligible in your department' })

  // Student not already assigned (active)
  const existingForStudent = await Assignment.findOne({ student: studentId, status: 'active' }).lean()
  if (existingForStudent) return res.status(400).json({ error: 'student already has an active assignment' })

  // Faculty in dept and free
  const faculty = await User.findOne({ _id: facultyId, role: 'faculty', department: me.department }).lean()
  if (!faculty) return res.status(400).json({ error: 'invalid faculty for this department' })
  const facultyBusy = await Assignment.findOne({ faculty: facultyId, status: 'active' }).lean()
  if (facultyBusy) return res.status(400).json({ error: 'faculty already assigned on an active assignment' })

  // Project: either by id or custom title/desc
  let proj = null
  let finalTitle = (projectTitle || '').trim()
  let finalDesc = (projectDesc || '').trim()
  let finalLink = ''
  if (projectId) {
    proj = await Project.findOne({ _id: projectId, department: me.department }).lean()
    if (!proj) return res.status(400).json({ error: 'invalid project for this department' })
    finalTitle = proj.title
    finalDesc = proj.description || ''
    finalLink = proj.docLink || ''
  }
  if (!finalTitle) return res.status(400).json({ error: 'project title is required' })

  // Ensure project title isn’t in use by any active assignment
  const projectInUse = await Assignment.findOne({ projectTitle: finalTitle, status: 'active' }).lean()
  if (projectInUse) return res.status(400).json({ error: 'project already assigned on an active assignment' })

  // Dates validation
  if ((startDate && !endDate) || (!startDate && endDate)) {
    return res.status(400).json({ error: 'startDate and endDate must be provided together' })
  }
  let s = undefined, e = undefined
  if (startDate && endDate) {
    s = new Date(startDate); e = new Date(endDate)
    if (isNaN(s) || isNaN(e) || e <= s) return res.status(400).json({ error: 'invalid dates' })
  }

  // Create Assignment
  const created = await Assignment.create({
    student: app.student,
    project: proj ? proj._id : null,
    projectTitle: finalTitle,
    projectDesc: finalDesc,
    projectLink: finalLink,
    faculty: faculty._id,
    hod: me._id,
    startDate: s || new Date(),
    endDate: e || undefined,
    status: 'active'
  })

  // Update application assignment summary (for UI consistency)
  await StudentApplication.updateOne(
    { _id: app._id },
    {
      $set: {
        assignedFaculty: faculty._id,
        assignedProjectTitle: finalTitle,
        assignedProjectDescription: finalDesc,
        assignedProjectLink: finalLink,
        assignedAt: new Date()
      }
    },
    { strict: false }
  )

  res.status(201).json({ id: created._id })
}

// GET /hod/assignments?status=active|completed|all
export async function listAssignments(req, res) {
  const me = await User.findById(req.user.sub).lean()
  if (!me || me.role !== 'hod') return res.status(403).json({ error: 'forbidden' })

  // Department filter via student applications
  const apps = await StudentApplication.find({ department: me.department }).select('student').lean()
  const studentIds = apps.map(a => a.student)

  const { status = 'active' } = req.query
  const q = { student: { $in: studentIds } }
  if (status === 'active') q.status = 'active'
  if (status === 'completed') q.status = 'completed'

  const rows = await Assignment.find(q)
    .populate('student', 'name email')
    .populate('faculty', 'name email')
    .sort({ createdAt: -1 })
    .lean()

  res.json(rows)
}

// GET /hod/applications?status=pending|accepted|rejected
export async function listDepartmentApplications(req, res) {
  try {
    const me = await User.findById(req.user.sub).lean()
    if (!me || me.role !== 'hod') return res.status(403).json({ error: 'forbidden' })

    const f = String(req.query.status || '').toLowerCase()
    const q = { department: me.department }
    if (['pending', 'accepted', 'rejected'].includes(f)) q.status = f === 'pending' ? 'submitted' : f

    const rows = await StudentApplication.find(q)
      .select('student name email status department createdAt') // need student for per-row interview logic
      .sort({ createdAt: -1 })
      .lean()

    res.json(rows)
  } catch (e) {
    console.error('listDepartmentApplications', e)
    res.status(500).json({ error: 'server error' })
  }
}

// GET /hod/applications/:id
// export async function getApplicationForHod(req, res) {
//   const me = await User.findById(req.user.sub).lean()
//   if (!me || me.role !== 'hod') return res.status(403).json({ error: 'forbidden' })
//   const app = await StudentApplication.findOne({ _id: req.params.id, department: me.department }).lean()
//   if (!app) return res.status(404).json({ error: 'not found' })
//   res.json(app)
// }

// PATCH /hod/applications/:id/status   body: { status, note? }
export async function setApplicationStatus(req, res) {
  const me = await User.findById(req.user.sub).lean()
  if (!me || me.role !== 'hod') return res.status(403).json({ error: 'forbidden' })

  const { status, note } = req.body
  if (!['submitted', 'accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'invalid status' })
  }

  const app = await StudentApplication.findOne({ _id: req.params.id, department: me.department })
  if (!app) return res.status(404).json({ error: 'application not found' })

  app.status = status
  app.messages = app.messages || []
  app.messages.push({
    by: 'hod',
    status,
    note: note || null,
    text:
      status === 'accepted' ? 'HOD approved the application' :
      status === 'rejected' ? 'HOD rejected the application' :
      'HOD marked the application as pending',
    at: new Date()
  })
  await app.save()
  res.json({ id: app._id, status: app.status })
}

// GET /hod/interviews?upcoming=true&student=:id
export async function listInterviews(req, res) {
  const me = await User.findById(req.user.sub).lean()
  if (!me || me.role !== 'hod') return res.status(403).json({ error: 'forbidden' })

  const q = { hod: me._id }
  if (String(req.query.upcoming || '').toLowerCase() === 'true') {
    q.scheduledAt = { $gte: new Date() }
  }
  if (req.query.student) q.student = req.query.student

  const rows = await Interview.find(q)
    .populate('student', 'name email')
    .sort({ scheduledAt: 1 })
    .lean()

  res.json(rows)
}

// POST /hod/interviews
// body: { applicationId, scheduledAt, mode, meetingUrl?, location?, notes? }
export async function scheduleInterview(req, res) {
  const me = await User.findById(req.user.sub).lean()
  if (!me || me.role !== 'hod') return res.status(403).json({ error: 'forbidden' })

  const { applicationId, scheduledAt, mode, meetingUrl, location, notes } = req.body
  if (!applicationId || !scheduledAt || !mode) {
    return res.status(400).json({ error: 'applicationId, scheduledAt and mode are required' })
  }
  const when = new Date(scheduledAt)
  if (Number.isNaN(when.getTime()) || when.getTime() <= Date.now()) {
    return res.status(400).json({ error: 'scheduled time must be in the future' })
  }
  if (!['online', 'offline'].includes(mode)) return res.status(400).json({ error: 'invalid mode' })
  if (mode === 'online' && !(meetingUrl && /^https?:\/\//i.test(meetingUrl))) {
    return res.status(400).json({ error: 'valid meetingUrl is required for online interviews' })
  }
  if (mode === 'offline' && !String(location || '').trim()) {
    return res.status(400).json({ error: 'location is required for offline interviews' })
  }

  const app = await StudentApplication.findById(applicationId)
  if (!app || app.department !== me.department) return res.status(404).json({ error: 'application not found' })
  if (app.status !== 'accepted') return res.status(400).json({ error: 'interview can be scheduled only after acceptance' })

  const interview = await Interview.create({
    student: app.student,
    hod: me._id,
    scheduledAt: when,
    mode,
    meetingUrl: mode === 'online' ? meetingUrl : undefined,
    location: mode === 'offline' ? location : undefined,
    notes
  })

  app.messages.push({
    by: 'hod',
    text: `Interview scheduled (${mode}) on ${when.toLocaleString()}`,
    at: new Date()
  })
  await app.save()

  res.status(201).json(interview)
}

// PATCH /hod/interviews/:id/result   body: { result: 'pass'|'fail'|'pending', note? }
export async function setInterviewResult(req, res) {
  const me = await User.findById(req.user.sub).lean()
  if (!me || me.role !== 'hod') return res.status(403).json({ error: 'forbidden' })

  const { id } = req.params
  const { result, note } = req.body
  if (!['pass', 'fail', 'pending'].includes(result)) {
    return res.status(400).json({ error: 'invalid result' })
  }

  const interview = await Interview.findOne({ _id: id, hod: me._id })
  if (!interview) return res.status(404).json({ error: 'interview not found' })

  interview.result = result
  if (note) interview.notes = note
  interview.scoredBy = me._id
  interview.scoredAt = new Date()
  await interview.save()

  const app = await StudentApplication.findOne({ student: interview.student, department: me.department })
  if (app) {
    app.messages.push({
      by: 'hod',
      text: `Interview result: ${result.toUpperCase()}` + (note ? ` • Remark: ${note}` : ''),
      at: new Date(),
      status: result === 'fail' ? 'rejected' : 'accepted',
      note: note || null
    })
    // Optional finalResult field for quick lookup (if schema allows; else still fine in messages)
    app.set('finalResult', result, { strict: false })
    if (result === 'fail') app.status = 'rejected'
    await app.save()
  }

  res.json({ id: interview._id, result: interview.result })
}

// GET /hod/faculties
export async function listDepartmentFaculties(req, res) {
  try {
    const me = await User.findById(req.user.sub).lean()
    if (!me || me.role !== 'hod') return res.status(403).json({ error: 'forbidden' })
    const rows = await User.find({ role: 'faculty', department: me.department })
      .select('_id name email')
      .sort({ name: 1 })
      .lean()
    res.json(rows)
  } catch (e) {
    console.error('listDepartmentFaculties', e)
    res.status(500).json({ error: 'server error' })
  }
}

// PATCH /hod/applications/:id/assign
// body: { facultyId, projectTitle, projectDescription?, startAt?, endAt? }
export async function assignFacultyProject(req, res) {
  try {
    const me = await User.findById(req.user.sub).lean()
    if (!me || me.role !== 'hod') return res.status(403).json({ error: 'forbidden' })

    const { id } = req.params
    const { facultyId, projectTitle, projectDescription, startAt, endAt } = req.body || {}

    if (!facultyId || !projectTitle) {
      return res.status(400).json({ error: 'facultyId and projectTitle are required' })
    }

    const app = await StudentApplication.findOne({ _id: id, department: me.department })
    if (!app) return res.status(404).json({ error: 'application not found' })
    if (app.assignedFaculty) return res.status(400).json({ error: 'already assigned' })
    if (!(app.status === 'accepted' || app.finalResult === 'pass')) {
      return res.status(400).json({ error: 'student not eligible' })
    }

    const fac = await User.findOne({ _id: facultyId, role: 'faculty', department: me.department }).lean()
    if (!fac) return res.status(400).json({ error: 'invalid faculty' })

    // optional time window
    if ((startAt && !endAt) || (!startAt && endAt)) {
      return res.status(400).json({ error: 'startAt and endAt are required together' })
    }
    if (startAt && endAt) {
      const s = new Date(startAt), e = new Date(endAt)
      if (isNaN(s) || isNaN(e) || e <= s) return res.status(400).json({ error: 'invalid start/end' })
      app.startAt = s
      app.endAt = e
    }

    app.assignedFaculty = fac._id
    app.assignedProjectTitle = String(projectTitle).trim()
    app.assignedProjectDescription = String(projectDescription || '').trim()
    app.assignedAt = new Date()

    await app.save()
    res.json({ ok: true })
  } catch (e) {
    console.error('assignFacultyProject', e)
    res.status(500).json({ error: 'server error' })
  }
}

// ENHANCE: GET /hod/applications/:id -> return assignedFaculty populated + project shape
export async function getApplicationForHod(req, res) {
  const me = await User.findById(req.user.sub).lean()
  if (!me || me.role !== 'hod') return res.status(403).json({ error: 'forbidden' })

  const app = await StudentApplication.findOne({ _id: req.params.id, department: me.department })
    .populate('assignedFaculty', 'name email')
    .lean()
  if (!app) return res.status(404).json({ error: 'not found' })

  // Present project in the shape ApplicationView expects
  const project = {
    title: app.assignedProjectTitle || '',
    description: app.assignedProjectDescription || '',
    startDate: app.startAt || null,
    endDate: app.endAt || null
  }
  app.project = project

  res.json(app)
}