// ✅ IMPORT CONFIG FIRST! (HARUS DI BARIS PERTAMA)
import "../config/env";
import nodemailer from "nodemailer";
import { generateVerificationToken } from "../utils/jwt";

// Debug environment variables
console.log("EMAIL_HOST:", process.env.EMAIL_HOST);
console.log("EMAIL_PORT:", process.env.EMAIL_PORT);
console.log("EMAIL_USER:", process.env.EMAIL_USER);

// Create transporter based on environment
const createTransporter = () => {
  if (process.env.NODE_ENV === 'development') {
    // Mock transporter for development
    return {
      sendMail: async (mailOptions: any) => {
        console.log('📧 Mock Email Sent:');
        console.log('To:', mailOptions.to);
        console.log('Subject:', mailOptions.subject);
        console.log('From:', mailOptions.from);
        console.log('HTML Preview:', mailOptions.html.substring(0, 200) + '...');
        return { messageId: 'mock-message-id' };
      }
    };
  }
  
  // Real transporter for production
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST!,
    port: parseInt(process.env.EMAIL_PORT || "465"),
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
      user: process.env.EMAIL_USER!,
      pass: process.env.EMAIL_PASS!,
    },
  });
};

const transporter = createTransporter();

export const sendVerificationEmail = async (
  email: string,
  userId: string,
  firstName: string
) => {
  const verificationToken = generateVerificationToken(userId);
  const verificationUrl = `${process.env.BACKEND_URL}/api/auth/verify-email/${verificationToken}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Verify Your Email Address",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to ARC, ${firstName}!</h2>
        <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
        <a href="${verificationUrl}" 
           style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0;">
          Verify Email Address
        </a>
        <p>Or copy and paste this link in your browser:</p>
        <p><a href="${verificationUrl}">${verificationUrl}</a></p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create an account, please ignore this email.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
  return verificationToken;
};

export const sendPasswordResetEmail = async (
  email: string,
  resetToken: string,
  firstName: string
) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Reset Your Password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>Hi ${firstName},</p>
        <p>You requested to reset your password. Click the button below to reset it:</p>
        <a href="${resetUrl}" 
           style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0;">
          Reset Password
        </a>
        <p>Or copy and paste this link in your browser:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

/**
 * Generic email sending function
 */
export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  const mailOptions = {
    from: options.from || process.env.EMAIL_FROM,
    to: options.to,
    subject: options.subject,
    html: options.html,
  };

  await transporter.sendMail(mailOptions);
};

// Order notification interfaces
export interface OrderNotificationData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  items: Array<{
    productName: string;
    size: string;
    color: string;
    quantity: number;
    price: number;
  }>;
  shippingAddress: {
    recipientName: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
  };
  trackingNumber?: string;
  estimatedDelivery?: Date;
}

/**
 * Send order confirmation email
 */
export const sendOrderConfirmationEmail = async (data: OrderNotificationData): Promise<void> => {
  const itemsHtml = data.items.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.productName}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.size} / ${item.color}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">Rp ${item.price.toLocaleString('id-ID')}</td>
    </tr>
  `).join('');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #333; margin: 0;">Order Confirmation</h1>
        <p style="color: #666; margin: 5px 0;">Thank you for your order!</p>
      </div>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #333; margin: 0 0 10px 0;">Order Details</h2>
        <p><strong>Order Number:</strong> ${data.orderNumber}</p>
        <p><strong>Customer:</strong> ${data.customerName}</p>
        <p><strong>Total Amount:</strong> Rp ${data.totalAmount.toLocaleString('id-ID')}</p>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h3 style="color: #333;">Items Ordered</h3>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="padding: 12px 8px; text-align: left; border-bottom: 2px solid #ddd;">Product</th>
              <th style="padding: 12px 8px; text-align: left; border-bottom: 2px solid #ddd;">Variant</th>
              <th style="padding: 12px 8px; text-align: center; border-bottom: 2px solid #ddd;">Qty</th>
              <th style="padding: 12px 8px; text-align: right; border-bottom: 2px solid #ddd;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
      </div>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #333; margin: 0 0 10px 0;">Shipping Address</h3>
        <p style="margin: 5px 0;">${data.shippingAddress.recipientName}</p>
        <p style="margin: 5px 0;">${data.shippingAddress.street}</p>
        <p style="margin: 5px 0;">${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.postalCode}</p>
      </div>
      
      <div style="text-align: center; margin-top: 30px; padding: 20px; background-color: #e8f5e8; border-radius: 8px;">
        <p style="color: #2d5a2d; margin: 0; font-weight: bold;">We'll send you another email when your order ships!</p>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #666; font-size: 14px;">
        <p>Questions? Contact us at <a href="mailto:support@action-rom.com">support@action-rom.com</a></p>
      </div>
    </div>
  `;

  await sendEmail({
    to: data.customerEmail,
    subject: `Order Confirmation - ${data.orderNumber}`,
    html
  });
};

/**
 * Send order shipped email
 */
export const sendOrderShippedEmail = async (data: OrderNotificationData): Promise<void> => {
  const estimatedDeliveryText = data.estimatedDelivery 
    ? `<p><strong>Estimated Delivery:</strong> ${data.estimatedDelivery.toLocaleDateString('id-ID', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}</p>`
    : '';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #333; margin: 0;">📦 Your Order Has Shipped!</h1>
        <p style="color: #666; margin: 5px 0;">Your package is on its way</p>
      </div>
      
      <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
        <h2 style="color: #2d5a2d; margin: 0 0 10px 0;">Tracking Information</h2>
        <p style="margin: 5px 0;"><strong>Order Number:</strong> ${data.orderNumber}</p>
        ${data.trackingNumber ? `<p style="margin: 5px 0;"><strong>Tracking Number:</strong> <span style="background-color: #fff; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${data.trackingNumber}</span></p>` : ''}
        ${estimatedDeliveryText}
      </div>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #333; margin: 0 0 10px 0;">Shipping To</h3>
        <p style="margin: 5px 0;">${data.shippingAddress.recipientName}</p>
        <p style="margin: 5px 0;">${data.shippingAddress.street}</p>
        <p style="margin: 5px 0;">${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.postalCode}</p>
      </div>
      
      <div style="text-align: center; margin-top: 30px;">
        <p style="color: #666;">We'll send you another email when your package is delivered!</p>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #666; font-size: 14px;">
        <p>Questions? Contact us at <a href="mailto:support@action-rom.com">support@action-rom.com</a></p>
      </div>
    </div>
  `;

  await sendEmail({
    to: data.customerEmail,
    subject: `📦 Your Order ${data.orderNumber} Has Shipped!`,
    html
  });
};

/**
 * Send order delivered email
 */
export const sendOrderDeliveredEmail = async (data: OrderNotificationData): Promise<void> => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #333; margin: 0;">🎉 Order Delivered!</h1>
        <p style="color: #666; margin: 5px 0;">Your package has been successfully delivered</p>
      </div>
      
      <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
        <h2 style="color: #2d5a2d; margin: 0 0 10px 0;">Delivery Confirmed</h2>
        <p style="margin: 5px 0;"><strong>Order Number:</strong> ${data.orderNumber}</p>
        <p style="margin: 5px 0;"><strong>Delivered To:</strong> ${data.shippingAddress.recipientName}</p>
      </div>
      
      <div style="text-align: center; margin: 20px 0;">
        <a href="${process.env.FRONTEND_URL}/orders/${data.orderNumber}" 
           style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
          View Order Details
        </a>
      </div>
      
      <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #856404; margin: 0 0 10px 0;">How was your experience?</h3>
        <p style="color: #856404; margin: 0;">We'd love to hear your feedback! Please consider leaving a review for the products you purchased.</p>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #666; font-size: 14px;">
        <p>Thank you for shopping with Action Romance Comedy!</p>
        <p>Questions? Contact us at <a href="mailto:support@action-rom.com">support@action-rom.com</a></p>
      </div>
    </div>
  `;

  await sendEmail({
    to: data.customerEmail,
    subject: `🎉 Your Order ${data.orderNumber} Has Been Delivered!`,
    html
  });
};

/**
 * Send order cancelled email
 */
export const sendOrderCancelledEmail = async (data: OrderNotificationData & { cancelReason?: string }): Promise<void> => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #333; margin: 0;">Order Cancelled</h1>
        <p style="color: #666; margin: 5px 0;">Your order has been cancelled</p>
      </div>
      
      <div style="background-color: #f8d7da; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #721c24; margin: 0 0 10px 0;">Cancellation Details</h2>
        <p style="margin: 5px 0;"><strong>Order Number:</strong> ${data.orderNumber}</p>
        <p style="margin: 5px 0;"><strong>Total Amount:</strong> Rp ${data.totalAmount.toLocaleString('id-ID')}</p>
        ${data.cancelReason ? `<p style="margin: 5px 0;"><strong>Reason:</strong> ${data.cancelReason}</p>` : ''}
      </div>
      
      <div style="background-color: #d1ecf1; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #0c5460; margin: 0 0 10px 0;">Refund Information</h3>
        <p style="color: #0c5460; margin: 0;">If you have already made a payment, your refund will be processed within 3-5 business days to your original payment method.</p>
      </div>
      
      <div style="text-align: center; margin: 20px 0;">
        <a href="${process.env.FRONTEND_URL}/products" 
           style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
          Continue Shopping
        </a>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #666; font-size: 14px;">
        <p>We're sorry to see this order cancelled. We hope to serve you better next time!</p>
        <p>Questions? Contact us at <a href="mailto:support@action-rom.com">support@action-rom.com</a></p>
      </div>
    </div>
  `;

  await sendEmail({
    to: data.customerEmail,
    subject: `Order Cancelled - ${data.orderNumber}`,
    html
  });
};

/**
 * Send payment confirmation email
 */
export const sendPaymentConfirmationEmail = async (data: OrderNotificationData): Promise<void> => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #333; margin: 0;">💳 Payment Confirmed!</h1>
        <p style="color: #666; margin: 5px 0;">Thank you for your payment</p>
      </div>
      
      <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
        <h2 style="color: #2d5a2d; margin: 0 0 10px 0;">Payment Successful</h2>
        <p style="margin: 5px 0;"><strong>Order Number:</strong> ${data.orderNumber}</p>
        <p style="margin: 5px 0;"><strong>Amount Paid:</strong> Rp ${data.totalAmount.toLocaleString('id-ID')}</p>
      </div>
      
      <div style="background-color: #d1ecf1; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #0c5460; margin: 0 0 10px 0;">What's Next?</h3>
        <p style="color: #0c5460; margin: 0;">Your order is now being processed. We'll send you a shipping confirmation email once your items are on their way!</p>
      </div>
      
      <div style="text-align: center; margin: 20px 0;">
        <a href="${process.env.FRONTEND_URL}/orders/${data.orderNumber}" 
           style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
          Track Your Order
        </a>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #666; font-size: 14px;">
        <p>Questions? Contact us at <a href="mailto:support@action-rom.com">support@action-rom.com</a></p>
      </div>
    </div>
  `;

  await sendEmail({
    to: data.customerEmail,
    subject: `💳 Payment Confirmed - ${data.orderNumber}`,
    html
  });
};
