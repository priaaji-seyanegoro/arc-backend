import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { validationResult } from 'express-validator';
import User from '../models/User';
import { generateTokens, verifyRefreshToken } from '../utils/jwt';
import { sendSuccess, sendError } from '../utils/response';
import { handleValidationErrors } from '../utils/validation';
import { LoginRequest, RegisterRequest, AuthResponse } from '../types/auth';

// Register new user
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    // Handle validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      sendError(res, 'Validation failed', undefined, 400, errors.array());
      return;
    }

    const { firstName, lastName, email, password, phone, referralCode }: RegisterRequest = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      sendError(res, 'User with this email already exists', undefined, 409);
      return;
    }

    // Validate referral code if provided
    let referredByUser = null;
    if (referralCode) {
      referredByUser = await User.findOne({ referralCode });
      if (!referredByUser) {
        sendError(res, 'Invalid referral code', undefined, 400);
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
      referredBy: referredByUser?._id
    });

    await user.save();

    // Generate tokens
    const tokens = generateTokens({
      userId: user._id,
      email: user.email,
      role: user.role
    });

    // Prepare response
    const authResponse: AuthResponse = {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified
      },
      tokens
    };

    sendSuccess(res, 'User registered successfully', authResponse, 201);
  } catch (error) {
    console.error('Register error:', error);
    sendError(res, 'Internal server error', undefined, 500);
  }
};

// Login user
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    // Handle validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      sendError(res, 'Validation failed', undefined, 400, errors.array());
      return;
    }

    const { email, password }: LoginRequest = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      sendError(res, 'Invalid email or password', undefined, 401);
      return;
    }

    // Check if user is active
    if (!user.isActive) {
      sendError(res, 'Account is deactivated', undefined, 401);
      return;
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      sendError(res, 'Invalid email or password', undefined, 401);
      return;
    }

    // Generate tokens
    const tokens = generateTokens({
      userId: user._id,
      email: user.email,
      role: user.role
    });

    // Prepare response
    const authResponse: AuthResponse = {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified
      },
      tokens
    };

    sendSuccess(res, 'Login successful', authResponse);
  } catch (error) {
    console.error('Login error:', error);
    sendError(res, 'Internal server error', undefined, 500);
  }
};

// Refresh token
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      sendError(res, 'Refresh token is required', undefined, 400);
      return;
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    
    // Find user
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      sendError(res, 'Invalid refresh token', undefined, 401);
      return;
    }

    // Generate new tokens
    const tokens = generateTokens({
      userId: user._id,
      email: user.email,
      role: user.role
    });

    sendSuccess(res, 'Token refreshed successfully', { tokens });
  } catch (error) {
    console.error('Refresh token error:', error);
    sendError(res, 'Invalid refresh token', undefined, 401);
  }
};

// Get current user profile
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    
    const user = await User.findById(userId).select('-password');
    if (!user) {
      sendError(res, 'User not found', undefined, 404);
      return;
    }

    sendSuccess(res, 'Profile retrieved successfully', { user });
  } catch (error) {
    console.error('Get profile error:', error);
    sendError(res, 'Internal server error', undefined, 500);
  }
};

// Update user profile
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
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
        gender
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      sendError(res, 'User not found', undefined, 404);
      return;
    }

    sendSuccess(res, 'Profile updated successfully', { user });
  } catch (error) {
    console.error('Update profile error:', error);
    sendError(res, 'Internal server error', undefined, 500);
  }
};

// Change password
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      sendError(res, 'User not found', undefined, 404);
      return;
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      sendError(res, 'Current password is incorrect', undefined, 400);
      return;
    }

    // Update password
    user.password = newPassword;
    await user.save();

    sendSuccess(res, 'Password changed successfully');
  } catch (error) {
    console.error('Change password error:', error);
    sendError(res, 'Internal server error', undefined, 500);
  }
};

// Logout (client-side token removal)
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    // In a stateless JWT system, logout is typically handled client-side
    // by removing the token from storage
    sendSuccess(res, 'Logout successful');
  } catch (error) {
    console.error('Logout error:', error);
    sendError(res, 'Internal server error', undefined, 500);
  }
};