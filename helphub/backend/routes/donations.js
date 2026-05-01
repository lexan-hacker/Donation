/**
 * Donation Routes
 * Handles donation-related endpoints
 */

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { donationLimiter } = require('../middleware/rateLimiter');
const {
  createDonationCheckout,
  getMyDonations,
  getCampaignDonations,
} = require('../controllers/donationController');

// Validation rules
const donationValidation = [
  body('campaignId').isMongoId().withMessage('Valid campaign ID is required'),
  body('amount').isFloat({ min: 5 }).withMessage('Donation amount must be at least $5'),
  body('message').optional().trim().isLength({ max: 500 }).withMessage('Message cannot exceed 500 characters'),
];

// Public route
router.get('/campaign/:campaignId', getCampaignDonations);

// Protected routes
router.post('/create-checkout', protect, donationLimiter, donationValidation, createDonationCheckout);
router.get('/my-donations', protect, getMyDonations);

module.exports = router;
