import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import mongoose from 'mongoose';
import fs from 'fs';

// Create temporary memory storage
const storage = multer.memoryStorage();

// Create multer instance
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|jpeg|jpg|png|gif|webp/;  // allow PDF too
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype.toLowerCase());
    
    if (extname && mimetype) return cb(null, true);
    cb(new Error('Only image/PDF files are allowed'));
  }
});

// Create GridFS helper middleware
export const storeInGridFS = async (req, res, next) => {
  if (!req.file) return next();
  
  try {
    // Generate a random filename
    const filename = crypto.randomBytes(16).toString('hex') + path.extname(req.file.originalname);
    
    // Connect to GridFS
    const db = mongoose.connection.db;
    const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'uploads' });
    
    // Create a buffer from the file
    const buffer = req.file.buffer;
    
    // Create upload stream with file ID tracking
    let fileId;
    const uploadStream = bucket.openUploadStream(filename, {
      contentType: req.file.mimetype,
      metadata: {
        originalName: req.file.originalname,
        uploadedBy: req.user?.id || 'anonymous'
      }
    });
    
    // Store the ID when it's generated
    fileId = uploadStream.id;
    
    // Write the file to GridFS
    uploadStream.write(buffer);
    uploadStream.end();
    
    // Wait for the upload to finish - fixed event handler
    uploadStream.on('finish', () => {
      // Attach file info to request object using the previously stored ID
      req.file.id = fileId;
      req.file.filename = filename;
      next();
    });
    
    uploadStream.on('error', (error) => {
      console.error("GridFS upload error:", error);
      next(error);
    });
  } catch (error) {
    console.error("Error in storeInGridFS:", error);
    next(error);
  }
};

// Local docs folder
const docsRoot = path.join(process.cwd(), 'uploads', 'docs')
fs.mkdirSync(docsRoot, { recursive: true })

// Disk storage for project docs (pdf/doc)
const storageDocs = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, docsRoot),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '_')
    cb(null, `${base}_${Date.now()}${ext}`)
  }
})
export const uploadDoc = multer({
  storage: storageDocs,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
})

// Memory storage for Excel
export const uploadExcel = multer({ storage: multer.memoryStorage() });

// Export a modified upload middleware
export default {
  single: (fieldName) => [upload.single(fieldName), storeInGridFS]
};