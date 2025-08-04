import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import Category from '../models/Category';
import { sendSuccess, sendError } from '../utils/response';

// Get all categories
export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .select('name description icon isActive sortOrder');
    
    sendSuccess(res, 'Categories retrieved successfully', categories);
  } catch (error) {
    sendError(res, 'Failed to retrieve categories', error instanceof Error ? error.message : 'Unknown error', 500);
  }
};

// Get category by ID
export const getCategoryById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);
    
    if (!category) {
      sendError(res, 'Category not found', undefined, 404);
      return;
    }
    
    sendSuccess(res, 'Category retrieved successfully', category);
  } catch (error) {
    sendError(res, 'Failed to retrieve category', error instanceof Error ? error.message : 'Unknown error', 500);
  }
};

// Create new category (Admin only)
export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      sendError(res, 'Validation failed', undefined, 400, errors.array());
      return;
    }
    
    const { name, description, image, sortOrder } = req.body;
    
    const category = new Category({
      name,
      description,
      image,
      sortOrder: sortOrder || 0
    });
    
    await category.save();
    
    sendSuccess(res, 'Category created successfully', category, 201);
  } catch (error) {
    sendError(res, 'Failed to create category', error instanceof Error ? error.message : 'Unknown error', 500);
  }
};

// Update category (Admin only)
export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      sendError(res, 'Validation failed', undefined, 400, errors.array());
      return;
    }
    
    const { id } = req.params;
    const { name, description, image, isActive, sortOrder } = req.body;
    
    const category = await Category.findById(id);
    if (!category) {
      sendError(res, 'Category not found', undefined, 404);
      return;
    }
    
    // Check if new name already exists (excluding current category)
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: id }
      });
      if (existingCategory) {
        sendError(res, 'Category name already exists', undefined, 409);
        return;
      }
    }
    
    // Update fields
    if (name) category.name = name;
    if (description !== undefined) category.description = description;
    if (image !== undefined) category.image = image;
    if (isActive !== undefined) category.isActive = isActive;
    if (sortOrder !== undefined) category.sortOrder = sortOrder;
    
    await category.save();
    
    sendSuccess(res, 'Category updated successfully', category);
  } catch (error) {
    sendError(res, 'Failed to update category', error instanceof Error ? error.message : 'Unknown error', 500);
  }
};

// Delete category (Admin only)
export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const category = await Category.findById(id);
    if (!category) {
      sendError(res, 'Category not found', undefined, 404);
      return;
    }
    
    // Soft delete - just set isActive to false
    category.isActive = false;
    await category.save();
    
    sendSuccess(res, 'Category deleted successfully');
  } catch (error) {
    sendError(res, 'Failed to delete category', error instanceof Error ? error.message : 'Unknown error', 500);
  }
};