/**
 * Notification Model
 * Represents in-app notifications for users
 */

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'campaign_approved',
        'campaign_rejected',
        'new_donation',
        'withdrawal_approved',
        'withdrawal_rejected',
        'weekly_progress',
      ],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ read: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
