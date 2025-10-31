import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';
import crypto from 'crypto';

// Define separate buckets for different types of files
let farmerDocumentsBucket;
let profileImagesBucket;

// Initialize GridFS buckets
export const initGridFS = (db) => {
  try {
    // Create bucket for farmer documents
    farmerDocumentsBucket = new GridFSBucket(db, {
      bucketName: 'farmerDocuments'
    });
    console.log('GridFS bucket initialized with bucketName: farmerDocuments');
    
    // Create separate bucket for profile images
    profileImagesBucket = new GridFSBucket(db, {
      bucketName: 'profileImages'
    });
    console.log('GridFS bucket initialized with bucketName: profileImages');
    
    return { farmerDocumentsBucket, profileImagesBucket };
  } catch (error) {
    console.error('Error initializing GridFS buckets:', error);
    throw error;
  }
};

// Get the appropriate GridFS bucket based on file type
export const getGridFSBucket = (fileType = 'document') => {
  if (fileType === 'profileImage') {
    if (!profileImagesBucket) {
      if (!mongoose.connection.db) {
        throw new Error('MongoDB connection not established. Cannot initialize GridFS.');
      }
      console.log('Creating new profile images GridFS bucket');
      initGridFS(mongoose.connection.db);
      return profileImagesBucket;
    }
    return profileImagesBucket;
  } else {
    // Default to farmer documents bucket
    if (!farmerDocumentsBucket) {
      if (!mongoose.connection.db) {
        throw new Error('MongoDB connection not established. Cannot initialize GridFS.');
      }
      console.log('Creating new farmer documents GridFS bucket');
      initGridFS(mongoose.connection.db);
      return farmerDocumentsBucket;
    }
    return farmerDocumentsBucket;
  }
};

// Create a stream for uploading files to GridFS
export const createUploadStream = (filename, metadata) => {
  try {
    // Get appropriate bucket based on file type
    const bucketType = metadata.fileType || 'document';
    const bucket = getGridFSBucket(bucketType);
    
    console.log(`Creating upload stream for file: ${filename} in bucket: ${bucketType === 'profileImage' ? 'profileImages' : 'farmerDocuments'}`);
    return bucket.openUploadStream(filename, {
      metadata: {
        ...metadata,
        uploadDate: new Date()
      }
    });
  } catch (error) {
    console.error('Error creating upload stream:', error);
    throw error;
  }
};

// Create a stream for downloading files from GridFS
export const createDownloadStream = (fileId, fileType = 'document') => {
  try {
    const bucket = getGridFSBucket(fileType);
    const objectId = new mongoose.Types.ObjectId(fileId);
    console.log(`Creating download stream for file ID: ${objectId} from bucket: ${fileType === 'profileImage' ? 'profileImages' : 'farmerDocuments'}`);
    return bucket.openDownloadStream(objectId);
  } catch (error) {
    console.error('Error creating download stream:', error);
    throw error;
  }
};

// Delete a file from GridFS
export const deleteFile = (fileId, fileType = 'document') => {
  try {
    const bucket = getGridFSBucket(fileType);
    const objectId = new mongoose.Types.ObjectId(fileId);
    console.log(`Deleting file with ID: ${objectId} from bucket: ${fileType === 'profileImage' ? 'profileImages' : 'farmerDocuments'}`);
    return bucket.delete(objectId);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

// Generate a hash from a file buffer
export const generateFileHash = (buffer) => {
  try {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  } catch (error) {
    console.error('Error generating file hash:', error);
    throw error;
  }
};
