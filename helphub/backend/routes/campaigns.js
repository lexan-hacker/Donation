/**
 * Campaign Routes
 * Handles campaign-related endpoints
 */

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { upload } = require('../services/cloudinary');
const {
  getCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  getMyCampaigns,
  submitForApproval,
} = require('../controllers/campaignController');

// Validation rules
const campaignValidation = [
  body('title').trim().isLength({ min: 5, max: 100 }).withMessage('Title must be 5-100 characters'),
  body('shortDescription').trim().isLength({ min: 10, max: 300 }).withMessage('Short description must be 10-300 characters'),
  body('fullDescription').trim().notEmpty().withMessage('Full description is required'),
  body('goalAmount').isFloat({ min: 10 }).withMessage('Goal amount must be at least $10'),
  body('deadline').isISO8601().withMessage('Valid deadline date is required'),
  body('category').isIn(['Medical', 'Education', 'Community', 'Environment', 'Emergency', 'Other']).withMessage('Invalid category'),
  body('coverImageUrl').trim().notEmpty().withMessage('Cover image is required'),
];

// Public routes
router.get('/', getCampaigns);
router.get('/:id', getCampaign);

// Protected routes
router.post('/', protect, upload.single('coverImage'), campaignValidation, createCampaign);
router.put('/:id', protect, updateCampaign);
router.delete('/:id', protect, deleteCampaign);
router.get('/my-campaigns', protect, getMyCampaigns);
router.post('/:id/submit', protect, submitForApproval);

module.exports = router;
