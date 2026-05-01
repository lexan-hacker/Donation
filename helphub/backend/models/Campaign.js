/**
 * Campaign Model
 * Represents fundraising campaigns created by users
 */

const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide a title'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    shortDescription: {
      type: String,
      required: [true, 'Please provide a short description'],
      trim: true,
      maxlength: [300, 'Short description cannot exceed 300 characters'],
    },
    fullDescription: {
      type: String,
      required: [true, 'Please provide a full description'],
    },
    goalAmount: {
      type: Number,
      required: [true, 'Please provide a goal amount'],
      min: [10, 'Goal amount must be at least $10'],
    },
    raisedAmount: {
      type: Number,
      default: 0,
    },
    deadline: {
      type: Date,
      required: [true, 'Please provide a deadline'],
    },
    category: {
      type: String,
      enum: ['Medical', 'Education', 'Community', 'Environment', 'Emergency', 'Other'],
      required: [true, 'Please select a category'],
    },
    coverImageUrl: {
      type: String,
      required: [true, 'Please provide a cover image'],
    },
    mediaUrls: {
      type: [String],
      default: [],
    },
    location: {
      city: {
        type: String,
        default: '',
      },
      country: {
        type: String,
        default: '',
      },
    },
    status: {
      type: String,
      enum: ['draft', 'pending', 'live', 'closed', 'rejected'],
      default: 'draft',
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
campaignSchema.index({ status: 1, createdAt: -1 });
campaignSchema.index({ category: 1, status: 1 });
campaignSchema.index({ deadline: 1 });

// Virtual for progress percentage
campaignSchema.virtual('progressPercentage').get(function () {
  if (this.goalAmount === 0) return 0;
  return Math.round((this.raisedAmount / this.goalAmount) * 100);
});

// Check if campaign is overdue
campaignSchema.methods.isOverdue = function () {
  return this.deadline < new Date() && this.status === 'live';
};

module.exports = mongoose.model('Campaign', campaignSchema);
