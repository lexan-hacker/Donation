/**
 * Cron Jobs
 * Scheduled tasks for automatic campaign closing and notifications
 */

const cron = require('node-cron');
const Campaign = require('../models/Campaign');
const Notification = require('../models/Notification');

const closeExpiredCampaigns = () => {
  cron.schedule('0 0 * * *', async () => {
    console.log('Running daily campaign closure job...');
    try {
      const now = new Date();
      const expiredCampaigns = await Campaign.find({
        status: 'live',
        deadline: { $lt: now },
      });
      for (const campaign of expiredCampaigns) {
        campaign.status = 'closed';
        await campaign.save();
        await Notification.create({
          user: campaign.creator,
          type: 'weekly_progress',
          message: `Your campaign "${campaign.title}" has closed.`,
          relatedId: campaign._id,
        });
        console.log(`Closed campaign: ${campaign.title}`);
      }
      console.log(`Closed ${expiredCampaigns.length} campaigns`);
    } catch (error) {
      console.error('Error in campaign closure job:', error);
    }
  });
};

const initCronJobs = () => {
  closeExpiredCampaigns();
  console.log('Cron jobs initialized');
};

module.exports = { initCronJobs };
