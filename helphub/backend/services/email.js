/**
 * Email Service
 * Handles sending emails via Nodemailer
 */

const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Send welcome email to new users
 */
const sendWelcomeEmail = async (userEmail, userName) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"HelpHub" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: 'Welcome to HelpHub!',
    html: `
      <h1>Welcome to HelpHub, ${userName}!</h1>
      <p>Thank you for joining our community of helpers and supporters.</p>
      <p>You can now:</p>
      <ul>
        <li>Create fundraising campaigns for causes you care about</li>
        <li>Donate to support others in need</li>
        <li>Track your donations and campaign progress</li>
      </ul>
      <p>Start making a difference today at <a href="${process.env.FRONTEND_URL}">${process.env.FRONTEND_URL}</a></p>
      <p>Best regards,<br>The HelpHub Team</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${userEmail}`);
  } catch (error) {
    console.error('Error sending welcome email:', error);
  }
};

/**
 * Send donation receipt email
 */
const sendDonationReceiptEmail = async (donorEmail, donation, campaign) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"HelpHub" <${process.env.EMAIL_USER}>`,
    to: donorEmail,
    subject: `Your Donation Receipt - ${campaign.title}`,
    html: `
      <h1>Thank You for Your Generous Donation!</h1>
      <p>Your donation has been successfully processed.</p>
      <hr>
      <h3>Donation Details:</h3>
      <p><strong>Campaign:</strong> ${campaign.title}</p>
      <p><strong>Amount:</strong> $${donation.amount.toFixed(2)}</p>
      <p><strong>Date:</strong> ${new Date(donation.createdAt).toLocaleDateString()}</p>
      <p><strong>Transaction ID:</strong> ${donation.transactionId}</p>
      ${donation.message ? `<p><strong>Your Message:</strong> ${donation.message}</p>` : ''}
      <hr>
      <p>Your support makes a real difference. Thank you for being part of the solution!</p>
      <p>View the campaign: <a href="${process.env.FRONTEND_URL}/campaign/${campaign._id}">${process.env.FRONTEND_URL}/campaign/${campaign._id}</a></p>
      <p>Best regards,<br>The HelpHub Team</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Donation receipt sent to ${donorEmail}`);
  } catch (error) {
    console.error('Error sending donation receipt:', error);
  }
};

/**
 * Send campaign approval/rejection notification
 */
const sendCampaignStatusEmail = async (creatorEmail, campaignTitle, status, reason = '') => {
  const transporter = createTransporter();

  const subject = status === 'approved' 
    ? `Your Campaign "${campaignTitle}" Has Been Approved!`
    : `Update on Your Campaign "${campaignTitle}"`;

  const html = status === 'approved'
    ? `
      <h1>Great News!</h1>
      <p>Your campaign "<strong>${campaignTitle}</strong>" has been approved and is now live on HelpHub.</p>
      <p>People can now discover and donate to your cause. Share your campaign link with friends and family to maximize your reach!</p>
      <p>View your campaign: <a href="${process.env.FRONTEND_URL}/campaign/VIEW_CAMPAIGN_ID">${process.env.FRONTEND_URL}/campaign/VIEW_CAMPAIGN_ID</a></p>
      <p>Best regards,<br>The HelpHub Team</p>
    `
    : `
      <h1>Campaign Update</h1>
      <p>We've reviewed your campaign "<strong>${campaignTitle}</strong>".</p>
      <p>Unfortunately, we were unable to approve it at this time.</p>
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
      <p>Please review our guidelines and consider resubmitting with the necessary changes.</p>
      <p>If you have questions, please contact our support team.</p>
      <p>Best regards,<br>The HelpHub Team</p>
    `;

  const mailOptions = {
    from: `"HelpHub" <${process.env.EMAIL_USER}>`,
    to: creatorEmail,
    subject,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Campaign status email sent to ${creatorEmail}`);
  } catch (error) {
    console.error('Error sending campaign status email:', error);
  }
};

/**
 * Send withdrawal request status email
 */
const sendWithdrawalStatusEmail = async (creatorEmail, campaignTitle, amount, status, adminNote = '') => {
  const transporter = createTransporter();

  const subject = status === 'approved' || status === 'paid'
    ? `Your Withdrawal Request Has Been ${status === 'paid' ? 'Processed' : 'Approved'}!`
    : 'Update on Your Withdrawal Request';

  const html = status === 'approved' || status === 'paid'
    ? `
      <h1>Withdrawal ${status === 'paid' ? 'Processed' : 'Approved'}!</h1>
      <p>Your withdrawal request for "<strong>${campaignTitle}</strong>" has been ${status === 'paid' ? 'processed and the funds have been sent' : 'approved'}.</p>
      <p><strong>Amount:</strong> $${amount.toFixed(2)}</p>
      ${adminNote ? `<p><strong>Note:</strong> ${adminNote}</p>` : ''}
      <p>The funds should arrive in your account within 3-5 business days.</p>
      <p>Thank you for using HelpHub!</p>
      <p>Best regards,<br>The HelpHub Team</p>
    `
    : `
      <h1>Withdrawal Request Update</h1>
      <p>Your withdrawal request for "<strong>${campaignTitle}</strong>" has been rejected.</p>
      <p><strong>Amount:</strong> $${amount.toFixed(2)}</p>
      ${adminNote ? `<p><strong>Reason:</strong> ${adminNote}</p>` : ''}
      <p>Please contact support if you have questions.</p>
      <p>Best regards,<br>The HelpHub Team</p>
    `;

  const mailOptions = {
    from: `"HelpHub" <${process.env.EMAIL_USER}>`,
    to: creatorEmail,
    subject,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Withdrawal status email sent to ${creatorEmail}`);
  } catch (error) {
    console.error('Error sending withdrawal status email:', error);
  }
};

module.exports = {
  sendWelcomeEmail,
  sendDonationReceiptEmail,
  sendCampaignStatusEmail,
  sendWithdrawalStatusEmail,
};
