import mongoose from 'mongoose'
const { Schema, model } = mongoose

const notificationSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String }, // e.g., 'assignment','interview','submission','message'
  message: { type: String, required: true },
  payload: { type: Schema.Types.Mixed }, // optional contextual object
  read: { type: Boolean, default: false }
}, { timestamps: true })

export default model('Notification', notificationSchema)