import mongoose from 'mongoose'
const { Schema, model } = mongoose

const fileSchema = new Schema({
  filename: { type: String },
  url: { type: String, required: true },
  mimetype: { type: String },
  size: { type: Number }
}, { _id: false })

const messageSchema = new Schema({
  text: { type: String, required: true },
  by: { type: String, enum: ['system', 'hod', 'faculty'], default: 'system' },
  at: { type: Date, default: Date.now },
  // NEW: keep HOD action details
  status: { type: String, enum: ['submitted', 'accepted', 'rejected'], default: undefined },
  note: { type: String, default: null }
}, { _id: false })

const projectSchema = new Schema({
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  startDate: { type: Date, default: null },
  endDate: { type: Date, default: null }
}, { _id: false })

const studentApplicationSchema = new Schema({
  student: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  assignedHod: { type: Schema.Types.ObjectId, ref: 'User' },
  assignedFaculty: { type: Schema.Types.ObjectId, ref: 'User', default: null },

  name: { type: String, required: true },
  fatherName: { type: String, required: true },
  email: { type: String, required: true },
  cgpa: { type: Number },
  fatherIncome: { type: Number },
  department: { type: String, required: true, enum: ['IT','CE','CSE','ME','CIVIL','EE','EC','AIML'] },

  status: { type: String, enum: ['submitted','accepted','rejected'], default: 'submitted' },
  finalResult: { type: String, enum: ['pending','pass','fail'], default: 'pending' },

  documents: {
    aadharCard: fileSchema,
    incomeCertificate: fileSchema,
    resume: fileSchema,
    resultsheet: fileSchema
  },

  project: projectSchema,
  messages: [messageSchema]
}, { timestamps: true })

export default model('StudentApplication', studentApplicationSchema)