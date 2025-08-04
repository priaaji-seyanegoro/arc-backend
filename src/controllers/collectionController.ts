import { Request, Response } from 'express';
import Collection, { ICollection } from '../models/Collection';
import Product from '../models/Product';
import { sendSuccess, sendError } from '../utils/response';

// Create new collection
export const createCollection = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, code, type, image, startDate, endDate, isActive, isFeatured, sortOrder } = req.body;

    // Check if collection with same code already exists
    const existingCollection = await Collection.findOne({ code: code.toUpperCase() });
    if (existingCollection) {
      sendError(
        res,
        'Collection with this code already exists',
        'Collection code must be unique',
        409
      );
      return;
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const collection = new Collection({
      name,
      slug,
      description,
      code: code.toUpperCase(),
      type,
      image,
      startDate,
      endDate,
      isActive,
      isFeatured,
      sortOrder
    });

    await collection.save();
    sendSuccess(res, 'Collection created successfully', collection, 201);
  } catch (error: any) {
    sendError(
      res,
      'Failed to create collection',
      error.message,
      500
    );
  }
};

// Get all collections
export const getCollections = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      type, 
      isActive, 
      isFeatured, 
      search, 
      sortBy = 'sortOrder', 
      sortOrder = 'asc' 
    } = req.query;

    const filter: any = {};
    
    if (type) filter.type = type;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (isFeatured !== undefined) filter.isFeatured = isFeatured === 'true';
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOptions: any = {};
    sortOptions[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    const skip = (Number(page) - 1) * Number(limit);
    
    const [collections, total] = await Promise.all([
      Collection.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limit)),
      Collection.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / Number(limit));

    sendSuccess(res, 'Collections retrieved successfully', {
      collections,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalItems: total,
        itemsPerPage: Number(limit)
      }
    });
  } catch (error: any) {
    sendError(
      res,
      'Failed to fetch collections',
      error.message,
      500
    );
  }
};

// Get collection by ID with products
export const getCollectionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const collection = await Collection.findById(id);
    if (!collection) {
      sendError(res, 'Collection not found', 'Collection not found', 404);
      return;
    }

    // Get products in this collection
    const products = await Product.find({ 
      productCollection: id,
      isActive: true 
    })
    .populate('category', 'name slug')
    .select('name slug basePrice images totalStock isFeatured');

    sendSuccess(res, 'Collection retrieved successfully', {
      collection,
      products,
      productCount: products.length
    });
  } catch (error: any) {
    sendError(
      res,
      'Failed to fetch collection',
      error.message,
      500
    );
  }
};

// Update collection
export const updateCollection = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // If updating code, check for duplicates
    if (updates.code) {
      const existingCollection = await Collection.findOne({ 
        code: updates.code.toUpperCase(),
        _id: { $ne: id }
      });
      if (existingCollection) {
        sendError(
          res,
          'Collection with this code already exists',
          'Collection code must be unique',
          409
        );
        return;
      }
      updates.code = updates.code.toUpperCase();
    }

    const collection = await Collection.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    if (!collection) {
      sendError(res, 'Collection not found', 'Collection not found', 404);
      return;
    }

    sendSuccess(res, 'Collection updated successfully', collection);
  } catch (error: any) {
    sendError(
      res,
      'Failed to update collection',
      error.message,
      500
    );
  }
};

// Delete collection
export const deleteCollection = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Check if any products are using this collection
    const productsCount = await Product.countDocuments({ productCollection: id });
    if (productsCount > 0) {
      sendError(
        res,
        `Cannot delete collection. ${productsCount} products are still using this collection.`,
        'Collection is in use',
        400
      );
      return;
    }

    const collection = await Collection.findByIdAndDelete(id);
    if (!collection) {
      sendError(res, 'Collection not found', 'Collection not found', 404);
      return;
    }

    sendSuccess(res, 'Collection deleted successfully', null);
  } catch (error: any) {
    sendError(
      res,
      'Failed to delete collection',
      error.message,
      500
    );
  }
};