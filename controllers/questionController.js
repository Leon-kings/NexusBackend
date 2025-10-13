const Question = require('../models/Question');
const { sendQuestionConfirmation, sendQuestionAnswer } = require('../mails/sendEmail');

// Create new question
exports.createQuestion = async (req, res) => {
  try {
    const {
      name,
      email,
      subject,
      message,
      category
    } = req.body;

    // Validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, subject, and message are required'
      });
    }

    // Create question
    const question = new Question({
      name,
      email,
      subject,
      message,
      category,
      source: req.body.source || 'website'
    });

    await question.save();

    // Send confirmation email to user
    try {
      await sendQuestionConfirmation(question.email, question.name, question.subject, question._id);
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Your question has been submitted successfully! We will get back to you soon.',
      data: { 
        questionId: question._id,
        category: question.category
      }
    });

  } catch (error) {
    console.error('Create question error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while submitting question',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all questions (with filtering, sorting, pagination)
exports.getAllQuestions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      category,
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
        { subject: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;
    if (assignedTo) query.assignedTo = assignedTo;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const questions = await Question.find(query)
      .populate('assignedTo', 'name email')
      .populate('answer.answeredBy', 'name email')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Question.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        questions,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching questions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get question by ID
exports.getQuestionById = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('answer.answeredBy', 'name email')
      .populate('notes.addedBy', 'name email');

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { question }
    });

  } catch (error) {
    console.error('Get question error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching question',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update question
exports.updateQuestion = async (req, res) => {
  try {
    const {
      status,
      priority,
      category,
      assignedTo,
      tags,
      followUpDate
    } = req.body;

    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Update fields
    if (status) question.status = status;
    if (priority) question.priority = priority;
    if (category) question.category = category;
    if (assignedTo) question.assignedTo = assignedTo;
    if (tags) question.tags = tags;
    if (followUpDate) question.followUpDate = followUpDate;

    await question.save();

    res.status(200).json({
      success: true,
      message: 'Question updated successfully',
      data: { question }
    });

  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating question',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Answer question
exports.answerQuestion = async (req, res) => {
  try {
    const { answerMessage } = req.body;
    const userId = req.user.userId;

    if (!answerMessage) {
      return res.status(400).json({
        success: false,
        message: 'Answer message is required'
      });
    }

    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Mark as answered
    question.markAsAnswered(answerMessage, userId);
    await question.save();

    // Send answer email to user
    try {
      await sendQuestionAnswer(
        question.email,
        question.name,
        question.subject,
        answerMessage,
        req.user.name
      );
    } catch (emailError) {
      console.error('Answer email error:', emailError);
    }

    res.status(200).json({
      success: true,
      message: 'Answer sent successfully',
      data: { question }
    });

  } catch (error) {
    console.error('Answer question error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while answering question',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Add note to question
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

    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    question.notes.push({
      note,
      addedBy: userId
    });

    await question.save();

    // Populate the addedBy field for the response
    await question.populate('notes.addedBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Note added successfully',
      data: { question }
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

// Archive question
exports.archiveQuestion = async (req, res) => {
  try {
    const question = await Question.findByIdAndUpdate(
      req.params.id,
      { isArchived: true },
      { new: true }
    );

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Question archived successfully',
      data: { question }
    });

  } catch (error) {
    console.error('Archive question error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while archiving question',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete question (admin only)
exports.deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Question deleted successfully'
    });

  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting question',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get question statistics
exports.getQuestionStats = async (req, res) => {
  try {
    const stats = await Question.getStats();

    // Additional statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const questionsToday = await Question.countDocuments({
      createdAt: { $gte: today }
    });

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const questionsThisWeek = await Question.countDocuments({
      createdAt: { $gte: weekAgo }
    });

    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    
    const questionsThisMonth = await Question.countDocuments({
      createdAt: { $gte: monthAgo }
    });

    // Response time statistics
    const answeredQuestions = await Question.find({
      status: 'answered',
      'answer.answeredAt': { $exists: true }
    });

    const avgResponseTime = answeredQuestions.length > 0 
      ? answeredQuestions.reduce((acc, question) => {
          const responseTime = question.answer.answeredAt - question.createdAt;
          return acc + (responseTime / (1000 * 60 * 60 * 24)); // Convert to days
        }, 0) / answeredQuestions.length
      : 0;

    // Questions by day for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const questionsByDay = await Question.aggregate([
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
          today: questionsToday,
          thisWeek: questionsThisWeek,
          thisMonth: questionsThisMonth,
          avgResponseTime: avgResponseTime.toFixed(2)
        },
        byStatus: stats.byStatus,
        byCategory: stats.byCategory,
        byPriority: stats.byPriority,
        questionsByDay
      }
    });

  } catch (error) {
    console.error('Question stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching question statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Bulk update questions
exports.bulkUpdateQuestions = async (req, res) => {
  try {
    const { questionIds, action, data } = req.body;

    if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Question IDs are required'
      });
    }

    let update = {};
    let message = '';

    switch (action) {
      case 'update-status':
        update = { status: data.status };
        message = 'Questions status updated successfully';
        break;
      case 'update-priority':
        update = { priority: data.priority };
        message = 'Questions priority updated successfully';
        break;
      case 'update-category':
        update = { category: data.category };
        message = 'Questions category updated successfully';
        break;
      case 'assign-to':
        update = { assignedTo: data.assignedTo };
        message = 'Questions assigned successfully';
        break;
      case 'add-tags':
        update = { $addToSet: { tags: { $each: data.tags } } };
        message = 'Tags added to questions successfully';
        break;
      case 'archive':
        update = { isArchived: true };
        message = 'Questions archived successfully';
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action'
        });
    }

    const result = await Question.updateMany(
      { _id: { $in: questionIds } },
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
    console.error('Bulk update questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while performing bulk update',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};