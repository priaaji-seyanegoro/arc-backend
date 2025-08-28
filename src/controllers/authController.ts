import { Request, Response } from "express";
import { validationResult } from "express-validator";
import User from "../models/User";
import { generateTokens, verifyRefreshToken } from "../utils/jwt";
import { sendSuccess, sendError } from "../utils/response";
import { LoginRequest, RegisterRequest, AuthResponse } from "../types/auth";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "../services/emailService";
import {
  verifyVerificationToken,
  verifyPasswordResetToken,
  generatePasswordResetToken,
} from "../utils/jwt";
import {
  createEmailVerificationToken,
  sendVerificationEmail as sendNewVerificationEmail,
  verifyEmailToken,
  resendVerificationEmail,
} from "../utils/emailVerification";

// Register new user
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    // Tambah debugging
    console.log('Raw request body:', req.body);
    console.log('Email from request:', req.body.email);
    
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      referralCode,
    }: RegisterRequest = req.body;
    
    // Tambah debugging lagi
    console.log('Email after destructuring:', email);
    
    // Handle validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      sendError(res, "Validation failed", undefined, 400, errors.array());
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      sendError(res, "User with this email already exists", undefined, 409);
      return;
    }

    // Validate referral code if provided
    let referredByUser = null;
    if (referralCode) {
      referredByUser = await User.findOne({ referralCode });
      if (!referredByUser) {
        sendError(res, "Invalid referral code", undefined, 400);
        return;
      }
    }

    // Create new user
    const user = new User({
      firstName,
      lastName,
      email,
      password,
      phone,
      referredBy: referredByUser?._id,
    });

    await user.save();

    // Auto send verification email
    try {
      const verificationToken = await createEmailVerificationToken(user._id);
      await sendNewVerificationEmail(user, verificationToken);
      console.log(`Verification email sent to ${user.email}`);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // Don't fail registration if email sending fails
    }

    // Generate tokens
    const tokens = generateTokens({
      userId: user._id,
      email: user.email,
      role: user.role,
    });

    // Prepare response
    const authResponse: AuthResponse = {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
      tokens,
    };

    sendSuccess(
      res,
      "User registered successfully. Please check your email to verify your account.",
      authResponse,
      201
    );
  } catch (error) {
    console.error("Register error:", error);
    sendError(res, "Internal server error", undefined, 500);
  }
};

// Login user
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    // Handle validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      sendError(res, "Validation failed", undefined, 400, errors.array());
      return;
    }

    const { email, password }: LoginRequest = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      sendError(res, "Invalid email or password", undefined, 401);
      return;
    }

    // Check if user is active
    if (!user.isActive) {
      sendError(res, "Account is deactivated", undefined, 401);
      return;
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      sendError(res, "Invalid email or password", undefined, 401);
      return;
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      sendError(res, "Please verify your email address before logging in. Check your inbox for verification email.", undefined, 403);
      return;
    }

    // Generate tokens
    const tokens = generateTokens({
      userId: user._id,
      email: user.email,
      role: user.role,
    });

    // Prepare response
    const authResponse: AuthResponse = {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
      tokens,
    };

    sendSuccess(res, "Login successful", authResponse);
  } catch (error) {
    console.error("Login error:", error);
    sendError(res, "Internal server error", undefined, 500);
  }
};

// Refresh token
export const refreshToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      sendError(res, "Refresh token is required", undefined, 400);
      return;
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Find user
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      sendError(res, "Invalid refresh token", undefined, 401);
      return;
    }

    // Generate new tokens
    const tokens = generateTokens({
      userId: user._id,
      email: user.email,
      role: user.role,
    });

    sendSuccess(res, "Token refreshed successfully", { tokens });
  } catch (error) {
    console.error("Refresh token error:", error);
    sendError(res, "Invalid refresh token", undefined, 401);
  }
};

// Get current user profile
export const getProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    const user = await User.findById(userId).select("-password");
    if (!user) {
      sendError(res, "User not found", undefined, 404);
      return;
    }

    sendSuccess(res, "Profile retrieved successfully", { user });
  } catch (error) {
    console.error("Get profile error:", error);
    sendError(res, "Internal server error", undefined, 500);
  }
};

// Update user profile
export const updateProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { firstName, lastName, phone, dateOfBirth, gender } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        firstName,
        lastName,
        phone,
        dateOfBirth,
        gender,
      },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      sendError(res, "User not found", undefined, 404);
      return;
    }

    sendSuccess(res, "Profile updated successfully", { user });
  } catch (error) {
    console.error("Update profile error:", error);
    sendError(res, "Internal server error", undefined, 500);
  }
};

// Change password
export const changePassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      sendError(res, "User not found", undefined, 404);
      return;
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      sendError(res, "Current password is incorrect", undefined, 400);
      return;
    }

    // Update password
    user.password = newPassword;
    await user.save();

    sendSuccess(res, "Password changed successfully");
  } catch (error) {
    console.error("Change password error:", error);
    sendError(res, "Internal server error", undefined, 500);
  }
};

// Logout (client-side token removal)
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    // In a stateless JWT system, logout is typically handled client-side
    // by removing the token from storage
    sendSuccess(res, "Logout successful");
  } catch (error) {
    console.error("Logout error:", error);
    sendError(res, "Internal server error", undefined, 500);
  }
};

// Send verification email
export const sendVerificationEmailController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      sendError(res, "User not authenticated", undefined, 401);
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      sendError(res, "User not found", undefined, 404);
      return;
    }

    if (user.isEmailVerified) {
      sendError(res, "Email already verified", undefined, 400);
      return;
    }

    const verificationToken = await createEmailVerificationToken(user._id);
    await sendNewVerificationEmail(user, verificationToken);

    sendSuccess(res, "Verification email sent successfully");
  } catch (error) {
    console.error("Send verification email error:", error);
    sendError(res, "Failed to send verification email", undefined, 500);
  }
};

// Verify email
export const verifyEmail = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { token } = req.params;

    if (!token) {
      sendError(res, "Verification token is required", undefined, 400);
      return;
    }

    const result = await verifyEmailToken(token);

    if (!result.success) {
      sendError(res, result.message, undefined, 400);
      return;
    }

    sendSuccess(res, result.message, {
      user: {
        id: result.user!._id,
        firstName: result.user!.firstName,
        lastName: result.user!.lastName,
        email: result.user!.email,
        isEmailVerified: result.user!.isEmailVerified,
      },
    });
  } catch (error) {
    console.error("Verify email error:", error);
    sendError(res, "Invalid or expired verification token", undefined, 400);
  }
};

// Resend verification email
export const resendVerificationEmailController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      sendError(res, "Email is required", undefined, 400);
      return;
    }

    const result = await resendVerificationEmail(email);

    if (!result.success) {
      sendError(res, result.message, undefined, 400);
      return;
    }

    sendSuccess(res, result.message);
  } catch (error) {
    console.error("Resend verification email error:", error);
    sendError(res, "Failed to resend verification email", undefined, 500);
  }
};

// Request password reset
export const requestPasswordReset = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      sendError(res, "Email is required", undefined, 400);
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists or not
      sendSuccess(res, "If the email exists, a reset link has been sent");
      return;
    }

    const resetToken = generatePasswordResetToken(user._id.toString());
    await sendPasswordResetEmail(user.email, resetToken, user.firstName);

    sendSuccess(res, "Password reset email sent successfully");
  } catch (error) {
    console.error("Request password reset error:", error);
    sendError(res, "Failed to send password reset email", undefined, 500);
  }
};

// Reset password
export const resetPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword || !confirmPassword) {
      sendError(
        res,
        "Token, new password, and confirm password are required",
        undefined,
        400
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      sendError(res, "Passwords do not match", undefined, 400);
      return;
    }

    const decoded = verifyPasswordResetToken(token);

    const user = await User.findById(decoded.userId);
    if (!user) {
      sendError(res, "User not found", undefined, 404);
      return;
    }

    user.password = newPassword; // Will be hashed by pre-save hook
    await user.save();

    sendSuccess(res, "Password reset successfully");
  } catch (error) {
    console.error("Reset password error:", error);
    sendError(res, "Invalid or expired reset token", undefined, 400);
  }
};
