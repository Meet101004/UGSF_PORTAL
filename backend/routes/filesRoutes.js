import { Router } from 'express'
import mongoose from 'mongoose'

const router = Router()

router.get('/:id', async (req, res) => {
  try {
    const _id = new mongoose.Types.ObjectId(req.params.id)
    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' })
    const files = await bucket.find({ _id }).toArray()
    if (!files?.length) return res.status(404).json({ error: 'file not found' })
    const meta = files[0]
    if (meta.contentType) res.setHeader('Content-Type', meta.contentType)
    res.setHeader('Content-Disposition', `inline; filename="${meta.filename}"`)
    bucket.openDownloadStream(_id).on('error', () => res.status(404).end()).pipe(res)
  } catch {
    res.status(400).json({ error: 'invalid file id' })
  }
})

export default router