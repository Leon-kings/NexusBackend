const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const PaypackJs = require("paypack-js")?.default;
require('dotenv').config();
const crypto = require('crypto');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { sendPaymentConfirmation } = require('../utils/sendEmail');

// Initialize Paypack client if credentials are available
let paypack;
if (process.env.PAYPACK_CLIENT_ID && process.env.PAYPACK_CLIENT_SECRET) {
  paypack = new PaypackJs({ 
    client_id: process.env.PAYPACK_CLIENT_ID, 
    client_secret: process.env.PAYPACK_CLIENT_SECRET 
  });
  console.log('Paypack client initialized successfully');
} else {
  console.warn('Paypack credentials not found. Paypack payments will be disabled.');
}

// Initialize Stripe
console.log('Stripe initialized:', process.env.STRIPE_SECRET_KEY ? 'Yes' : 'No');

// Process payment with automatic provider selection
exports.processPayment = async (req, res) => {
  try {
    const { orderId, paymentMethod, paymentData } = req.body;
    const userId = req.user.userId;

    console.log('Payment initiated:', { 
      orderId, 
      paymentMethod, 
      userId,
      hasPaypack: !!paypack,
      hasStripe: !!process.env.STRIPE_SECRET_KEY
    });

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

    let paymentResult;

    // Route to appropriate payment processor
    switch (paymentMethod) {
      case 'stripe':
        if (!process.env.STRIPE_SECRET_KEY) {
          return res.status(400).json({
            success: false,
            message: 'Stripe payments are not configured'
          });
        }
        paymentResult = await processStripePayment(order, paymentData, req.user);
        break;

      case 'paypack':
        if (!paypack) {
          return res.status(400).json({
            success: false,
            message: 'Mobile payments are not configured'
          });
        }
        paymentResult = await processPaypackPayment(order, paymentData, req.user);
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Unsupported payment method'
        });
    }

    // Create payment record
    const payment = new Payment({
      user: userId,
      order: orderId,
      amount: order.total,
      currency: order.currency,
      paymentMethod: paymentMethod,
      status: paymentResult.status,
      ...paymentResult.paymentData,
      metadata: {
        provider: paymentMethod,
        ...paymentResult.metadata
      }
    });

    await payment.save();
    console.log('Payment record created:', payment._id);

    // Handle immediate successful payments
    if (paymentResult.status === 'completed') {
      await handleSuccessfulPayment(order, payment, req.user);
    }

    res.status(200).json({
      success: true,
      message: paymentResult.message,
      data: {
        paymentId: payment._id,
        status: payment.status,
        provider: paymentMethod,
        ...paymentResult.responseData
      }
    });

  } catch (error) {
    console.error('Payment processing error:', error);
    
    // Create failed payment record
    if (req.body.orderId) {
      const failedPayment = new Payment({
        user: req.user.userId,
        order: req.body.orderId,
        amount: 0,
        currency: req.body.paymentData?.currency || 'USD',
        paymentMethod: req.body.paymentMethod,
        status: 'failed',
        metadata: { 
          error: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }
      });
      await failedPayment.save();
    }

    res.status(500).json({
      success: false,
      message: 'Payment processing failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Payment service temporarily unavailable'
    });
  }
};

// Process Stripe payment
const processStripePayment = async (order, paymentData, user) => {
  try {
    const { paymentMethodId, cardHolder, saveCard } = paymentData;

    console.log('Processing Stripe payment for order:', order._id);

    // Create or retrieve Stripe customer
    let customer;
    if (saveCard) {
      customer = await stripe.customers.create({
        email: user.email,
        name: cardHolder,
        metadata: {
          userId: user.userId.toString()
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
        orderId: order._id.toString(),
        userId: user.userId.toString()
      }
    });

    console.log('Stripe payment intent created:', paymentIntent.id);

    const isCompleted = paymentIntent.status === 'succeeded';

    return {
      status: isCompleted ? 'completed' : 'processing',
      message: isCompleted ? 'Payment processed successfully' : 'Payment processing',
      paymentData: {
        stripePaymentIntentId: paymentIntent.id,
        stripeCustomerId: customer?.id,
        cardHolder: cardHolder,
      },
      responseData: {
        clientSecret: paymentIntent.client_secret,
        requiresAction: paymentIntent.status === 'requires_action',
      },
      metadata: {
        stripeStatus: paymentIntent.status,
        amountReceived: paymentIntent.amount_received
      }
    };

  } catch (error) {
    console.error('Stripe payment processing error:', error);
    throw new Error(`Stripe payment failed: ${error.message}`);
  }
};

// Process Paypack payment
const processPaypackPayment = async (order, paymentData, user) => {
  try {
    const { mobileNumber, provider } = paymentData;

    console.log('Processing Paypack payment for order:', order._id);

    // Validate mobile number format for Rwanda
    const rwandaRegex = /^(078|079|072|073)\d{7}$/;
    if (!rwandaRegex.test(mobileNumber)) {
      throw new Error('Please provide a valid Rwanda mobile number (078, 079, 072, or 073)');
    }

    // Convert currency to RWF if needed (Paypack typically uses RWF)
    const amount = order.currency === 'RWF' ? order.total : Math.round(order.total * 1200); // Approximate conversion

    // Process Paypack payment
    const paypackResponse = await paypack.cashin({
      number: mobileNumber,
      amount: amount,
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    });

    console.log('Paypack API response:', paypackResponse);

    const isCompleted = paypackResponse.data.status === 'success';

    return {
      status: isCompleted ? 'completed' : 'processing',
      message: isCompleted ? 'Payment processed successfully' : 'Payment initiated. Please confirm on your mobile device.',
      paymentData: {
        paypackTransactionId: paypackResponse.data.ref,
        paypackReference: paypackResponse.data.ref,
        mobileNumber: mobileNumber,
        provider: provider,
      },
      responseData: {
        transactionId: paypackResponse.data.ref,
        reference: paypackResponse.data.ref,
        instructions: isCompleted ? undefined : 'Check your phone to confirm the payment'
      },
      metadata: {
        paypackResponse: paypackResponse.data,
        convertedAmount: amount
      }
    };

  } catch (error) {
    console.error('Paypack payment processing error:', error);
    throw new Error(`Mobile payment failed: ${error.message}`);
  }
};

// Get payment methods configuration
exports.getPaymentMethods = async (req, res) => {
  try {
    const paymentMethods = [];

    // Check Stripe availability
    if (process.env.STRIPE_SECRET_KEY) {
      paymentMethods.push({
        id: 'stripe',
        name: 'Credit/Debit Card',
        type: 'card',
        currencies: ['USD', 'EUR', 'GBP'],
        supportedCards: ['visa', 'mastercard', 'amex'],
        enabled: true
      });
    }

    // Check Paypack availability
    if (paypack) {
      paymentMethods.push({
        id: 'paypack',
        name: 'Mobile Money',
        type: 'mobile',
        currencies: ['RWF'],
        providers: ['mtn', 'airtel', 'tigo'],
        enabled: true
      });
    }

    console.log('Available payment methods:', paymentMethods);

    res.status(200).json({
      success: true,
      data: {
        paymentMethods,
        defaultCurrency: process.env.DEFAULT_CURRENCY || 'USD'
      }
    });

  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment methods'
    });
  }
};

// Get payment status
exports.getPaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;

    console.log('Checking payment status:', paymentId);

    const payment = await Payment.findById(paymentId)
      .populate('user', 'name email')
      .populate('order');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Check current status with provider if still processing
    if (payment.status === 'processing') {
      try {
        let currentStatus = payment.status;

        if (payment.paymentMethod === 'stripe' && payment.stripePaymentIntentId) {
          const paymentIntent = await stripe.paymentIntents.retrieve(
            payment.stripePaymentIntentId
          );
          currentStatus = paymentIntent.status === 'succeeded' ? 'completed' : 'processing';
        } 
        else if (payment.paymentMethod === 'paypack' && payment.paypackTransactionId) {
          // Implement Paypack transaction status check if available
          // currentStatus = await checkPaypackTransactionStatus(payment.paypackTransactionId);
        }

        // Update payment status if changed
        if (currentStatus !== payment.status) {
          payment.status = currentStatus;
          await payment.save();

          // Handle successful payment
          if (currentStatus === 'completed' && payment.order) {
            await handleSuccessfulPayment(payment.order, payment, payment.user);
          }
        }
      } catch (statusError) {
        console.error('Payment status check error:', statusError);
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

// Webhook handler for both Stripe and Paypack
exports.handleWebhook = async (req, res) => {
  try {
    const provider = req.headers['x-paypack-signature'] ? 'paypack' : 'stripe';
    
    console.log(`Webhook received from ${provider}:`, {
      headers: req.headers,
      body: req.body
    });

    if (provider === 'stripe') {
      await handleStripeWebhook(req, res);
    } else {
      await handlePaypackWebhook(req, res);
    }

  } catch (error) {
    console.error('Webhook handling error:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook processing failed'
    });
  }
};

// Stripe webhook handler
const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('Stripe webhook event:', event.type);

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handleStripePaymentSuccess(event.data.object);
      break;
    case 'payment_intent.payment_failed':
      await handleStripePaymentFailed(event.data.object);
      break;
    default:
      console.log(`Unhandled Stripe event type: ${event.type}`);
  }

  res.json({ received: true });
};

// Paypack webhook handler
const handlePaypackWebhook = async (req, res) => {
  const signature = req.headers['x-paypack-signature'];
  const rawBody = JSON.stringify(req.body);

  // Verify webhook signature
  if (!verifyPaypackSignature(rawBody, signature)) {
    console.error('Invalid Paypack webhook signature');
    return res.status(403).json({
      success: false,
      message: 'Invalid signature'
    });
  }

  const event = req.body;
  console.log('Paypack webhook event:', event);

  // Handle Paypack events
  const { event: eventType, data } = event;
  switch (eventType) {
    case 'cashin.success':
      await handlePaypackPaymentSuccess(data);
      break;
    case 'cashin.failed':
      await handlePaypackPaymentFailed(data);
      break;
    default:
      console.log('Unhandled Paypack event type:', eventType);
  }

  res.status(200).json({ success: true, message: 'Webhook processed' });
};

// Helper function to handle successful payments
const handleSuccessfulPayment = async (order, payment, user) => {
  try {
    // Update order payment status
    order.paymentStatus = 'paid';
    order.paidAt = new Date();
    order.payment = payment._id;
    await order.save();

    // Update inventory
    await updateInventory(order.items);

    // Send confirmation email
    await sendPaymentConfirmation(user.email, user.name, order, payment);

    console.log('Payment completed successfully:', {
      orderId: order._id,
      paymentId: payment._id,
      amount: payment.amount,
      provider: payment.paymentMethod
    });

  } catch (error) {
    console.error('Error handling successful payment:', error);
    throw error;
  }
};

// Stripe webhook handlers
const handleStripePaymentSuccess = async (paymentIntent) => {
  try {
    const payment = await Payment.findOne({ 
      stripePaymentIntentId: paymentIntent.id 
    }).populate('order').populate('user');

    if (payment && payment.status !== 'completed') {
      payment.status = 'completed';
      await payment.save();

      if (payment.order) {
        await handleSuccessfulPayment(payment.order, payment, payment.user);
      }
    }
  } catch (error) {
    console.error('Error handling Stripe payment success:', error);
  }
};

const handleStripePaymentFailed = async (paymentIntent) => {
  try {
    const payment = await Payment.findOne({ 
      stripePaymentIntentId: paymentIntent.id 
    });

    if (payment) {
      payment.status = 'failed';
      payment.metadata = { 
        ...payment.metadata, 
        failureReason: paymentIntent.last_payment_error?.message 
      };
      await payment.save();
    }
  } catch (error) {
    console.error('Error handling Stripe payment failure:', error);
  }
};

// Paypack webhook handlers
const handlePaypackPaymentSuccess = async (data) => {
  try {
    const payment = await Payment.findOne({ 
      paypackTransactionId: data.ref 
    }).populate('order').populate('user');

    if (payment && payment.status !== 'completed') {
      payment.status = 'completed';
      await payment.save();

      if (payment.order) {
        await handleSuccessfulPayment(payment.order, payment, payment.user);
      }
    }
  } catch (error) {
    console.error('Error handling Paypack payment success:', error);
  }
};

const handlePaypackPaymentFailed = async (data) => {
  try {
    const payment = await Payment.findOne({ 
      paypackTransactionId: data.ref 
    });

    if (payment) {
      payment.status = 'failed';
      payment.metadata = { ...payment.metadata, failureReason: data.reason };
      await payment.save();
    }
  } catch (error) {
    console.error('Error handling Paypack payment failure:', error);
  }
};

// Helper function to verify Paypack signature
const verifyPaypackSignature = (rawBody, signature) => {
  try {
    const secret = process.env.PAYPACK_WEBHOOK_SECRET;
    if (!secret) {
      console.warn('Paypack webhook secret not configured');
      return true; // Return true in development if secret not set
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Paypack signature verification error:', error);
    return false;
  }
};

// Helper function to update inventory
const updateInventory = async (orderItems) => {
  try {
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(
        item.product._id,
        { $inc: { stock: -item.quantity } }
      );
    }
    console.log('Inventory updated successfully');
  } catch (error) {
    console.error('Inventory update error:', error);
    throw error;
  }
};

module.exports = exports;