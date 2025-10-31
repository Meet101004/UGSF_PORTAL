import mongoose from 'mongoose'
const { Schema, model } = mongoose

const userSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['admin', 'hod', 'faculty', 'student'], required: true },
  department: { type: String }, // optional for HOD/Faculty
  imageUrl: { type: String }, // profile picture
  mustChangePassword: { type: Boolean, default: false }, // force change on first login (HOD/Faculty)
  metadata: { type: Schema.Types.Mixed } // extra profile data
}, { timestamps: true })

export default model('User', userSchema)