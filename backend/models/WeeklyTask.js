import mongoose from 'mongoose'
const { Schema, model } = mongoose

const weeklyTaskSchema = new Schema({
  assignment: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true },
  weekNumber: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String },
  deadline: { type: Date, required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' }, // usually faculty
  maxMarks: { type: Number, default: 0 }
}, { timestamps: true })

weeklyTaskSchema.index({ assignment: 1, weekNumber: 1 }, { unique: true })

export default model('WeeklyTask', weeklyTaskSchema)