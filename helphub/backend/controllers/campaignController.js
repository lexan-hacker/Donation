/**
 * Campaign Controller
 * Handles campaign CRUD operations
 */

const { validationResult } = require('express-validator');
const Campaign = require('../models/Campaign');
const Donation = require('../models/Donation');
const Notification = require('../models/Notification');
const { sendCampaignStatusEmail } = require('../services/email');
const { deleteFile } = require('../services/cloudinary');

/**
 * @desc    Get all campaigns (public)
 * @route   GET /api/campaigns
 * @access  Public
 */
const getCampaigns = async (req, res, next) => {
  try {
    const {
      category,
      status = 'live',
      search,
      sort = 'newest',
      page = 1,
      limit = 9,
    } = req.query;

    const query = { status: status || 'live' };

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Search by title or description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { shortDescription: { $regex: search, $options: 'i' } },
      ];
    }

    // Sorting
    let sortOptions = {};
    switch (sort) {
      case 'newest':
        sortOptions = { createdAt: -1 };
        break;
      case 'oldest':
        sortOptions = { createdAt: 1 };
        break;
      case 'deadline':
        sortOptions = { deadline: 1 };
        break;
      case 'most-funded':
        sortOptions = { raisedAmount: -1 };
        break;
      case 'goal-progress':
        sortOptions = { progressPercentage: -1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }

    const skip = (page - 1) * limit;

    const campaigns = await Campaign.find(query)
      .populate('creator', 'name avatarUrl')
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Campaign.countDocuments(query);

    res.json({
      success: true,
      count: campaigns.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: campaigns,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single campaign
 * @route   GET /api/campaigns/:id
 * @access  Public
 */
const getCampaign = async (req, res, next) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate('creator', 'name email avatarUrl');

    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    // Get recent donations for this campaign
    const donations = await Donation.find({ campaign: campaign._id, status: 'completed' })
      .populate('donor', 'name')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      data: {
        ...campaign.toObject(),
        recentDonations: donations.map(d => ({
          _id: d._id,
          donorName: d.anonymous ? 'Anonymous' : d.donor?.name || 'Anonymous',
          amount: d.amount,
          message: d.message,
          createdAt: d.createdAt,
          anonymous: d.anonymous,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create campaign
 * @route   POST /api/campaigns
 * @access  Private
 */
const createCampaign = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const {
      title,
      shortDescription,
      fullDescription,
      goalAmount,
      deadline,
      category,
      coverImageUrl,
      mediaUrls,
      city,
      country,
    } = req.body;

    // Validate deadline (7-365 days from now)
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const minDeadline = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const maxDeadline = new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000);

    if (deadlineDate < minDeadline || deadlineDate > maxDeadline) {
      return res.status(400).json({
        success: false,
        message: 'Deadline must be between 7 and 365 days from today',
      });
    }

    const campaign = await Campaign.create({
      creator: req.user.id,
      title,
      shortDescription,
      fullDescription,
      goalAmount,
      deadline: deadlineDate,
      category,
      coverImageUrl,
      mediaUrls: mediaUrls || [],
      location: { city, country },
      status: 'pending', // Requires admin approval
    });

    res.status(201).json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update campaign
 * @route   PUT /api/campaigns/:id
 * @access  Private (Creator only)
 */
const updateCampaign = async (req, res, next) => {
  try {
    let campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    // Check ownership
    if (campaign.creator.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this campaign' });
    }

    // If campaign is live, restrict what can be updated
    if (campaign.status === 'live') {
      const { title, shortDescription, fullDescription, coverImageUrl, mediaUrls } = req.body;
      campaign.title = title || campaign.title;
      campaign.shortDescription = shortDescription || campaign.shortDescription;
      campaign.fullDescription = fullDescription || campaign.fullDescription;
      campaign.coverImageUrl = coverImageUrl || campaign.coverImageUrl;
      campaign.mediaUrls = mediaUrls || campaign.mediaUrls;
    } else if (campaign.status === 'draft' || campaign.status === 'pending') {
      // Allow full update for draft/pending campaigns
      Object.assign(campaign, req.body);
    }

    campaign = await campaign.save();

    res.json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete campaign
 * @route   DELETE /api/campaigns/:id
 * @access  Private (Creator or Admin)
 */
const deleteCampaign = async (req, res, next) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    // Check ownership
    if (campaign.creator.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this campaign' });
    }

    // Only allow deletion of draft or rejected campaigns
    if (campaign.status === 'live' || campaign.status === 'closed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete live or closed campaigns. Please contact support.',
      });
    }

    // Delete cover image from Cloudinary
    if (campaign.coverImageUrl) {
      await deleteFile(campaign.coverImageUrl);
    }

    await campaign.deleteOne();

    res.json({
      success: true,
      message: 'Campaign deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user's campaigns
 * @route   GET /api/campaigns/my-campaigns
 * @access  Private
 */
const getMyCampaigns = async (req, res, next) => {
  try {
    const { status } = req.query;

    const query = { creator: req.user.id };
    if (status) {
      query.status = status;
    }

    const campaigns = await Campaign.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: campaigns.length,
      data: campaigns,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Submit campaign for approval
 * @route   POST /api/campaigns/:id/submit
 * @access  Private (Creator)
 */
const submitForApproval = async (req, res, next) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    if (campaign.creator.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (campaign.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Only draft campaigns can be submitted for approval',
      });
    }

    campaign.status = 'pending';
    await campaign.save();

    res.json({
      success: true,
      message: 'Campaign submitted for approval',
      data: campaign,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  getMyCampaigns,
  submitForApproval,
};
