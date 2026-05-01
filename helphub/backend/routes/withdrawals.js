/**
 * Withdrawal Routes
 * Handles withdrawal request endpoints
 */

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createWithdrawalRequest,
  getMyWithdrawals,
  getWithdrawalById,
} = require('../controllers/withdrawalController');

// Validation rules
const withdrawalValidation = [
  body('campaignId').isMongoId().withMessage('Valid campaign ID is required'),
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be greater than 0'),
  body('bankDetails.accountHolderName').trim().notEmpty().withMessage('Account holder name is required'),
  body('bankDetails.accountNumber').trim().notEmpty().withMessage('Account number is required'),
  body('bankDetails.bankName').trim().notEmpty().withMessage('Bank name is required'),
];

// All routes require authentication
router.use(protect);

router.post('/', withdrawalValidation, createWithdrawalRequest);
router.get('/my-withdrawals', getMyWithdrawals);
router.get('/:id', getWithdrawalById);

module.exports = router;
