/**
 * Donation Model
 * Represents donations made by users to campaigns
 */

const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema(
  {
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
      required: true,
    },
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: [true, 'Please provide a donation amount'],
      min: [5, 'Minimum donation is $5'],
    },
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },
    anonymous: {
      type: Boolean,
      default: false,
    },
    message: {
      type: String,
      trim: true,
      maxlength: [500, 'Message cannot exceed 500 characters'],
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'refunded'],
      default: 'pending',
    },
    paymentProcessorFee: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
donationSchema.index({ campaign: 1, createdAt: -1 });
donationSchema.index({ donor: 1, createdAt: -1 });

module.exports = mongoose.model('Donation', donationSchema);
