const nodemailer = require('nodemailer');

// Create transporter - FIXED: createTransporter -> createTransport
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send verification email
exports.sendVerificationEmail = async (email, verificationCode, name) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Your App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Account - Action Required',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                .container { max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; }
                .header { background: linear-gradient(135deg, #10B981, #047857); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                .code { font-size: 32px; font-weight: bold; text-align: center; color: #10B981; margin: 20px 0; padding: 15px; background: white; border-radius: 8px; border: 2px dashed #10B981; }
                .button { background: #10B981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; }
                .footer { text-align: center; margin-top: 20px; color: #6B7280; font-size: 14px; }
                .expiry { color: #EF4444; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Verify Your Email Address</h1>
                </div>
                <div class="content">
                    <h2>Hello ${name},</h2>
                    <p>Thank you for registering! To complete your account setup, please use the verification code below:</p>
                    
                    <div class="code">${verificationCode}</div>
                    
                    <p class="expiry">⚠️ This code will expire in 24 hours.</p>
                    <p>If you didn't create an account, please ignore this email.</p>
                    
                    <p>Best regards,<br>Your App Team</p>
                </div>
                <div class="footer">
                    <p>© 2024 Your App. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Verification email sent to ${email}`, info.messageId);
    return true;
    
  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    throw new Error('Failed to send verification email');
  }
};

// Send welcome email
exports.sendWelcomeEmail = async (email, name) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Your App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Welcome to Our Platform! 🎉',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                .container { max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; }
                .header { background: linear-gradient(135deg, #10B981, #047857); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                .button { background: #10B981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; }
                .footer { text-align: center; margin-top: 20px; color: #6B7280; font-size: 14px; }
                .features { margin: 20px 0; }
                .feature-item { background: white; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 4px solid #10B981; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Welcome Aboard! 🎉</h1>
                </div>
                <div class="content">
                    <h2>Hello ${name},</h2>
                    <p>Congratulations! Your account has been successfully verified and is now active.</p>
                    
                    <div class="features">
                        <div class="feature-item">
                            <strong>🚀 Get Started</strong>
                            <p>Explore all the features available to you.</p>
                        </div>
                        <div class="feature-item">
                            <strong>🔒 Secure Account</strong>
                            <p>Your account is protected with the latest security measures.</p>
                        </div>
                        <div class="feature-item">
                            <strong>📞 Support</strong>
                            <p>We're here to help if you have any questions.</p>
                        </div>
                    </div>
                    
                    <p>If you have any questions, feel free to contact our support team.</p>
                    
                    <p>Best regards,<br>Your App Team</p>
                </div>
                <div class="footer">
                    <p>© 2024 Your App. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${email}`, info.messageId);
    return true;
    
  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    throw new Error('Failed to send welcome email');
  }
};

// Send password reset email
exports.sendPasswordResetEmail = async (email, resetToken, name) => {
  try {
    const transporter = createTransporter();
    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `"Your App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                .container { max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; }
                .header { background: linear-gradient(135deg, #EF4444, #DC2626); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                .button { background: #EF4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
                .footer { text-align: center; margin-top: 20px; color: #6B7280; font-size: 14px; }
                .warning { color: #EF4444; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Password Reset</h1>
                </div>
                <div class="content">
                    <h2>Hello ${name},</h2>
                    <p>We received a request to reset your password. Click the button below to create a new password:</p>
                    
                    <div style="text-align: center;">
                        <a href="${resetLink}" class="button">Reset Your Password</a>
                    </div>
                    
                    <p class="warning">⚠️ This link will expire in 1 hour for security reasons.</p>
                    
                    <p>If you didn't request this reset, please ignore this email and your password will remain unchanged.</p>
                    
                    <p>Best regards,<br>Your App Team</p>
                </div>
                <div class="footer">
                    <p>© 2024 Your App. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to ${email}`, info.messageId);
    return true;
    
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

// Send contact notification to admin
exports.sendContactNotification = async (contact) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Contact Form" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
      subject: `New Contact Form Submission: ${contact.subject}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                .container { max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; }
                .header { background: linear-gradient(135deg, #3B82F6, #1D4ED8); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                .field { margin-bottom: 15px; }
                .label { font-weight: bold; color: #374151; }
                .value { color: #6B7280; }
                .priority { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
                .priority-high { background: #FEF2F2; color: #DC2626; }
                .priority-medium { background: #FFFBEB; color: #D97706; }
                .priority-low { background: #F0FDF4; color: #16A34A; }
                .footer { text-align: center; margin-top: 20px; color: #6B7280; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>New Contact Submission</h1>
                </div>
                <div class="content">
                    <h2>Contact Details</h2>
                    
                    <div class="field">
                        <span class="label">Name:</span>
                        <span class="value">${contact.name}</span>
                    </div>
                    
                    <div class="field">
                        <span class="label">Email:</span>
                        <span class="value">${contact.email}</span>
                    </div>
                    
                    ${contact.phone ? `
                    <div class="field">
                        <span class="label">Phone:</span>
                        <span class="value">${contact.phone}</span>
                    </div>
                    ` : ''}
                    
                    ${contact.company ? `
                    <div class="field">
                        <span class="label">Company:</span>
                        <span class="value">${contact.company}</span>
                    </div>
                    ` : ''}
                    
                    <div class="field">
                        <span class="label">Subject:</span>
                        <span class="value">${contact.subject}</span>
                    </div>
                    
                    <div class="field">
                        <span class="label">Interest:</span>
                        <span class="value">${contact.interest}</span>
                    </div>
                    
                    <div class="field">
                        <span class="label">Budget:</span>
                        <span class="value">${contact.budget}</span>
                    </div>
                    
                    <div class="field">
                        <span class="label">Message:</span>
                        <div class="value" style="margin-top: 10px; padding: 15px; background: white; border-radius: 5px; border-left: 4px solid #3B82F6;">
                            ${contact.message.replace(/\n/g, '<br>')}
                        </div>
                    </div>
                    
                    <div style="margin-top: 25px; padding: 15px; background: #EFF6FF; border-radius: 5px;">
                        <p style="margin: 0; color: #1E40AF;">
                            <strong>Action Required:</strong> Please respond to this inquiry within 24 hours.
                        </p>
                    </div>
                </div>
                <div class="footer">
                    <p>© 2024 ${process.env.COMPANY_NAME || 'Your Company'}. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Contact notification sent for: ${contact.email}`, info.messageId);
    return true;
    
  } catch (error) {
    console.error('❌ Error sending contact notification:', error);
    throw new Error('Failed to send contact notification');
  }
};

// Send contact response to user
exports.sendContactResponse = async (userEmail, userName, subject, responseMessage = null, responderName = null) => {
  try {
    const transporter = createTransporter();

    const isAutoResponse = !responseMessage;
    const emailSubject = isAutoResponse 
      ? `We've received your message: ${subject}`
      : `Re: ${subject}`;

    const mailOptions = {
      from: `"${process.env.COMPANY_NAME || 'Your Company'}" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: emailSubject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                .container { max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; }
                .header { background: linear-gradient(135deg, #10B981, #047857); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                .response { background: white; padding: 20px; border-radius: 5px; border-left: 4px solid #10B981; margin: 20px 0; }
                .footer { text-align: center; margin-top: 20px; color: #6B7280; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>${isAutoResponse ? 'Thank You for Contacting Us' : 'Response to Your Inquiry'}</h1>
                </div>
                <div class="content">
                    <h2>Hello ${userName},</h2>
                    
                    ${isAutoResponse ? `
                    <p>Thank you for reaching out to us! We've received your message and our team will review it shortly.</p>
                    
                    <p><strong>Here's a summary of your inquiry:</strong></p>
                    <ul>
                        <li><strong>Subject:</strong> ${subject}</li>
                        <li><strong>Submitted:</strong> ${new Date().toLocaleDateString()}</li>
                    </ul>
                    
                    <p>We typically respond to all inquiries within 24 hours during business days.</p>
                    
                    <div style="margin-top: 25px; padding: 15px; background: #ECFDF5; border-radius: 5px;">
                        <p style="margin: 0; color: #047857;">
                            <strong>What happens next?</strong><br>
                            1. Our team will review your inquiry<br>
                            2. We'll assign it to the appropriate specialist<br>
                            3. You'll receive a detailed response soon
                        </p>
                    </div>
                    ` : `
                    <p>Thank you for your inquiry. Here's our response:</p>
                    
                    <div class="response">
                        ${responseMessage.replace(/\n/g, '<br>')}
                    </div>
                    
                    <p>If you have any further questions, please don't hesitate to reply to this email.</p>
                    
                    <p>Best regards,<br>
                    <strong>${responderName}</strong><br>
                    ${process.env.COMPANY_NAME || 'Your Company Team'}</p>
                    `}
                </div>
                <div class="footer">
                    <p>© 2024 ${process.env.COMPANY_NAME || 'Your Company'}. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Contact response sent to: ${userEmail}`, info.messageId);
    return true;
    
  } catch (error) {
    console.error('❌ Error sending contact response:', error);
    throw new Error('Failed to send contact response');
  }
};

// Generic email sender
exports.sendEmail = async (to, subject, html, text = null) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"${process.env.COMPANY_NAME || 'Your App'}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      text: text || subject // Fallback text content
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to}`, info.messageId);
    return info;
    
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw new Error('Failed to send email');
  }
};

// Verify email configuration
exports.verifyEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Email server is ready to send messages');
    return true;
  } catch (error) {
    console.error('❌ Email configuration error:', error);
    throw new Error('Email configuration failed');
  }
};

// Send question confirmation to user
exports.sendQuestionConfirmation = async (userEmail, userName, subject, questionId) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: `Question Received: ${subject}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                .container { max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; }
                .header { background: linear-gradient(135deg, #8B5CF6, #7C3AED); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                .info-box { background: white; padding: 20px; border-radius: 5px; border-left: 4px solid #8B5CF6; margin: 20px 0; }
                .footer { text-align: center; margin-top: 20px; color: #6B7280; font-size: 14px; }
                .reference { background: #F3F4F6; padding: 10px; border-radius: 5px; font-family: monospace; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Question Received</h1>
                </div>
                <div class="content">
                    <h2>Hello ${userName},</h2>
                    
                    <p>Thank you for reaching out to us! We've received your question and our team will review it shortly.</p>
                    
                    <div class="info-box">
                        <h3>Question Details:</h3>
                        <p><strong>Subject:</strong> ${subject}</p>
                        <p><strong>Reference ID:</strong> <span class="reference">${questionId}</span></p>
                        <p><strong>Submitted:</strong> ${new Date().toLocaleDateString()}</p>
                    </div>
                    
                    <p>We typically respond to all questions within 24-48 hours during business days.</p>
                    
                    <div style="margin-top: 25px; padding: 15px; background: #EDE9FE; border-radius: 5px;">
                        <p style="margin: 0; color: #7C3AED;">
                            <strong>What to expect next?</strong><br>
                            1. Our team will review your question<br>
                            2. We'll assign it to the appropriate specialist<br>
                            3. You'll receive a detailed response via email
                        </p>
                    </div>
                    
                    <p>If you need to add more information to your question, please reply to this email.</p>
                </div>
                <div class="footer">
                    <p>© 2024 ${process.env.COMPANY_NAME || 'Your Company'}. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Question confirmation sent to: ${userEmail}`);
    
  } catch (error) {
    console.error('Error sending question confirmation:', error);
    throw new Error('Failed to send question confirmation');
  }
};

// Send question answer to user
exports.sendQuestionAnswer = async (userEmail, userName, subject, answerMessage, responderName) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: `Re: ${subject}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                .container { max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; }
                .header { background: linear-gradient(135deg, #10B981, #047857); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                .answer { background: white; padding: 20px; border-radius: 5px; border-left: 4px solid #10B981; margin: 20px 0; }
                .footer { text-align: center; margin-top: 20px; color: #6B7280; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Answer to Your Question</h1>
                </div>
                <div class="content">
                    <h2>Hello ${userName},</h2>
                    
                    <p>Thank you for your question. Here's our response:</p>
                    
                    <div class="answer">
                        ${answerMessage.replace(/\n/g, '<br>')}
                    </div>
                    
                    <p>If this answers your question satisfactorily, no further action is needed. If you have any follow-up questions or need clarification, please don't hesitate to reply to this email.</p>
                    
                    <p>Best regards,<br>
                    <strong>${responderName}</strong><br>
                    ${process.env.COMPANY_NAME || 'Your Company Team'}</p>
                </div>
                <div class="footer">
                    <p>© 2024 ${process.env.COMPANY_NAME || 'Your Company'}. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Question answer sent to: ${userEmail}`);
    
  } catch (error) {
    console.error('Error sending question answer:', error);
    throw new Error('Failed to send question answer');
  }
};
// Send booking confirmation to user
exports.sendBookingConfirmation = async (userEmail, userName, serviceType, bookingId) => {
  try {
    const transporter = createTransporter();

    const serviceNames = {
      'web-development': 'Web Development',
      'mobile-app': 'Mobile App Development',
      'ecommerce': 'E-commerce Solution',
      'ui-ux-design': 'UI/UX Design',
      'digital-marketing': 'Digital Marketing',
      'seo': 'SEO Services',
      'consulting': 'Consulting',
      'maintenance': 'Maintenance & Support',
      'other': 'Other Services'
    };

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: `Booking Confirmation: ${serviceNames[serviceType] || serviceType}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                .container { max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; }
                .header { background: linear-gradient(135deg, #F59E0B, #D97706); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                .info-box { background: white; padding: 20px; border-radius: 5px; border-left: 4px solid #F59E0B; margin: 20px 0; }
                .footer { text-align: center; margin-top: 20px; color: #6B7280; font-size: 14px; }
                .reference { background: #FEF3C7; padding: 10px; border-radius: 5px; font-family: monospace; }
                .timeline { background: #FFFBEB; padding: 15px; border-radius: 5px; margin: 15px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Booking Confirmed!</h1>
                </div>
                <div class="content">
                    <h2>Hello ${userName},</h2>
                    
                    <p>Thank you for choosing our ${serviceNames[serviceType] || serviceType} services! We've received your booking request and our team is excited to work with you.</p>
                    
                    <div class="info-box">
                        <h3>Booking Details:</h3>
                        <p><strong>Service:</strong> ${serviceNames[serviceType] || serviceType}</p>
                        <p><strong>Reference ID:</strong> <span class="reference">${bookingId}</span></p>
                        <p><strong>Submitted:</strong> ${new Date().toLocaleDateString()}</p>
                    </div>
                    
                    <div class="timeline">
                        <h4>What happens next?</h4>
                        <ol>
                            <li>Our team will review your requirements within 24 hours</li>
                            <li>We'll contact you to discuss project details</li>
                            <li>You'll receive a detailed proposal and timeline</li>
                            <li>Project kickoff and development begins</li>
                        </ol>
                    </div>
                    
                    <p>We'll be in touch shortly to discuss your project in more detail. In the meantime, if you have any questions, feel free to reply to this email.</p>
                    
                    <p>Looking forward to working with you!</p>
                </div>
                <div class="footer">
                    <p>© 2024 ${process.env.COMPANY_NAME || 'Your Company'}. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Booking confirmation sent to: ${userEmail}`);
    
  } catch (error) {
    console.error('Error sending booking confirmation:', error);
    throw new Error('Failed to send booking confirmation');
  }
};

// Send booking status update to user
exports.sendBookingUpdate = async (userEmail, userName, status, serviceType) => {
  try {
    const transporter = createTransporter();

    const statusMessages = {
      'won': {
        subject: 'Project Approved!',
        message: 'Great news! Your project has been approved and we\'re excited to get started. Our team will contact you within 24 hours to discuss next steps and project kickoff.'
      },
      'lost': {
        subject: 'Update on Your Booking Request',
        message: 'Thank you for considering our services. Unfortunately, we\'re unable to move forward with your project at this time. We appreciate your interest and hope to work with you in the future.'
      },
      'quoted': {
        subject: 'Your Proposal is Ready!',
        message: 'Your detailed proposal is now ready. We\'ve prepared a comprehensive plan for your project including timeline, deliverables, and pricing. Please check your email for the proposal document.'
      }
    };

    const statusInfo = statusMessages[status] || {
      subject: 'Booking Status Update',
      message: `Your booking status has been updated to ${status}.`
    };

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: statusInfo.subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                .container { max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; }
                .header { background: linear-gradient(135deg, #10B981, #047857); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                .status-update { background: white; padding: 20px; border-radius: 5px; border-left: 4px solid #10B981; margin: 20px 0; }
                .footer { text-align: center; margin-top: 20px; color: #6B7280; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>${statusInfo.subject}</h1>
                </div>
                <div class="content">
                    <h2>Hello ${userName},</h2>
                    
                    <div class="status-update">
                        <p>${statusInfo.message}</p>
                    </div>
                    
                    ${status === 'won' ? `
                    <div style="margin-top: 25px; padding: 15px; background: #D1FAE5; border-radius: 5px;">
                        <p style="margin: 0; color: #047857;">
                            <strong>Next Steps:</strong><br>
                            • Project manager assignment<br>
                            • Kickoff meeting scheduling<br>
                            • Requirements finalization<br>
                            • Development timeline confirmation
                        </p>
                    </div>
                    ` : ''}
                    
                    <p>If you have any questions, please don't hesitate to contact us.</p>
                    
                    <p>Best regards,<br>
                    ${process.env.COMPANY_NAME || 'Your Company Team'}</p>
                </div>
                <div class="footer">
                    <p>© 2024 ${process.env.COMPANY_NAME || 'Your Company'}. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Booking update sent to: ${userEmail}`);
    
  } catch (error) {
    console.error('Error sending booking update:', error);
    throw new Error('Failed to send booking update');
  }
};

// Send payment confirmation
exports.sendPaymentConfirmation = async (userEmail, userName, order, payment) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: `Payment Confirmation - Order ${order.orderNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                .container { max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; }
                .header { background: linear-gradient(135deg, #10B981, #047857); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                .info-box { background: white; padding: 20px; border-radius: 5px; border-left: 4px solid #10B981; margin: 20px 0; }
                .footer { text-align: center; margin-top: 20px; color: #6B7280; font-size: 14px; }
                .order-items { width: 100%; border-collapse: collapse; margin: 20px 0; }
                .order-items th, .order-items td { padding: 12px; text-align: left; border-bottom: 1px solid #E5E7EB; }
                .order-items th { background: #F9FAFB; }
                .total-row { font-weight: bold; background: #F0FDF4; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Payment Confirmed!</h1>
                </div>
                <div class="content">
                    <h2>Hello ${userName},</h2>
                    
                    <p>Thank you for your payment! Your order has been confirmed and is being processed.</p>
                    
                    <div class="info-box">
                        <h3>Order Details:</h3>
                        <p><strong>Order Number:</strong> ${order.orderNumber}</p>
                        <p><strong>Payment Method:</strong> ${payment.paymentMethod}</p>
                        <p><strong>Payment Date:</strong> ${new Date(payment.createdAt).toLocaleDateString()}</p>
                        <p><strong>Transaction ID:</strong> ${payment.stripePaymentIntentId || payment.paypackTransactionId}</p>
                    </div>
                    
                    <h3>Order Summary:</h3>
                    <table class="order-items">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Quantity</th>
                                <th>Price</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${order.items.map(item => `
                                <tr>
                                    <td>${item.product.name}</td>
                                    <td>${item.quantity}</td>
                                    <td>$${item.price.toFixed(2)}</td>
                                    <td>$${item.total.toFixed(2)}</td>
                                </tr>
                            `).join('')}
                            <tr>
                                <td colspan="3" style="text-align: right;">Subtotal:</td>
                                <td>$${order.subtotal.toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td colspan="3" style="text-align: right;">Tax:</td>
                                <td>$${order.tax.toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td colspan="3" style="text-align: right;">Shipping:</td>
                                <td>$${order.shipping.toFixed(2)}</td>
                            </tr>
                            <tr class="total-row">
                                <td colspan="3" style="text-align: right;">Total:</td>
                                <td>$${order.total.toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <div style="margin-top: 25px; padding: 15px; background: #D1FAE5; border-radius: 5px;">
                        <p style="margin: 0; color: #047857;">
                            <strong>What's next?</strong><br>
                            • Your order is being processed<br>
                            • You'll receive shipping confirmation soon<br>
                            • Expected delivery: 3-5 business days
                        </p>
                    </div>
                    
                    <p>You can track your order status in your account dashboard.</p>
                </div>
                <div class="footer">
                    <p>© 2024 ${process.env.COMPANY_NAME || 'Your Company'}. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Payment confirmation sent to: ${userEmail}`);
    
  } catch (error) {
    console.error('Error sending payment confirmation:', error);
    throw new Error('Failed to send payment confirmation');
  }
};

// Send payment receipt
exports.sendPaymentReceipt = async (userEmail, userName, payment) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: `Payment Receipt - ${payment._id}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                .container { max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; }
                .header { background: linear-gradient(135deg, #6366F1, #4F46E5); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                .receipt-box { background: white; padding: 25px; border-radius: 5px; border: 2px solid #E5E7EB; margin: 20px 0; }
                .footer { text-align: center; margin-top: 20px; color: #6B7280; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Payment Receipt</h1>
                </div>
                <div class="content">
                    <h2>Hello ${userName},</h2>
                    
                    <p>Here is your payment receipt for your records.</p>
                    
                    <div class="receipt-box">
                        <h3 style="margin-top: 0; color: #374151;">RECEIPT</h3>
                        <p><strong>Receipt Number:</strong> ${payment._id}</p>
                        <p><strong>Date:</strong> ${new Date(payment.createdAt).toLocaleDateString()}</p>
                        <p><strong>Payment Method:</strong> ${payment.paymentMethod}</p>
                        <p><strong>Amount:</strong> ${payment.currency} ${payment.amount.toFixed(2)}</p>
                        <p><strong>Status:</strong> <span style="color: #10B981; font-weight: bold;">${payment.status.toUpperCase()}</span></p>
                        
                        ${payment.stripePaymentIntentId ? `
                        <p><strong>Stripe Payment ID:</strong> ${payment.stripePaymentIntentId}</p>
                        ` : ''}
                        
                        ${payment.paypackTransactionId ? `
                        <p><strong>Paypack Transaction ID:</strong> ${payment.paypackTransactionId}</p>
                        <p><strong>Mobile Number:</strong> ${payment.mobileNumber}</p>
                        ` : ''}
                    </div>
                    
                    <p>This receipt confirms that your payment has been successfully processed.</p>
                    
                    <p>If you have any questions about this receipt, please contact our support team.</p>
                </div>
                <div class="footer">
                    <p>© 2024 ${process.env.COMPANY_NAME || 'Your Company'}. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Payment receipt sent to: ${userEmail}`);
    
  } catch (error) {
    console.error('Error sending payment receipt:', error);
    throw new Error('Failed to send payment receipt');
  }
};