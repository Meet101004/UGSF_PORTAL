import mongoose from 'mongoose'
const { Schema, model } = mongoose

const submissionSchema = new Schema({
  task: { type: Schema.Types.ObjectId, ref: 'WeeklyTask', required: true },
  student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  files: [{ filename: String, url: String }], // store uploaded files meta or links
  text: { type: String },
  submittedAt: { type: Date, default: Date.now },
  marks: { type: Number },
  feedback: { type: String },
  gradedBy: { type: Schema.Types.ObjectId, ref: 'User' } // faculty who graded
}, { timestamps: true })

submissionSchema.index({ task: 1, student: 1 }, { unique: true }) // one submission per task per student by default

export default model('Submission', submissionSchema)