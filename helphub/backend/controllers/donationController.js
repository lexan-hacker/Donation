/**
 * Donation Controller
 * Handles donation processing and history
 */

const { validationResult } = require('express-validator');
const Donation = require('../models/Donation');
const Campaign = require('../models/Campaign');
const { createCheckoutSession } = require('../services/stripe');

/**
 * @desc    Create donation checkout session
 * @route   POST /api/donations/create-checkout
 * @access  Private
 */
const createDonationCheckout = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { campaignId, amount, message, anonymous } = req.body;

    // Validate minimum donation
    if (amount < 5) {
      return res.status(400).json({
        success: false,
        message: 'Minimum donation amount is $5',
      });
    }

    // Check campaign exists and is live
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    if (campaign.status !== 'live') {
      return res.status(400).json({
        success: false,
        message: 'This campaign is not accepting donations',
      });
    }

    // Create Stripe checkout session
    const session = await createCheckoutSession(
      campaignId,
      amount,
      req.user.email,
      req.user.name,
      message || ''
    );

    // Create pending donation record
    await Donation.create({
      campaign: campaignId,
      donor: req.user.id,
      amount,
      transactionId: session.id,
      anonymous: anonymous || false,
      message: message || '',
      status: 'pending',
    });

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user's donation history
 * @route   GET /api/donations/my-donations
 * @access  Private
 */
const getMyDonations = async (req, res, next) => {
  try {
    const donations = await Donation.find({ donor: req.user.id })
      .populate('campaign', 'title coverImageUrl')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: donations.length,
      data: donations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get donations for a campaign
 * @route   GET /api/donations/campaign/:campaignId
 * @access  Public
 */
const getCampaignDonations = async (req, res, next) => {
  try {
    const { limit = 20 } = req.query;

    const donations = await Donation.find({
      campaign: req.params.campaignId,
      status: 'completed',
    })
      .populate('donor', 'name avatarUrl')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    const publicDonations = donations.map(d => ({
      _id: d._id,
      donorName: d.anonymous ? 'Anonymous' : d.donor?.name || 'Anonymous',
      donorAvatar: d.anonymous ? null : d.donor?.avatarUrl,
      amount: d.amount,
      message: d.message,
      createdAt: d.createdAt,
      anonymous: d.anonymous,
    }));

    res.json({
      success: true,
      count: publicDonations.length,
      data: publicDonations,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDonationCheckout,
  getMyDonations,
  getCampaignDonations,
};
