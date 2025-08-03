// ✅ IMPORT CONFIG FIRST! (HARUS DI BARIS PERTAMA)
import '../config/env';
import nodemailer from "nodemailer";
import { generateVerificationToken } from "../utils/jwt";

// Debug environment variables
console.log("EMAIL_HOST:", process.env.EMAIL_HOST);
console.log("EMAIL_PORT:", process.env.EMAIL_PORT);
console.log("EMAIL_USER:", process.env.EMAIL_USER);

// ✅ Sekarang gunakan environment variables (bukan hardcode!)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST!, // ✅ Akan terbaca: smtp.hostinger.com
  port: parseInt(process.env.EMAIL_PORT || "465"), // ✅ Akan terbaca: 465
  secure: process.env.EMAIL_SECURE === "true", // ✅ Akan terbaca: true
  auth: {
    user: process.env.EMAIL_USER!, // ✅ Akan terbaca: contact@action-rom.com
    pass: process.env.EMAIL_PASS!, // ✅ Akan terbaca: q4qB!gw0o%
  },
});

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
