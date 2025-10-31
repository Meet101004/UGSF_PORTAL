import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import * as xlsx from 'xlsx'
import User from '../models/User.js'
import StudentApplication from '../models/StudentApplication.js'
import Project from '../models/Project.js'

const ALLOWED_DEPTS = ['IT','CE','CSE','ME','CIVIL','EE','EC','AIML']
const isHttpUrl = s => /^https?:\/\//i.test(String(s||'').trim())

export async function createUserByAdmin(req, res) {
  const { name, email, password, role, department } = req.body
  if (!name || !email || !role) return res.status(400).json({ error: 'missing fields' })
  if (!['hod', 'faculty'].includes(role)) return res.status(400).json({ error: 'invalid role' })

  const normalizedEmail = email.toLowerCase().trim()
  const exists = await User.findOne({ email: normalizedEmail })
  if (exists) return res.status(409).json({ error: 'email exists' })

  // Default to the part before '@' if password not provided
  const emailLocal = normalizedEmail.split('@')[0]
  const initialPassword = (password && password.trim()) || emailLocal
  if (!initialPassword) return res.status(400).json({ error: 'unable to derive initial password from email' })

  const passwordHash = await bcrypt.hash(initialPassword, 10)

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    role,
    department,
    passwordHash,
    mustChangePassword: true // force change on first login
  })

  return res.status(201).json({ id: user._id, role: user.role, mustChangePassword: user.mustChangePassword })
}

export async function getApplicationStats(req, res) {
  const [submitted, accepted, rejected] = await Promise.all([
    StudentApplication.countDocuments({ status: 'submitted' }),
    StudentApplication.countDocuments({ status: 'accepted' }),
    StudentApplication.countDocuments({ status: 'rejected' })
  ])
  return res.json({
    total: submitted + accepted + rejected,
    accepted,
    rejected
  })
}

// List HODs for selection
export async function listHods(_req, res) {
  const rows = await User.find({ role: 'hod' })
    .select('_id name email department')
    .sort({ name: 1 })
    .lean()
  res.json(rows)
}

// Create single project (supports Drive/URL or uploaded GridFS file)
export async function createProjectByAdmin(req, res) {
  try {
    const { title, description, whatToDo, techStack, department, hodId, docLink } = req.body || {}
    if (!title || !department) return res.status(400).json({ error: 'title and department are required' })

    let finalDocLink = ''
    let docFileId = null, docFileName = '', docFileMime = ''
    if (req.file?.id) {
      docFileId = req.file.id
      docFileName = req.file.originalname
      docFileMime = req.file.mimetype
      finalDocLink = `/files/${docFileId}`
    } else if (docLink && /^https?:\/\//i.test(docLink)) {
      finalDocLink = String(docLink).trim()
    }

    let assignedHod = null
    if (hodId) {
      const hod = await User.findOne({ _id: hodId, role: 'hod' }).lean()
      if (!hod) return res.status(400).json({ error: 'invalid HOD' })
      if (hod.department !== department) return res.status(400).json({ error: 'HOD and project department mismatch' })
      assignedHod = hod._id
    }

    const createdBy = req.user?.sub || req.user?.id || new mongoose.Types.ObjectId()
    const proj = await Project.create({
      department,
      title: title.trim(),
      description: (description || '').trim(),
      whatToDo: (whatToDo || '').trim(),
      techStack: (techStack || '').trim(),
      docLink: finalDocLink,
      docFileId,
      docFileName,
      docFileMime,
      assignedHod,
      createdBy
    })

    res.status(201).json({ id: proj._id, docUrl: finalDocLink })
  } catch (e) {
    console.error('createProjectByAdmin', e)
    res.status(500).json({ error: 'server error' })
  }
}

// List projects (optional ?department=IT)
export async function listProjectsAdmin(req, res) {
  try {
    const q = {}
    if (req.query.department) q.department = req.query.department
    const rows = await Project.find(q)
      .populate('assignedHod', 'name email department')
      .sort({ createdAt: -1 })
      .lean()
    res.json(rows)
  } catch (e) {
    console.error('listProjectsAdmin', e)
    res.status(500).json({ error: 'server error' })
  }
}

// Assign or change HOD for a project
export async function assignProjectToHod(req, res) {
  try {
    const { id } = req.params
    const { hodId } = req.body || {}
    if (!hodId) return res.status(400).json({ error: 'hodId required' })
    const hod = await User.findOne({ _id: hodId, role: 'hod' }).lean()
    if (!hod) return res.status(400).json({ error: 'invalid HOD' })

    const proj = await Project.findById(id)
    if (!proj) return res.status(404).json({ error: 'project not found' })
    if (proj.department !== hod.department) return res.status(400).json({ error: 'department mismatch' })

    proj.assignedHod = hod._id
    await proj.save()
    res.json({ id: proj._id, assignedHod: hod._id })
  } catch (e) {
    console.error('assignProjectToHod', e)
    res.status(500).json({ error: 'server error' })
  }
}

// Download template for bulk project upload
export async function downloadProjectsTemplate(_req, res) {
  const wb = xlsx.utils.book_new()
  const instructions = [
    ['UGSF Projects Import - Instructions'],
    ['Required columns: Title, Department'],
    ['Optional columns: Description, WhatToDo, TechStack, DocUrl'],
    ['Department must be one of: ' + ALLOWED_DEPTS.join(', ')],
    ['DocUrl must start with http(s) if provided'],
  ]
  const sh1 = xlsx.utils.aoa_to_sheet(instructions)
  sh1['!merges'] = [{ s:{r:0,c:0}, e:{r:0,c:5} }]
  xlsx.utils.book_append_sheet(wb, sh1, 'Instructions')

  const header = ['Title','Description','WhatToDo','TechStack','DocUrl','Department']
  const example = ['UGSF Portal','Scholarship portal','Build CRUD and auth','React, Node','https://drive.google.com/..','IT']
  const sh2 = xlsx.utils.aoa_to_sheet([header, example])
  xlsx.utils.book_append_sheet(wb, sh2, 'ProjectsTemplate')

  const buf = xlsx.write(wb, { bookType: 'xlsx', type: 'buffer' })
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', 'attachment; filename="UGSF_Projects_Template.xlsx"')
  res.send(buf)
}

// Bulk create via Excel: columns Title, Description, WhatToDo, TechStack, DocUrl, Department
export async function bulkUploadProjectsExcel(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: 'Select a .xlsx file in the input.' })
    const mimeOk = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/octet-stream' // some browsers send this
    ].includes(req.file.mimetype)
    if (!mimeOk && !req.file.originalname.toLowerCase().endsWith('.xlsx')) {
      return res.status(400).json({ error: 'Invalid file. Please upload a .xlsx Excel file.' })
    }

    const { hodId } = req.body || {}
    let defaultHod = null
    if (hodId) {
      defaultHod = await User.findOne({ _id: hodId, role: 'hod' }).lean()
      if (!defaultHod) return res.status(400).json({ error: 'Invalid HOD selected.' })
    }

    let wb
    try {
      wb = xlsx.read(req.file.buffer, { type: 'buffer' })
    } catch {
      return res.status(400).json({ error: 'Cannot read Excel. Ensure it is a valid .xlsx file.' })
    }

    const sheet = wb.Sheets[wb.SheetNames[0]]
    if (!sheet) return res.status(400).json({ error: 'Excel has no sheets. Use the provided template.' })

    const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' })
    if (!rows.length) return res.status(400).json({ error: 'Excel is empty. Add headers and at least one row.' })

    const required = ['Title','Department']
    const missing = required.filter(h => !(h in rows[0]))
    if (missing.length) {
      return res.status(400).json({
        error: `Missing required column(s): ${missing.join(', ')}.`,
        template: '/admin/projects/template'
      })
    }

    const toInsert = []
    const errors = []
    let i = 2 // header is row 1
    for (const r of rows) {
      const title = String(r.Title || '').trim()
      const department = String(r.Department || '').trim().toUpperCase()
      const description = String(r.Description || '').trim()
      const whatToDo = String(r.WhatToDo || '').trim()
      const techStack = String(r.TechStack || '').trim()
      const docUrl = String(r.DocUrl || '').trim()

      const issues = []
      if (!title) issues.push('Title is required')
      if (!department) issues.push('Department is required')
      else if (!ALLOWED_DEPTS.includes(department)) issues.push(`Department must be one of: ${ALLOWED_DEPTS.join(', ')}`)
      if (docUrl && !isHttpUrl(docUrl)) issues.push('DocUrl must start with http:// or https://')
      if (defaultHod && defaultHod.department !== department) {
        issues.push(`Default HOD is ${defaultHod.department}, but row dept is ${department}`)
      }

      if (issues.length) {
        errors.push({ row: i, issues })
      } else {
        toInsert.push({
          department, title, description, whatToDo, techStack,
          docLink: docUrl || '',
          assignedHod: defaultHod ? defaultHod._id : null,
          createdBy: req.user?.sub || new mongoose.Types.ObjectId()
        })
      }
      i++
    }

    if (errors.length) {
      return res.status(400).json({
        error: 'Validation failed. Fix the errors and try again.',
        errors,
        template: '/admin/projects/template'
      })
    }

    if (!toInsert.length) return res.status(400).json({ error: 'No valid rows to import.' })

    await Project.insertMany(toInsert)
    res.json({ created: toInsert.length })
  } catch (e) {
    console.error('bulkUploadProjectsExcel', e)
    res.status(500).json({ error: 'Server error while importing Excel.' })
  }
}