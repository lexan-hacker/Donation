/**
 * Admin Controller
 * Handles admin operations (campaign approval, withdrawals, user management)
 */

const Campaign = require('../models/Campaign');
const WithdrawalRequest = require('../models/WithdrawalRequest');
const User = require('../models/User');
const Donation = require('../models/Donation');
const Notification = require('../models/Notification');
const { sendCampaignStatusEmail, sendWithdrawalStatusEmail } = require('../services/email');

/**
 * @desc    Get all campaigns (admin view)
 * @route   GET /api/admin/campaigns
 * @access  Private/Admin
 */
const getAllCampaigns = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) {
      query.status = status;
    }

    const campaigns = await Campaign.find(query)
      .populate('creator', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((page - 1) * limit);

    const total = await Campaign.countDocuments(query);

    res.json({
      success: true,
      count: campaigns.length,
      total,
      data: campaigns,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Approve or reject campaign
 * @route   PUT /api/admin/campaigns/:id/status
 * @access  Private/Admin
 */
const updateCampaignStatus = async (req, res, next) => {
  try {
    const { status, rejectionReason } = req.body;

    if (!['approved', 'live', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
    }

    const campaign = await Campaign.findById(req.params.id)
      .populate('creator', 'email name');

    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    if (status === 'rejected') {
      campaign.status = 'rejected';
      campaign.rejectionReason = rejectionReason || 'Campaign does not meet guidelines';
    } else if (status === 'live') {
      campaign.status = 'live';
      campaign.rejectionReason = null;
    }

    await campaign.save();

    // Send email notification
    await sendCampaignStatusEmail(
      campaign.creator.email,
      campaign.title,
      campaign.status,
      campaign.rejectionReason
    );

    // Create notification
    await Notification.create({
      user: campaign.creator._id,
      type: campaign.status === 'rejected' ? 'campaign_rejected' : 'campaign_approved',
      message: campaign.status === 'rejected'
        ? `Your campaign "${campaign.title}" was rejected: ${campaign.rejectionReason}`
        : `Your campaign "${campaign.title}" has been approved and is now live!`,
      relatedId: campaign._id,
    });

    res.json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Feature/unfeature campaign
 * @route   PUT /api/admin/campaigns/:id/feature
 * @access  Private/Admin
 */
const toggleFeature = async (req, res, next) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    campaign.isFeatured = !campaign.isFeatured;
    await campaign.save();

    res.json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all withdrawal requests
 * @route   GET /api/admin/withdrawals
 * @access  Private/Admin
 */
const getWithdrawalRequests = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) {
      query.status = status;
    }

    const withdrawals = await WithdrawalRequest.find(query)
      .populate('campaign', 'title')
      .populate('creator', 'name email')
      .sort({ requestedAt: -1 })
      .limit(parseInt(limit))
      .skip((page - 1) * limit);

    const total = await WithdrawalRequest.countDocuments(query);

    res.json({
      success: true,
      count: withdrawals.length,
      total,
      data: withdrawals,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Process withdrawal request
 * @route   PUT /api/admin/withdrawals/:id
 * @access  Private/Admin
 */
const processWithdrawal = async (req, res, next) => {
  try {
    const { status, adminNote } = req.body;

    if (!['approved', 'paid', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
    }

    const withdrawal = await WithdrawalRequest.findById(req.params.id)
      .populate('creator', 'email name')
      .populate('campaign', 'title');

    if (!withdrawal) {
      return res.status(404).json({ success: false, message: 'Withdrawal request not found' });
    }

    withdrawal.status = status;
    withdrawal.adminNote = adminNote || null;
    
    if (status === 'approved' || status === 'paid') {
      withdrawal.processedAt = new Date();
    }

    await withdrawal.save();

    // Send email notification
    await sendWithdrawalStatusEmail(
      withdrawal.creator.email,
      withdrawal.campaign.title,
      withdrawal.amount,
      status,
      adminNote
    );

    // Create notification
    await Notification.create({
      user: withdrawal.creator._id,
      type: status === 'rejected' ? 'withdrawal_rejected' : 'withdrawal_approved',
      message: status === 'rejected'
        ? `Your withdrawal request for "${withdrawal.campaign.title}" was rejected: ${adminNote || ''}`
        : `Your withdrawal request for "${withdrawal.campaign.title}" has been ${status}!`,
      relatedId: withdrawal._id,
    });

    res.json({
      success: true,
      data: withdrawal,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all users
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { role, isSuspended, page = 1, limit = 20 } = req.query;

    const query = {};
    if (role) {
      query.role = role;
    }
    if (isSuspended !== undefined) {
      query.isSuspended = isSuspended === 'true';
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      count: users.length,
      total,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user (promote to admin, suspend)
 * @route   PUT /api/admin/users/:id
 * @access  Private/Admin
 */
const updateUser = async (req, res, next) => {
  try {
    const { role, isSuspended } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (role) {
      user.role = role;
    }
    if (isSuspended !== undefined) {
      user.isSuspended = isSuspended;
    }

    await user.save();

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isSuspended: user.isSuspended,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all donations (with filters)
 * @route   GET /api/admin/donations
 * @access  Private/Admin
 */
const getAllDonations = async (req, res, next) => {
  try {
    const { campaignId, status, startDate, endDate, page = 1, limit = 50 } = req.query;

    const query = {};
    if (campaignId) {
      query.campaign = campaignId;
    }
    if (status) {
      query.status = status;
    }
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    const donations = await Donation.find(query)
      .populate('campaign', 'title')
      .populate('donor', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((page - 1) * limit);

    const total = await Donation.countDocuments(query);

    res.json({
      success: true,
      count: donations.length,
      total,
      data: donations,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllCampaigns,
  updateCampaignStatus,
  toggleFeature,
  getWithdrawalRequests,
  processWithdrawal,
  getAllUsers,
  updateUser,
  getAllDonations,
};
