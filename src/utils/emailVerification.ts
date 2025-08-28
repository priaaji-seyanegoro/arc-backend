import crypto from 'crypto';
import User, { IUser } from '../models/User';
import { sendEmail } from '../services/emailService';
import { logger } from './logger';

/**
 * Generate email verification token
 */
export const generateEmailVerificationToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Create and save email verification token for user
 */
export const createEmailVerificationToken = async (userId: string): Promise<string> => {
  const token = generateEmailVerificationToken();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await User.findByIdAndUpdate(userId, {
    emailVerificationToken: token,
    emailVerificationExpires: expires
  });

  return token;
};

/**
 * Send email verification email
 */
export const sendVerificationEmail = async (user: IUser, token: string): Promise<boolean> => {
  try {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/verify-email?token=${token}`;
    
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
          <h1 style="color: #333; margin: 0;">ARC - Action Romance Comedy</h1>
        </div>
        
        <div style="padding: 30px 20px;">
          <h2 style="color: #333; margin-bottom: 20px;">Verifikasi Email Anda</h2>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            Halo ${user.firstName},
          </p>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            Terima kasih telah mendaftar di ARC! Untuk melengkapi proses registrasi, 
            silakan verifikasi alamat email Anda dengan mengklik tombol di bawah ini:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;
                      font-weight: bold;">
              Verifikasi Email
            </a>
          </div>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 10px;">
            Atau salin dan tempel link berikut di browser Anda:
          </p>
          
          <p style="color: #007bff; word-break: break-all; margin-bottom: 20px;">
            ${verificationUrl}
          </p>
          
          <p style="color: #999; font-size: 14px; line-height: 1.6;">
            Link verifikasi ini akan kedaluwarsa dalam 24 jam. Jika Anda tidak 
            mendaftar di ARC, abaikan email ini.
          </p>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; 
                    border-top: 1px solid #dee2e6;">
          <p style="color: #999; font-size: 12px; margin: 0;">
            © 2024 ARC - Action Romance Comedy. All rights reserved.
          </p>
        </div>
      </div>
    `;

    await sendEmail({
      to: user.email,
      subject: 'Verifikasi Email - ARC',
      html: emailContent
    });

    logger.info(`Verification email sent to ${user.email}`);
    return true;
  } catch (error) {
    logger.error('Failed to send verification email:', error);
    return false;
  }
};

/**
 * Verify email token
 */
export const verifyEmailToken = async (token: string): Promise<{ success: boolean; user?: IUser; message: string }> => {
  try {
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() }
    });

    if (!user) {
      return {
        success: false,
        message: 'Token verifikasi tidak valid atau sudah kedaluwarsa'
      };
    }

    // Update user as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    logger.info(`Email verified for user: ${user.email}`);
    
    return {
      success: true,
      user,
      message: 'Email berhasil diverifikasi'
    };
  } catch (error) {
    logger.error('Email verification error:', error);
    return {
      success: false,
      message: 'Terjadi kesalahan saat verifikasi email'
    };
  }
};

/**
 * Resend verification email
 */
export const resendVerificationEmail = async (email: string): Promise<{ success: boolean; message: string }> => {
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return {
        success: false,
        message: 'User tidak ditemukan'
      };
    }

    if (user.isEmailVerified) {
      return {
        success: false,
        message: 'Email sudah terverifikasi'
      };
    }

    // Generate new token
    const token = await createEmailVerificationToken(user._id);
    
    // Send verification email
    const emailSent = await sendVerificationEmail(user, token);
    
    if (!emailSent) {
      return {
        success: false,
        message: 'Gagal mengirim email verifikasi'
      };
    }

    return {
      success: true,
      message: 'Email verifikasi telah dikirim ulang'
    };
  } catch (error) {
    logger.error('Resend verification email error:', error);
    return {
      success: false,
      message: 'Terjadi kesalahan saat mengirim ulang email verifikasi'
    };
  }
};