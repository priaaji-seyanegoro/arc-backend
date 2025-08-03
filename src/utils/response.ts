import { Response } from 'express';
import { ApiResponse, PaginatedResponse } from '../types/api';
import { ValidationError } from 'express-validator';

export const sendSuccess = <T>(
  res: Response,
  message: string,
  data?: T,
  statusCode: number = 200
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
  };
  
  return res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  message: string,
  error?: string,
  statusCode: number = 400,
  errors?: Record<string, string[]> | ValidationError[]
): Response => {
  let formattedErrors: Record<string, string[]> | undefined;
  
  if (errors && Array.isArray(errors)) {
    // Convert ValidationError[] to Record<string, string[]>
    formattedErrors = errors.reduce((acc, err) => {
      const field = (err as any)['path'] || (err as any)['param'] || 'general';
      if (!acc[field]) {
        acc[field] = [];
      }
      acc[field].push(err.msg);
      return acc;
    }, {} as Record<string, string[]>);
  } else if (errors) {
    formattedErrors = errors as Record<string, string[]>;
  }

  const response: ApiResponse = {
    success: false,
    message,
    error,
    errors: formattedErrors,
  };
  
  return res.status(statusCode).json(response);
};

export const sendPaginatedResponse = <T>(
  res: Response,
  message: string,
  data: T[],
  pagination: PaginatedResponse<T>['pagination'],
  statusCode: number = 200
): Response => {
  const response: ApiResponse<PaginatedResponse<T>> = {
    success: true,
    message,
    data: {
      data,
      pagination,
    },
  };
  
  return res.status(statusCode).json(response);
};