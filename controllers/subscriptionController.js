// controllers/subscriptionController.js
const Subscription = require('../models/Subscription');
const SubscriptionStats = require('../models/SubscriptionStats');
const { validationResult } = require('express-validator');

class SubscriptionController {
  // Create new subscription
  async subscribe(req, res) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { email, source = 'website' } = req.body;

      // Check if email already exists
      const existingSubscription = await Subscription.findOne({ email });
      if (existingSubscription) {
        if (existingSubscription.status === 'active') {
          return res.status(409).json({
            success: false,
            message: 'Email is already subscribed'
          });
        } else {
          // Reactivate inactive subscription
          existingSubscription.status = 'active';
          existingSubscription.unsubscribedAt = null;
          existingSubscription.source = source;
          await existingSubscription.save();
          
          await this.updateStats();
          
          return res.status(200).json({
            success: true,
            message: 'Subscription reactivated successfully',
            data: existingSubscription
          });
        }
      }

      // Create new subscription
      const subscription = new Subscription({
        email,
        source
      });

      await subscription.save();
      await this.updateStats();

      res.status(201).json({
        success: true,
        message: 'Subscribed successfully',
        data: subscription
      });

    } catch (error) {
      console.error('Subscription error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Unsubscribe
  async unsubscribe(req, res) {
    try {
      const { email } = req.body;

      const subscription = await Subscription.findOne({ email });
      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: 'Subscription not found'
        });
      }

      if (subscription.status === 'unsubscribed') {
        return res.status(400).json({
          success: false,
          message: 'Already unsubscribed'
        });
      }

      subscription.status = 'unsubscribed';
      subscription.unsubscribedAt = new Date();
      await subscription.save();

      await this.updateStats();

      res.json({
        success: true,
        message: 'Unsubscribed successfully'
      });

    } catch (error) {
      console.error('Unsubscribe error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get all subscriptions (with pagination)
  async getSubscriptions(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const status = req.query.status;
      const skip = (page - 1) * limit;

      let query = {};
      if (status) {
        query.status = status;
      }

      const subscriptions = await Subscription.find(query)
        .sort({ subscribedAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Subscription.countDocuments(query);
      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        data: subscriptions,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      });

    } catch (error) {
      console.error('Get subscriptions error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Update statistics
  async updateStats() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const totalSubscriptions = await Subscription.countDocuments();
      const activeSubscriptions = await Subscription.countDocuments({ status: 'active' });
      
      // Count new subscriptions today
      const startOfToday = new Date(today);
      const endOfToday = new Date(today);
      endOfToday.setHours(23, 59, 59, 999);

      const newSubscriptionsToday = await Subscription.countDocuments({
        subscribedAt: {
          $gte: startOfToday,
          $lte: endOfToday
        }
      });

      // Count unsubscriptions today
      const unsubscriptionsToday = await Subscription.countDocuments({
        unsubscribedAt: {
          $gte: startOfToday,
          $lte: endOfToday
        }
      });

      // Update or create today's stats
      await SubscriptionStats.findOneAndUpdate(
        { date: today },
        {
          totalSubscriptions,
          newSubscriptions: newSubscriptionsToday,
          unsubscriptions: unsubscriptionsToday,
          activeSubscriptions
        },
        { upsert: true, new: true }
      );

    } catch (error) {
      console.error('Update stats error:', error);
    }
  }

  // Get statistics
  async getStats(req, res) {
    try {
      const { period = '7d' } = req.query;
      let startDate = new Date();

      switch (period) {
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
        default:
          startDate.setDate(startDate.getDate() - 7);
      }

      startDate.setHours(0, 0, 0, 0);

      const stats = await SubscriptionStats.find({
        date: { $gte: startDate }
      }).sort({ date: 1 });

      // Current totals
      const totalSubscriptions = await Subscription.countDocuments();
      const activeSubscriptions = await Subscription.countDocuments({ status: 'active' });
      const newSubscriptionsToday = await Subscription.countDocuments({
        subscribedAt: {
          $gte: new Date().setHours(0, 0, 0, 0)
        }
      });

      res.json({
        success: true,
        data: {
          periodStats: stats,
          current: {
            totalSubscriptions,
            activeSubscriptions,
            newSubscriptionsToday
          }
        }
      });

    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
}

module.exports = new SubscriptionController();