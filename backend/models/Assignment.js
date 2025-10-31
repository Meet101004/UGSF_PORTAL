import mongoose from 'mongoose'
const { Schema, model } = mongoose

const submissionSchema = new Schema({
  note: { type: String, default: '' },
  link: { type: String, default: '' },
  fileUrl: { type: String, default: '' },
  filename: { type: String, default: '' },
  mimetype: { type: String, default: '' },
  size: { type: Number, default: 0 },
  submittedAt: { type: Date, default: Date.now }
}, { _id: true })

const taskSchema = new Schema({
  title: { type: String, required: true, trim: true },
  details: { type: String, default: '' },
  dueDate: { type: Date },
  status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null },
  submissions: { type: [submissionSchema], default: [] }
}, { _id: true })

const assignmentSchema = new Schema({
  student: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // student user id
  faculty: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // faculty user id
  hod: { type: Schema.Types.ObjectId, ref: 'User', required: true },     // hod user id
  project: { type: Schema.Types.ObjectId, ref: 'Project', default: null }, // optional ref to Project
  projectTitle: { type: String, required: true, trim: true },
  projectDesc: { type: String, default: '' },
  projectLink: { type: String, default: '' }, // PDF/Drive or /files/:id
  startDate: { type: Date },
  endDate: { type: Date },
  status: { type: String, enum: ['active', 'completed'], default: 'active' },
  // tasks assigned by faculty to this student for this assignment
  tasks: { type: [taskSchema], default: [] }
}, { timestamps: true })

export default model('Assignment', assignmentSchema)