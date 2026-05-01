/**
 * Withdrawal Controller
 * Handles withdrawal requests from campaign creators
 */

const { validationResult } = require('express-validator');
const WithdrawalRequest = require('../models/WithdrawalRequest');
const Campaign = require('../models/Campaign');

/**
 * @desc    Create withdrawal request
 * @route   POST /api/withdrawals
 * @access  Private (Campaign Creator)
 */
const createWithdrawalRequest = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { campaignId, amount, bankDetails } = req.body;

    // Verify campaign exists and belongs to user
    const campaign = await Campaign.findOne({
      _id: campaignId,
      creator: req.user.id,
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found or you are not the creator',
      });
    }

    // Check campaign is closed
    if (campaign.status !== 'closed') {
      return res.status(400).json({
        success: false,
        message: 'Only closed campaigns can request withdrawals',
      });
    }

    // Check amount doesn't exceed raised amount
    if (amount > campaign.raisedAmount) {
      return res.status(400).json({
        success: false,
        message: 'Withdrawal amount cannot exceed raised amount',
      });
    }

    // Check for existing pending withdrawal
    const existingPending = await WithdrawalRequest.findOne({
      campaign: campaignId,
      status: 'pending',
    });

    if (existingPending) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending withdrawal request for this campaign',
      });
    }

    const withdrawal = await WithdrawalRequest.create({
      campaign: campaignId,
      creator: req.user.id,
      amount,
      bankDetails,
    });

    res.status(201).json({
      success: true,
      data: withdrawal,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user's withdrawal requests
 * @route   GET /api/withdrawals/my-withdrawals
 * @access  Private
 */
const getMyWithdrawals = async (req, res, next) => {
  try {
    const withdrawals = await WithdrawalRequest.find({ creator: req.user.id })
      .populate('campaign', 'title status')
      .sort({ requestedAt: -1 });

    res.json({
      success: true,
      count: withdrawals.length,
      data: withdrawals,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get withdrawal request by ID
 * @route   GET /api/withdrawals/:id
 * @access  Private (Creator or Admin)
 */
const getWithdrawalById = async (req, res, next) => {
  try {
    const withdrawal = await WithdrawalRequest.findById(req.params.id)
      .populate('campaign', 'title status raisedAmount')
      .populate('creator', 'name email');

    if (!withdrawal) {
      return res.status(404).json({ success: false, message: 'Withdrawal request not found' });
    }

    // Check authorization
    if (
      withdrawal.creator._id.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this withdrawal request',
      });
    }

    res.json({
      success: true,
      data: withdrawal,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createWithdrawalRequest,
  getMyWithdrawals,
  getWithdrawalById,
};
