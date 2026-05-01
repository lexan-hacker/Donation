/**
 * Webhook Routes
 * Handles Stripe webhook events
 */

const express = require('express');
const router = express.Router();
const { handleSuccessfulPayment, verifyWebhookSignature } = require('../services/stripe');
const Donation = require('../models/Donation');
const Campaign = require('../models/Campaign');

// Stripe webhook endpoint
router.post('/stripe', async (req, res) => {
  const signature = req.headers['stripe-signature'];
  
  let event;
  
  try {
    // Verify webhook signature
    event = verifyWebhookSignature(signature, req.body);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        
        if (session.payment_status === 'paid') {
          await handleSuccessfulPayment(session.id);
        }
        break;
      }
      
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        // Additional handling if needed
        console.log('Payment succeeded:', paymentIntent.id);
        break;
      }
      
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        // Update donation status to failed
        await Donation.findOneAndUpdate(
          { transactionId: paymentIntent.id },
          { status: 'failed' }
        );
        console.log('Payment failed:', paymentIntent.id);
        break;
      }
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router;
