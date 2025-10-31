import mongoose from 'mongoose'
const { Schema, model } = mongoose

const interviewSchema = new Schema({
  student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  hod: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  scheduledAt: { type: Date, required: true },
  mode: { type: String, enum: ['online', 'offline'], default: 'online' },
  meetingUrl: { type: String }, // NEW: link for online mode
  location: { type: String },   // for offline
  result: { type: String, enum: ['pending', 'pass', 'fail'], default: 'pending' },
  notes: { type: String },
  scoredBy: { type: Schema.Types.ObjectId, ref: 'User' },
  scoredAt: { type: Date }
}, { timestamps: true })

export default model('Interview', interviewSchema)