const Contact = require('../models/Contact');
const User = require('../models/User');
const { sendContactNotification, sendContactResponse } = require('../mails/sendEmail');
const { createNotification } = require("./notificationController");

// Create new contact submission
exports.createContact = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      company,
      subject,
      message,
      interest,
      budget
    } = req.body;

    // Validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, subject, and message are required'
      });
    }

    // Create contact
    const contact = new Contact({
      name,
      email,
      phone,
      company,
      subject,
      message,
      interest,
      budget,
      source: req.body.source || 'website'
    });

    await contact.save();
    await createNotification("contact", "New contact message received!", contact._id);
    // Send notification emails
    try {
      // Send confirmation to user
      await sendContactResponse(contact.email, contact.name, contact.subject);
      
      // Send notification to admin
      await sendContactNotification(contact);
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Thank you for your message. We will get back to you soon!',
      data: { contact }
    });

  } catch (error) {
    console.error('Create contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while submitting contact form',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all contacts (with filtering, sorting, pagination)
exports.getAllContacts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      priority,
      interest,
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
        { subject: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (interest) query.interest = interest;
    if (assignedTo) query.assignedTo = assignedTo;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const contacts = await Contact.find(query)
      .populate('assignedTo', 'name email')
      .populate('response.respondedBy', 'name email')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Contact.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        contacts,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching contacts',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get contact by ID
exports.getContactById = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('response.respondedBy', 'name email')
      .populate('notes.addedBy', 'name email');

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { contact }
    });

  } catch (error) {
    console.error('Get contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching contact',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update contact
exports.updateContact = async (req, res) => {
  try {
    const {
      status,
      priority,
      assignedTo,
      tags,
      followUpDate
    } = req.body;

    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    // Update fields
    if (status) contact.status = status;
    if (priority) contact.priority = priority;
    if (assignedTo) contact.assignedTo = assignedTo;
    if (tags) contact.tags = tags;
    if (followUpDate) contact.followUpDate = followUpDate;

    await contact.save();

    res.status(200).json({
      success: true,
      message: 'Contact updated successfully',
      data: { contact }
    });

  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating contact',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Respond to contact
exports.respondToContact = async (req, res) => {
  try {
    const { responseMessage } = req.body;
    const userId = req.user.userId;

    if (!responseMessage) {
      return res.status(400).json({
        success: false,
        message: 'Response message is required'
      });
    }

    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    // Mark as responded
    contact.markAsResponded(responseMessage, userId);
    await contact.save();

    // Send response email to user
    try {
      await sendContactResponse(
        contact.email,
        contact.name,
        contact.subject,
        responseMessage,
        req.user.name
      );
    } catch (emailError) {
      console.error('Response email error:', emailError);
    }

    res.status(200).json({
      success: true,
      message: 'Response sent successfully',
      data: { contact }
    });

  } catch (error) {
    console.error('Respond to contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while responding to contact',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Add note to contact
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

    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    contact.notes.push({
      note,
      addedBy: userId
    });

    await contact.save();

    // Populate the addedBy field for the response
    await contact.populate('notes.addedBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Note added successfully',
      data: { contact }
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

// Archive contact
exports.archiveContact = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { isArchived: true },
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Contact archived successfully',
      data: { contact }
    });

  } catch (error) {
    console.error('Archive contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while archiving contact',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete contact (admin only)
exports.deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Contact deleted successfully'
    });

  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting contact',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get contact statistics
exports.getContactStats = async (req, res) => {
  try {
    const stats = await Contact.getStats();

    // Additional statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const contactsToday = await Contact.countDocuments({
      createdAt: { $gte: today }
    });

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const contactsThisWeek = await Contact.countDocuments({
      createdAt: { $gte: weekAgo }
    });

    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    
    const contactsThisMonth = await Contact.countDocuments({
      createdAt: { $gte: monthAgo }
    });

    // Response time statistics
    const respondedContacts = await Contact.find({
      status: 'responded',
      'response.respondedAt': { $exists: true }
    });

    const avgResponseTime = respondedContacts.length > 0 
      ? respondedContacts.reduce((acc, contact) => {
          const responseTime = contact.response.respondedAt - contact.createdAt;
          return acc + (responseTime / (1000 * 60 * 60 * 24)); // Convert to days
        }, 0) / respondedContacts.length
      : 0;

    // Contacts by day for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const contactsByDay = await Contact.aggregate([
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
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          total: stats.total,
          today: contactsToday,
          thisWeek: contactsThisWeek,
          thisMonth: contactsThisMonth,
          avgResponseTime: avgResponseTime.toFixed(2)
        },
        byStatus: stats.byStatus,
        byPriority: stats.byPriority,
        byInterest: stats.byInterest,
        contactsByDay
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

// Bulk update contacts
exports.bulkUpdateContacts = async (req, res) => {
  try {
    const { contactIds, action, data } = req.body;

    if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Contact IDs are required'
      });
    }

    let update = {};
    let message = '';

    switch (action) {
      case 'update-status':
        update = { status: data.status };
        message = 'Contacts status updated successfully';
        break;
      case 'update-priority':
        update = { priority: data.priority };
        message = 'Contacts priority updated successfully';
        break;
      case 'assign-to':
        update = { assignedTo: data.assignedTo };
        message = 'Contacts assigned successfully';
        break;
      case 'add-tags':
        update = { $addToSet: { tags: { $each: data.tags } } };
        message = 'Tags added to contacts successfully';
        break;
      case 'archive':
        update = { isArchived: true };
        message = 'Contacts archived successfully';
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action'
        });
    }

    const result = await Contact.updateMany(
      { _id: { $in: contactIds } },
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
    console.error('Bulk update contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while performing bulk update',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};