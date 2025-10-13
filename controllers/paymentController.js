const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { sendPaymentConfirmation, sendPaymentReceipt } = require('../utils/sendEmail');

// Process Stripe payment
exports.processStripePayment = async (req, res) => {
  try {
    const { orderId, paymentMethodId, cardHolder, saveCard } = req.body;
    const userId = req.user.userId;

    // Validate order
    const order = await Order.findById(orderId).populate('items.product');
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to pay for this order'
      });
    }

    if (order.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Order is already paid'
      });
    }

    // Create or retrieve Stripe customer
    let customer;
    if (saveCard) {
      customer = await stripe.customers.create({
        email: req.user.email,
        name: cardHolder,
        metadata: {
          userId: userId.toString()
        }
      });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.total * 100), // Convert to cents
      currency: order.currency.toLowerCase(),
      payment_method: paymentMethodId,
      customer: customer?.id,
      confirm: true,
      return_url: `${process.env.FRONTEND_URL}/payment/success`,
      metadata: {
        orderId: orderId.toString(),
        userId: userId.toString()
      }
    });

    // Create payment record
    const payment = new Payment({
      user: userId,
      order: orderId,
      amount: order.total,
      currency: order.currency,
      paymentMethod: 'stripe',
      stripePaymentIntentId: paymentIntent.id,
      stripeCustomerId: customer?.id,
      cardHolder: cardHolder,
      status: paymentIntent.status === 'succeeded' ? 'completed' : 'processing'
    });

    await payment.save();

    // Update order payment status
    if (paymentIntent.status === 'succeeded') {
      order.paymentStatus = 'paid';
      order.paidAt = new Date();
      order.payment = payment._id;
      await order.save();

      // Update inventory
      await updateInventory(order.items);

      // Send confirmation email
      await sendPaymentConfirmation(req.user.email, req.user.name, order, payment);
    }

    res.status(200).json({
      success: true,
      message: 'Payment processed successfully',
      data: {
        paymentId: payment._id,
        clientSecret: paymentIntent.client_secret,
        status: paymentIntent.status
      }
    });

  } catch (error) {
    console.error('Stripe payment error:', error);
    
    // Create failed payment record
    if (req.body.orderId) {
      const failedPayment = new Payment({
        user: req.user.userId,
        order: req.body.orderId,
        amount: 0,
        currency: 'USD',
        paymentMethod: 'stripe',
        status: 'failed',
        metadata: { error: error.message }
      });
      await failedPayment.save();
    }

    res.status(500).json({
      success: false,
      message: 'Payment processing failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Process Paypack payment (MTN, Airtel, Tigo)
exports.processPaypackPayment = async (req, res) => {
  try {
    const { orderId, mobileNumber, provider } = req.body;
    const userId = req.user.userId;

    // Validate order
    const order = await Order.findById(orderId).populate('items.product');
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to pay for this order'
      });
    }

    if (order.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Order is already paid'
      });
    }

    // Simulate Paypack API call (replace with actual Paypack API)
    const paypackResponse = await simulatePaypackPayment({
      mobileNumber,
      provider,
      amount: order.total,
      currency: order.currency
    });

    // Create payment record
    const payment = new Payment({
      user: userId,
      order: orderId,
      amount: order.total,
      currency: order.currency,
      paymentMethod: `paypack-${provider}`,
      paypackTransactionId: paypackResponse.transactionId,
      paypackReference: paypackResponse.reference,
      mobileNumber: mobileNumber,
      provider: provider,
      status: paypackResponse.status === 'success' ? 'completed' : 'failed'
    });

    await payment.save();

    if (paypackResponse.status === 'success') {
      // Update order payment status
      order.paymentStatus = 'paid';
      order.paidAt = new Date();
      order.payment = payment._id;
      await order.save();

      // Update inventory
      await updateInventory(order.items);

      // Send confirmation email
      await sendPaymentConfirmation(req.user.email, req.user.name, order, payment);
    }

    res.status(200).json({
      success: paypackResponse.status === 'success',
      message: paypackResponse.message,
      data: {
        paymentId: payment._id,
        transactionId: paypackResponse.transactionId,
        reference: paypackResponse.reference,
        status: payment.status
      }
    });

  } catch (error) {
    console.error('Paypack payment error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Mobile payment processing failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get payment status
exports.getPaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId)
      .populate('user', 'name email')
      .populate('order');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // For Stripe payments, check current status
    if (payment.paymentMethod === 'stripe' && payment.stripePaymentIntentId) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(
          payment.stripePaymentIntentId
        );
        
        if (paymentIntent.status !== payment.status) {
          payment.status = paymentIntent.status;
          await payment.save();
        }
      } catch (stripeError) {
        console.error('Stripe status check error:', stripeError);
      }
    }

    res.status(200).json({
      success: true,
      data: { payment }
    });

  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get payment statistics
exports.getPaymentStats = async (req, res) => {
  try {
    const { timeframe = 'daily' } = req.query;

    const stats = await Payment.getPaymentStats(timeframe);

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Get payment stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get inventory statistics
exports.getInventoryStats = async (req, res) => {
  try {
    const stats = await Product.getInventoryStats();

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Get inventory stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching inventory statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get order statistics
exports.getOrderStats = async (req, res) => {
  try {
    const { timeframe = 'daily' } = req.query;

    const stats = await Order.getOrderStats(timeframe);

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Helper function to update inventory
const updateInventory = async (orderItems) => {
  for (const item of orderItems) {
    await Product.findByIdAndUpdate(
      item.product._id,
      { $inc: { stock: -item.quantity } }
    );
  }
};

// Helper function to simulate Paypack payment (replace with actual API)
const simulatePaypackPayment = async (paymentData) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Simulate successful payment 90% of the time
  const isSuccess = Math.random() > 0.1;
  
  return {
    transactionId: `PK${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
    reference: `REF${Date.now()}`,
    status: isSuccess ? 'success' : 'failed',
    message: isSuccess ? 'Payment processed successfully' : 'Payment failed. Please try again.'
  };
};