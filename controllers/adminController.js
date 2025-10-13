const User = require('../models/User');
const { sendEmail } = require('../mails/sendEmail');

// Get all users (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role, verified, active } = req.query;
    
    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) query.role = role;
    if (verified) query.isVerified = verified === 'true';
    if (active) query.isActive = active === 'true';

    const users = await User.find(query)
      .select('-password -verificationCode -verificationCodeExpires')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -verificationCode -verificationCodeExpires');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { user }
    });

  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update user role
exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'moderator', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    // Prevent self-role modification
    if (id === req.user.userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify your own role'
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true, runValidators: true }
    ).select('-password -verificationCode -verificationCodeExpires');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      data: { user }
    });

  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating user role',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Toggle user active status
exports.toggleUserActive = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent self-deactivation
    if (id === req.user.userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate your own account'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { user }
    });

  } catch (error) {
    console.error('Toggle user active error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating user status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (id === req.user.userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Bulk actions
exports.bulkAction = async (req, res) => {
  try {
    const { userIds, action } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'User IDs are required'
      });
    }

    // Remove current user from bulk actions
    const filteredUserIds = userIds.filter(id => id !== req.user.userId);

    let update = {};
    let message = '';

    switch (action) {
      case 'activate':
        update = { isActive: true };
        message = 'Users activated successfully';
        break;
      case 'deactivate':
        update = { isActive: false };
        message = 'Users deactivated successfully';
        break;
      case 'make-admin':
        update = { role: 'admin' };
        message = 'Users promoted to admin successfully';
        break;
      case 'make-moderator':
        update = { role: 'moderator' };
        message = 'Users promoted to moderator successfully';
        break;
      case 'make-user':
        update = { role: 'user' };
        message = 'Users demoted to user successfully';
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action'
        });
    }

    const result = await User.updateMany(
      { _id: { $in: filteredUserIds } },
      update
    );

    res.status(200).json({
      success: true,
      message,
      data: {
        modifiedCount: result.modifiedCount
      }
    });

  } catch (error) {
    console.error('Bulk action error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while performing bulk action',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};