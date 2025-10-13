const User = require('../models/User');
const Contact = require('../models/Contact');

// Get comprehensive dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    // User statistics
    const totalUsers = await User.countDocuments();
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    const unverifiedUsers = await User.countDocuments({ isVerified: false });
    const activeUsers = await User.countDocuments({ isActive: true });
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const moderatorUsers = await User.countDocuments({ role: 'moderator' });
    const regularUsers = await User.countDocuments({ role: 'user' });
    
    // Contact statistics
    const totalContacts = await Contact.countDocuments();
    const newContacts = await Contact.countDocuments({ status: 'new' });
    const respondedContacts = await Contact.countDocuments({ status: 'responded' });
    const inProgressContacts = await Contact.countDocuments({ status: 'in-progress' });
    
    // Today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const usersToday = await User.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow }
    });

    const loginsToday = await User.countDocuments({
      lastLogin: { $gte: today, $lt: tomorrow }
    });

    const contactsToday = await Contact.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow }
    });

    // Weekly stats
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const newUsersThisWeek = await User.countDocuments({
      createdAt: { $gte: weekAgo }
    });

    const activeUsersThisWeek = await User.countDocuments({
      lastLogin: { $gte: weekAgo }
    });

    const newContactsThisWeek = await Contact.countDocuments({
      createdAt: { $gte: weekAgo }
    });

    // Monthly stats
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: monthAgo }
    });

    const activeUsersThisMonth = await User.countDocuments({
      lastLogin: { $gte: monthAgo }
    });

    const newContactsThisMonth = await Contact.countDocuments({
      createdAt: { $gte: monthAgo }
    });

    // Contact priority stats
    const highPriorityContacts = await Contact.countDocuments({ 
      priority: 'high', 
      status: { $in: ['new', 'in-progress'] } 
    });

    const urgentContacts = await Contact.countDocuments({ 
      priority: 'urgent', 
      status: { $in: ['new', 'in-progress'] } 
    });

    // Active users (logged in last 30 days)
    const lastMonth = new Date();
    lastMonth.setDate(lastMonth.getDate() - 30);
    const recentlyActiveUsers = await User.countDocuments({
      lastLogin: { $gte: lastMonth }
    });

    // Role-based stats
    const roleStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          avgLogins: { $avg: '$loginCount' }
        }
      }
    ]);

    // Top users by login count
    const topUsers = await User.find()
      .sort({ loginCount: -1 })
      .limit(10)
      .select('name email role loginCount lastLogin isVerified');

    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          verified: verifiedUsers,
          unverified: unverifiedUsers,
          active: activeUsers,
          recentlyActive: recentlyActiveUsers,
          admins: adminUsers,
          moderators: moderatorUsers,
          regular: regularUsers,
          today: usersToday,
          loginsToday: loginsToday,
          thisWeek: {
            new: newUsersThisWeek,
            active: activeUsersThisWeek
          },
          thisMonth: {
            new: newUsersThisMonth,
            active: activeUsersThisMonth
          },
          verificationRate: totalUsers > 0 ? (verifiedUsers / totalUsers * 100).toFixed(2) : 0,
          activeRate: totalUsers > 0 ? (recentlyActiveUsers / totalUsers * 100).toFixed(2) : 0
        },
        contacts: {
          total: totalContacts,
          new: newContacts,
          responded: respondedContacts,
          inProgress: inProgressContacts,
          today: contactsToday,
          thisWeek: newContactsThisWeek,
          thisMonth: newContactsThisMonth,
          highPriority: highPriorityContacts,
          urgent: urgentContacts
        },
        overview: {
          userGrowthRate: totalUsers > 0 ? ((newUsersThisWeek / totalUsers) * 100).toFixed(2) : 0,
          contactResponseRate: totalContacts > 0 ? ((respondedContacts / totalContacts) * 100).toFixed(2) : 0,
          activeEngagementRate: totalUsers > 0 ? ((activeUsersThisWeek / totalUsers) * 100).toFixed(2) : 0
        },
        roleStats,
        topUsers
      }
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get detailed user statistics
exports.getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    const unverifiedUsers = await User.countDocuments({ isVerified: false });
    const activeUsers = await User.countDocuments({ isActive: true });
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const moderatorUsers = await User.countDocuments({ role: 'moderator' });
    const regularUsers = await User.countDocuments({ role: 'user' });
    
    // Users registered in last 7 days
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const newUsersThisWeek = await User.countDocuments({
      createdAt: { $gte: lastWeek }
    });

    // Active users (logged in last 30 days)
    const lastMonth = new Date();
    lastMonth.setDate(lastMonth.getDate() - 30);
    const recentlyActiveUsers = await User.countDocuments({
      lastLogin: { $gte: lastMonth }
    });

    // User growth per month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Users by role
    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    // Top users by login count
    const topUsers = await User.find()
      .sort({ loginCount: -1 })
      .limit(10)
      .select('name email role loginCount lastLogin isVerified');

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers,
          verifiedUsers,
          unverifiedUsers,
          activeUsers,
          adminUsers,
          moderatorUsers,
          regularUsers,
          verificationRate: totalUsers > 0 ? (verifiedUsers / totalUsers * 100).toFixed(2) : 0,
          newUsersThisWeek,
          recentlyActiveUsers,
          activeRate: totalUsers > 0 ? (recentlyActiveUsers / totalUsers * 100).toFixed(2) : 0
        },
        monthlyGrowth,
        usersByRole,
        topUsers
      }
    });

  } catch (error) {
    console.error('User stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get user activity timeline
exports.getUserActivity = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const activityData = await User.aggregate([
      {
        $match: {
          lastLogin: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$lastLogin" } }
          },
          logins: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.date": 1 }
      }
    ]);

    // Also get registration activity for the same period
    const registrationData = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
          },
          registrations: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.date": 1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        logins: activityData,
        registrations: registrationData
      }
    });

  } catch (error) {
    console.error('User activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user activity',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get contact statistics
exports.getContactStats = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Basic contact counts
    const totalContacts = await Contact.countDocuments();
    const contactsByStatus = await Contact.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const contactsByPriority = await Contact.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    const contactsByInterest = await Contact.aggregate([
      {
        $group: {
          _id: '$interest',
          count: { $sum: 1 }
        }
      }
    ]);

    // Daily contact trends
    const dailyContacts = await Contact.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.date": 1 }
      }
    ]);

    // Recent high priority contacts
    const recentHighPriority = await Contact.find({
      priority: { $in: ['high', 'urgent'] },
      status: { $in: ['new', 'in-progress'] }
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .select('name email subject priority status createdAt');

    res.status(200).json({
      success: true,
      data: {
        overview: {
          total: totalContacts,
          byStatus: contactsByStatus,
          byPriority: contactsByPriority,
          byInterest: contactsByInterest
        },
        trends: {
          daily: dailyContacts
        },
        recentHighPriority
      }
    });

  } catch (error) {
    console.error('Contact stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching contact statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};