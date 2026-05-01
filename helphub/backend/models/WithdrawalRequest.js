/**
 * WithdrawalRequest Model
 * Represents withdrawal requests from campaign creators
 */

const mongoose = require('mongoose');

const withdrawalRequestSchema = new mongoose.Schema(
  {
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
      required: true,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: [true, 'Please provide an amount'],
      min: [0, 'Amount cannot be negative'],
    },
    bankDetails: {
      accountHolderName: {
        type: String,
        required: [true, 'Please provide account holder name'],
      },
      accountNumber: {
        type: String,
        required: [true, 'Please provide account number'],
      },
      bankName: {
        type: String,
        required: [true, 'Please provide bank name'],
      },
      routingNumber: {
        type: String,
        default: '',
      },
      paypalEmail: {
        type: String,
        default: '',
      },
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'paid', 'rejected'],
      default: 'pending',
    },
    adminNote: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
withdrawalRequestSchema.index({ creator: 1, status: 1 });
withdrawalRequestSchema.index({ campaign: 1 });

module.exports = mongoose.model('WithdrawalRequest', withdrawalRequestSchema);
