require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const PaypackJs = require('paypack-js')?.default;
const crypto = require('crypto');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { sendPaymentConfirmation } = require('../mails/sendEmail');

// Initialize Paypack client
let paypack;
if (process.env.PAYPACK_CLIENT_ID && process.env.PAYPACK_CLIENT_SECRET) {
  paypack = new PaypackJs({
    client_id: process.env.PAYPACK_CLIENT_ID,
    client_secret: process.env.PAYPACK_CLIENT_SECRET,
  });
  console.log('✅ Paypack client initialized successfully');
} else {
  console.warn('⚠️ Paypack credentials missing — mobile payments disabled.');
}

console.log('✅ Stripe initialized:', !!process.env.STRIPE_SECRET_KEY);

// =============================
// MAIN: Process Payment
// =============================
exports.processPayment = async (req, res) => {
  try {
    const { orderId, paymentMethod, paymentData } = req.body;
    const userId = req.user.userId;

    console.log('Payment initiated:', {
      orderId,
      paymentMethod,
      userId,
    });

    const order = await Order.findById(orderId).populate('items.product');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.user.toString() !== userId)
      return res.status(403).json({ success: false, message: 'Unauthorized access' });
    if (order.paymentStatus === 'paid')
      return res.status(400).json({ success: false, message: 'Order already paid' });

    let paymentResult;

    switch (paymentMethod) {
      case 'stripe':
        if (!process.env.STRIPE_SECRET_KEY)
          return res.status(400).json({ success: false, message: 'Stripe not configured' });
        paymentResult = await processStripePayment(order, paymentData, req.user);
        break;

      case 'paypack':
        if (!paypack)
          return res.status(400).json({ success: false, message: 'Paypack not configured' });
        paymentResult = await processPaypackPayment(order, paymentData, req.user);
        break;

      default:
        return res.status(400).json({ success: false, message: 'Unsupported payment method' });
    }

    const payment = new Payment({
      user: userId,
      order: orderId,
      amount: order.total,
      currency: order.currency,
      paymentMethod,
      status: paymentResult.status,
      ...paymentResult.paymentData,
      metadata: { provider: paymentMethod, ...paymentResult.metadata },
    });

    await payment.save();
    console.log('💳 Payment record saved:', payment._id);

    if (paymentResult.status === 'completed') {
      await handleSuccessfulPayment(order, payment, req.user);
    }

    return res.status(200).json({
      success: true,
      message: paymentResult.message,
      data: {
        paymentId: payment._id,
        status: payment.status,
        provider: paymentMethod,
        ...paymentResult.responseData,
      },
    });
  } catch (error) {
    console.error('❌ Payment processing error:', error);

    if (req.body?.orderId) {
      await Payment.create({
        user: req.user.userId,
        order: req.body.orderId,
        amount: 0,
        currency: req.body.paymentData?.currency || 'USD',
        paymentMethod: req.body.paymentMethod,
        status: 'failed',
        metadata: {
          error: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        },
      });
    }

    res.status(500).json({
      success: false,
      message: 'Payment processing failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// =============================
// STRIPE PAYMENT
// =============================
const processStripePayment = async (order, paymentData, user) => {
  try {
    const { paymentMethodId, cardHolder, saveCard } = paymentData;
    console.log('Processing Stripe payment for order:', order._id);

    let customer = null;
    if (saveCard) {
      customer = await stripe.customers.create({
        email: user.email,
        name: cardHolder,
        metadata: { userId: user.userId.toString() },
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.total * 100),
      currency: order.currency.toLowerCase(),
      payment_method: paymentMethodId,
      customer: customer?.id,
      confirm: true,
      return_url: `${process.env.FRONTEND_URL}/payment/success`,
      metadata: {
        orderId: order._id.toString(),
        userId: user.userId.toString(),
      },
    });

    const completed = paymentIntent.status === 'succeeded';
    return {
      status: completed ? 'completed' : 'processing',
      message: completed ? 'Payment successful' : 'Processing payment',
      paymentData: {
        stripePaymentIntentId: paymentIntent.id,
        stripeCustomerId: customer?.id,
        cardHolder,
      },
      responseData: {
        clientSecret: paymentIntent.client_secret,
        requiresAction: paymentIntent.status === 'requires_action',
      },
      metadata: {
        stripeStatus: paymentIntent.status,
        amountReceived: paymentIntent.amount_received,
      },
    };
  } catch (error) {
    console.error('Stripe error:', error);
    throw new Error(`Stripe payment failed: ${error.message}`);
  }
};

// =============================
// PAYPACK PAYMENT
// =============================
const processPaypackPayment = async (order, paymentData, user) => {
  try {
    const { mobileNumber, provider } = paymentData;
    console.log('Processing Paypack payment for order:', order._id);

    const rwandaRegex = /^(078|794|457|7)\d{7}$/;
    if (!rwandaRegex.test(mobileNumber)) {
      throw new Error('Invalid Rwanda mobile number format');
    }

    const amount = order.currency === 'RWF' ? order.total : Math.round(order.total * 1200);
    const paypackResponse = await paypack.cashin({
      number: mobileNumber,
      amount,
    });

    const completed = paypackResponse?.data?.status === 'success';

    return {
      status: completed ? 'completed' : 'processing',
      message: completed
        ? 'Mobile payment successful'
        : 'Please confirm on your phone to complete payment.',
      paymentData: {
        paypackTransactionId: paypackResponse.data.ref,
        mobileNumber,
        provider,
      },
      responseData: {
        transactionId: paypackResponse.data.ref,
        instructions: completed ? undefined : 'Check your phone to approve payment',
      },
      metadata: {
        paypackResponse: paypackResponse.data,
        convertedAmount: amount,
      },
    };
  } catch (error) {
    console.error('Paypack error:', error);
    throw new Error(`Mobile payment failed: ${error.message}`);
  }
};

// =============================
// PAYMENT STATUS
// =============================
exports.getPaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findById(paymentId)
      .populate('user', 'name email')
      .populate('order');

    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });

    if (payment.status === 'processing') {
      try {
        let newStatus = payment.status;

        if (payment.paymentMethod === 'stripe' && payment.stripePaymentIntentId) {
          const intent = await stripe.paymentIntents.retrieve(payment.stripePaymentIntentId);
          newStatus = intent.status === 'succeeded' ? 'completed' : 'processing';
        }

        if (newStatus !== payment.status) {
          payment.status = newStatus;
          await payment.save();
          if (newStatus === 'completed') {
            await handleSuccessfulPayment(payment.order, payment, payment.user);
          }
        }
      } catch (err) {
        console.error('Status check failed:', err);
      }
    }

    res.json({ success: true, data: { payment } });
  } catch (error) {
    console.error('Payment status error:', error);
    res.status(500).json({ success: false, message: 'Error fetching payment status' });
  }
};

// =============================
// SUCCESS HANDLER
// =============================
const handleSuccessfulPayment = async (order, payment, user) => {
  try {
    order.paymentStatus = 'paid';
    order.paidAt = new Date();
    order.payment = payment._id;
    await order.save();

    await updateInventory(order.items);
    await sendPaymentConfirmation(user.email, user.name, order, payment);

    console.log('✅ Payment marked as completed:', {
      orderId: order._id,
      paymentId: payment._id,
    });
  } catch (error) {
    console.error('Error finalizing payment:', error);
  }
};

// =============================
// INVENTORY UPDATE
// =============================
const updateInventory = async (items) => {
  for (const item of items) {
    await Product.findByIdAndUpdate(item.product._id, { $inc: { stock: -item.quantity } });
  }
  console.log('Inventory updated successfully');
};
