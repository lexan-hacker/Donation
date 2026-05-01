/**
 * Admin Routes
 * Handles admin-only endpoints
 */

const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const {
  getAllCampaigns,
  updateCampaignStatus,
  toggleFeature,
  getWithdrawalRequests,
  processWithdrawal,
  getAllUsers,
  updateUser,
  getAllDonations,
} = require('../controllers/adminController');

// All routes require admin authentication
router.use(protect);
router.use(admin);

// Campaign management
router.get('/campaigns', getAllCampaigns);
router.put('/campaigns/:id/status', updateCampaignStatus);
router.put('/campaigns/:id/feature', toggleFeature);

// Withdrawal management
router.get('/withdrawals', getWithdrawalRequests);
router.put('/withdrawals/:id', processWithdrawal);

// User management
router.get('/users', getAllUsers);
router.put('/users/:id', updateUser);

// Donation management
router.get('/donations', getAllDonations);

module.exports = router;
