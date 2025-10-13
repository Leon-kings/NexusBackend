const Booking = require('../models/Booking');
const { sendBookingConfirmation, sendBookingUpdate } = require('../mails/sendEmail');

// Create new booking
exports.createBooking = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      company,
      serviceType,
      budget,
      timeline,
      requirements
    } = req.body;

    // Validation
    if (!name || !email || !phone || !serviceType || !timeline || !requirements) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, phone, service type, timeline, and requirements are required'
      });
    }

    // Create booking
    const booking = new Booking({
      name,
      email,
      phone,
      company,
      serviceType,
      budget,
      timeline,
      requirements,
      source: req.body.source || 'website'
    });

    // Calculate initial probability
    booking.calculateProbability();

    await booking.save();

    // Send confirmation email to user
    try {
      await sendBookingConfirmation(booking.email, booking.name, booking.serviceType, booking._id);
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Your booking request has been submitted successfully! We will contact you soon.',
      data: { 
        bookingId: booking._id,
        serviceType: booking.serviceType,
        timeline: booking.timeline
      }
    });

  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while submitting booking',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all bookings (with filtering, sorting, pagination)
exports.getAllBookings = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      serviceType,
      priority,
      assignedTo,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = { isArchived: false };
    
    // Build search query
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { requirements: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) query.status = status;
    if (serviceType) query.serviceType = serviceType;
    if (priority) query.priority = priority;
    if (assignedTo) query.assignedTo = assignedTo;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const bookings = await Booking.find(query)
      .populate('assignedTo', 'name email')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Booking.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        bookings,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching bookings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get booking by ID
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('notes.addedBy', 'name email')
      .populate('documents.uploadedBy', 'name email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { booking }
    });

  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching booking',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update booking
exports.updateBooking = async (req, res) => {
  try {
    const {
      status,
      priority,
      assignedTo,
      estimatedValue,
      nextFollowUp,
      meetingScheduled,
      tags
    } = req.body;

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Update fields
    if (status) {
      booking.status = status;
      booking.calculateProbability(); // Recalculate probability
    }
    if (priority) booking.priority = priority;
    if (assignedTo) booking.assignedTo = assignedTo;
    if (estimatedValue !== undefined) booking.estimatedValue = estimatedValue;
    if (nextFollowUp) booking.nextFollowUp = nextFollowUp;
    if (meetingScheduled) booking.meetingScheduled = meetingScheduled;
    if (tags) booking.tags = tags;

    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking updated successfully',
      data: { booking }
    });

  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating booking',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Add note to booking
exports.addNote = async (req, res) => {
  try {
    const { note } = req.body;
    const userId = req.user.userId;

    if (!note) {
      return res.status(400).json({
        success: false,
        message: 'Note content is required'
      });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    booking.notes.push({
      note,
      addedBy: userId
    });

    await booking.save();

    // Populate the addedBy field for the response
    await booking.populate('notes.addedBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Note added successfully',
      data: { booking }
    });

  } catch (error) {
    console.error('Add note error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding note',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update booking status
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const userId = req.user.userId;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    booking.status = status;
    booking.calculateProbability();

    // Add automatic note for status change
    booking.notes.push({
      note: `Status changed from ${booking.status} to ${status}`,
      addedBy: userId
    });

    await booking.save();

    // Send update email to client if status is won, lost, or quoted
    if (['won', 'lost', 'quoted'].includes(status)) {
      try {
        await sendBookingUpdate(booking.email, booking.name, status, booking.serviceType);
      } catch (emailError) {
        console.error('Status update email error:', emailError);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Booking status updated successfully',
      data: { booking }
    });

  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Archive booking
exports.archiveBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { isArchived: true },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Booking archived successfully',
      data: { booking }
    });

  } catch (error) {
    console.error('Archive booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while archiving booking',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete booking (admin only)
exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Booking deleted successfully'
    });

  } catch (error) {
    console.error('Delete booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting booking',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get booking statistics
exports.getBookingStats = async (req, res) => {
  try {
    const stats = await Booking.getStats();

    // Additional statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const bookingsToday = await Booking.countDocuments({
      createdAt: { $gte: today }
    });

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const bookingsThisWeek = await Booking.countDocuments({
      createdAt: { $gte: weekAgo }
    });

    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    
    const bookingsThisMonth = await Booking.countDocuments({
      createdAt: { $gte: monthAgo }
    });

    // Won deals statistics
    const wonBookings = await Booking.find({ status: 'won' });
    const totalWonValue = wonBookings.reduce((sum, booking) => sum + (booking.estimatedValue || 0), 0);
    const avgDealSize = wonBookings.length > 0 ? totalWonValue / wonBookings.length : 0;

    // Conversion rate
    const totalBookings = stats.total;
    const conversionRate = totalBookings > 0 ? (wonBookings.length / totalBookings * 100) : 0;

    // Bookings by day for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const bookingsByDay = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt"
            }
          },
          count: { $sum: 1 },
          totalValue: { $sum: "$estimatedValue" }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Pipeline statistics
    const pipelineStats = await Booking.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$estimatedValue' },
          avgProbability: { $avg: '$probability' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          total: stats.total,
          totalValue: stats.totalValue,
          today: bookingsToday,
          thisWeek: bookingsThisWeek,
          thisMonth: bookingsThisMonth,
          wonDeals: wonBookings.length,
          totalWonValue,
          avgDealSize: avgDealSize.toFixed(2),
          conversionRate: conversionRate.toFixed(2)
        },
        byStatus: stats.byStatus,
        byService: stats.byService,
        byPriority: stats.byPriority,
        pipeline: pipelineStats,
        bookingsByDay
      }
    });

  } catch (error) {
    console.error('Booking stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching booking statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Bulk update bookings
exports.bulkUpdateBookings = async (req, res) => {
  try {
    const { bookingIds, action, data } = req.body;

    if (!bookingIds || !Array.isArray(bookingIds) || bookingIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Booking IDs are required'
      });
    }

    let update = {};
    let message = '';

    switch (action) {
      case 'update-status':
        update = { status: data.status };
        message = 'Bookings status updated successfully';
        break;
      case 'update-priority':
        update = { priority: data.priority };
        message = 'Bookings priority updated successfully';
        break;
      case 'assign-to':
        update = { assignedTo: data.assignedTo };
        message = 'Bookings assigned successfully';
        break;
      case 'add-tags':
        update = { $addToSet: { tags: { $each: data.tags } } };
        message = 'Tags added to bookings successfully';
        break;
      case 'archive':
        update = { isArchived: true };
        message = 'Bookings archived successfully';
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action'
        });
    }

    const result = await Booking.updateMany(
      { _id: { $in: bookingIds } },
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
    console.error('Bulk update bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while performing bulk update',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};