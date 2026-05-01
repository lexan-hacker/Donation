/**
 * Stripe Payment Service
 * Handles Stripe payment processing and webhooks
 */

const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const Donation = require('../models/Donation');
const Campaign = require('../models/Campaign');
const Notification = require('../models/Notification');
const { sendDonationReceiptEmail } = require('./email');

/**
 * Create a Stripe Checkout Session for donation
 */
const createCheckoutSession = async (campaignId, amount, donorEmail, donorName, message) => {
  const campaign = await Campaign.findById(campaignId);

  if (!campaign) {
    throw new Error('Campaign not found');
  }

  if (campaign.status !== 'live') {
    throw new Error('Campaign is not accepting donations');
  }

  // Calculate platform fee (if any)
  const platformFeePercentage = parseFloat(process.env.PLATFORM_FEE_PERCENTAGE || 0);
  const platformFee = (amount * platformFeePercentage) / 100;
  
  // Stripe fee: 2.9% + $0.30 (US cards)
  const stripeFee = (amount * 0.029) + 0.30;
  
  const totalAmount = Math.round((amount + platformFee + stripeFee) * 100); // Convert to cents

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Donation to ${campaign.title}`,
            description: message || 'Support this cause',
          },
          unit_amount: totalAmount,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${process.env.FRONTEND_URL}/donation/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL}/campaign/${campaignId}`,
    customer_email: donorEmail,
    metadata: {
      campaignId: campaignId.toString(),
      donorName,
      message: message || '',
    },
  });

  return session;
};

/**
 * Handle successful payment from webhook
 */
const handleSuccessfulPayment = async (sessionId) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      throw new Error('Payment not completed');
    }

    const { campaignId, donorName, message } = session.metadata;
    const amount = session.amount_total / 100; // Convert from cents

    // Find or create donation record
    let donation = await Donation.findOne({ transactionId: session.id });

    if (!donation) {
      donation = await Donation.create({
        campaign: campaignId,
        donor: session.customer, // This might need adjustment based on how we track donors
        amount: amount - ((amount * 0.029) + 0.30), // Net amount after Stripe fees
        transactionId: session.id,
        anonymous: false, // Would need to pass this in metadata
        message: message,
        status: 'completed',
        paymentProcessorFee: (amount * 0.029) + 0.30,
      });
    } else {
      donation.status = 'completed';
      await donation.save();
    }

    // Update campaign raised amount
    const campaign = await Campaign.findById(campaignId);
    if (campaign) {
      campaign.raisedAmount += donation.amount;
      await campaign.save();

      // Send notification to campaign creator
      await Notification.create({
        user: campaign.creator,
        type: 'new_donation',
        message: `You received a new donation of $${donation.amount.toFixed(2)} for "${campaign.title}"`,
        relatedId: donation._id,
      });

      // Send email receipt to donor
      await sendDonationReceiptEmail(session.customer_email, donation, campaign);
    }

    return donation;
  } catch (error) {
    console.error('Error handling successful payment:', error);
    throw error;
  }
};

/**
 * Verify Stripe webhook signature
 */
const verifyWebhookSignature = (signature, payload) => {
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  try {
    const event = stripe.webhooks.constructEvent(payload, signature, endpointSecret);
    return event;
  } catch (error) {
    console.error('Webhook signature verification failed:', error.message);
    throw new Error('Invalid webhook signature');
  }
};

module.exports = {
  createCheckoutSession,
  handleSuccessfulPayment,
  verifyWebhookSignature,
};
