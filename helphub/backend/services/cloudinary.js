/**
 * Cloudinary Upload Service
 * Handles image uploads to Cloudinary
 */

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'helphub/campaigns',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    max_file_size: 5 * 1024 * 1024, // 5MB
    transformation: [{ width: 1200, height: 800, crop: 'limit' }],
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

/**
 * Upload a file to Cloudinary
 * @param {Object} file - The file object from multer
 * @returns {Promise<string>} - The URL of the uploaded file
 */
const uploadFile = async (file) => {
  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: 'helphub/campaigns',
      resource_type: 'auto',
    });
    return result.secure_url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};

/**
 * Delete a file from Cloudinary
 * @param {string} url - The URL of the file to delete
 */
const deleteFile = async (url) => {
  try {
    const publicId = extractPublicId(url);
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
  }
};

/**
 * Extract public ID from Cloudinary URL
 */
const extractPublicId = (url) => {
  const parts = url.split('/');
  const filename = parts[parts.length - 1];
  const publicId = filename.split('.')[0];
  
  // Reconstruct with folder path
  const folderIndex = parts.findIndex(p => p === 'helphub');
  if (folderIndex !== -1) {
    return parts.slice(folderIndex, -1).join('/') + '/' + publicId;
  }
  
  return publicId;
};

module.exports = {
  cloudinary,
  upload,
  uploadFile,
  deleteFile,
};
