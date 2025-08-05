import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { sendError } from '../utils/response';
import User from '../models/User'; // Ubah dari { User } menjadi User
import { JWTPayload } from '../types/auth';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        firstName: string;
        lastName: string;
      };
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendError(
        res,
        'Access denied',
        'No token provided or invalid token format',
        401
      );
      return;
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    try {
      const decoded = verifyAccessToken(token) as JWTPayload;
      
      // Check if user still exists
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        sendError(
          res,
          'Access denied',
          'User not found',
          401
        );
        return;
      }
      
      if (!user.isEmailVerified) {
        sendError(
          res,
          'Access denied',
          'Please verify your email address',
          401
        );
        return;
      }
      
      // Add user to request object
      req.user = {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      };
      
      next();
    } catch (jwtError) {
      sendError(
        res,
        'Access denied',
        'Invalid or expired token',
        401
      );
      return;
    }
  } catch (error) {
    sendError(
      res,
      'Authentication error',
      'Internal server error during authentication',
      500
    );
    return;
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(
        res,
        'Access denied',
        'Authentication required',
        401
      );
      return;
    }
    
    if (!roles.includes(req.user.role)) {
      sendError(
        res,
        'Access denied',
        'Insufficient permissions',
        403
      );
      return;
    }
    
    next();
  };
};

// Optional authentication - doesn't fail if no token
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }
    
    const token = authHeader.substring(7);
    
    try {
      const decoded = verifyAccessToken(token) as JWTPayload;
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.isEmailVerified) {
        req.user = {
          id: user._id.toString(),
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
        };
      }
    } catch (jwtError) {
      // Ignore JWT errors for optional auth
    }
    
    next();
  } catch (error) {
    next();
  }
};

// Admin authorization middleware
export const requireAdmin = authorize('admin');