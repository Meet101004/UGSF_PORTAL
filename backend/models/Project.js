import mongoose from 'mongoose'
const { Schema, model } = mongoose

const projectSchema = new Schema({
  department: { type: String, required: true, trim: true, enum: ['IT','CE','CSE','ME','CIVIL','EE','EC','AIML'] },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  whatToDo: { type: String, default: '' },
  techStack: { type: String, default: '' },

  // Either external link (Google Drive/URL) or uploaded file via GridFS
  docLink: { type: String, default: '' },
  docFileId: { type: Schema.Types.ObjectId, default: null },
  docFileName: { type: String, default: '' },
  docFileMime: { type: String, default: '' },

  assignedHod: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  active: { type: Boolean, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true })

export default model('Project', projectSchema)