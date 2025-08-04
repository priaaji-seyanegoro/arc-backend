import { Request, Response } from "express";
import { validationResult } from "express-validator";
import Product from "../models/Product";
import Category from "../models/Category";
import Collection from "../models/Collection";
import { sendSuccess, sendError } from "../utils/response";

// Get all products with filtering and pagination
export const getProducts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      collection,
      minPrice,
      maxPrice,
      search,
      tags,
      featured,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const filter: any = { isActive: true };

    // Category filter
    if (category) {
      filter.category = category;
    }

    // Collection filter
    if (collection) {
      filter.productCollection = collection;
    }

    // Tags filter
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      filter.tags = { $in: tagArray };
    }

    // Featured filter
    if (featured !== undefined) {
      filter.isFeatured = featured === "true";
    }

    // Price range filter
    if (minPrice || maxPrice) {
      filter.basePrice = {};
      if (minPrice) filter.basePrice.$gte = Number(minPrice);
      if (maxPrice) filter.basePrice.$lte = Number(maxPrice);
    }

    // Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sortOptions: any = {};
    sortOptions[sortBy as string] = sortOrder === "asc" ? 1 : -1;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("category", "name slug")
        .populate("productCollection", "name slug code type")
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / Number(limit));

    sendSuccess(res, "Products retrieved successfully", {
      products,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalItems: total,
        itemsPerPage: Number(limit),
      },
    });
  } catch (error) {
    sendError(
      res,
      "Failed to retrieve products",
      error instanceof Error ? error.message : "Unknown error",
      500
    );
  }
};

// Get product by ID
export const getProductById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id)
      .populate("category", "name slug")
      .populate("productCollection", "name slug code type");

    if (!product) {
      sendError(res, "Product not found", undefined, 404);
      return;
    }

    sendSuccess(res, "Product retrieved successfully", product);
  } catch (error) {
    sendError(
      res,
      "Failed to retrieve product",
      error instanceof Error ? error.message : "Unknown error",
      500
    );
  }
};

// Create new product
export const createProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      sendError(
        res,
        "Validation failed",
        "Input validation errors",
        400,
        errors.array()
      );
      return;
    }

    const {
      name,
      description,
      shortDescription,
      category,
      collection,
      brand,
      tags,
      skus,
      basePrice,
      images,
      features,
      materials,
      careInstructions,
      sizeChart,
      isActive,
      isFeatured,
      metaTitle,
      metaDescription,
    } = req.body;

    // Check if category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      sendError(
        res,
        "Category not found",
        "Selected category does not exist",
        400
      );
      return;
    }

    // Check if collection exists (if provided)
    if (collection) {
      const collectionExists = await Collection.findById(collection);
      if (!collectionExists) {
        sendError(
          res,
          "Collection not found",
          "Selected collection does not exist",
          400
        );
        return;
      }
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Check if slug already exists
    const existingProduct = await Product.findOne({ slug });
    if (existingProduct) {
      sendError(
        res,
        "Product already exists",
        "A product with this name already exists",
        409
      );
      return;
    }

    const product = new Product({
      name,
      slug,
      description,
      shortDescription,
      category,
      productCollection: collection,
      brand,
      tags,
      skus,
      basePrice,
      images,
      features,
      materials,
      careInstructions,
      sizeChart,
      isActive,
      isFeatured,
      metaTitle,
      metaDescription,
    });

    await product.save();

    // Populate the saved product
    const populatedProduct = await Product.findById(product._id)
      .populate("category", "name slug")
      .populate("productCollection", "name slug code type");

    sendSuccess(res, "Product created successfully", populatedProduct, 201);
  } catch (error) {
    sendError(
      res,
      "Failed to create product",
      error instanceof Error ? error.message : "Unknown error",
      500
    );
  }
};

// Update product
export const updateProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      sendError(res, "Validation failed", undefined, 400, errors.array());
      return;
    }

    const { id } = req.params;
    const {
      name,
      description,
      shortDescription,
      category,
      brand,
      tags,
      basePrice,
      images,
      features,
      materials,
      careInstructions,
      sizeChart,
      isActive,
      isFeatured,
      metaTitle,
      metaDescription,
    } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      sendError(res, "Product not found", undefined, 404);
      return;
    }

    // Check if category exists (if category is being updated)
    if (category && category !== product.category.toString()) {
      const categoryDoc = await Category.findById(category);
      if (!categoryDoc) {
        sendError(res, "Category not found", undefined, 404);
        return;
      }
    }

    // Update slug if name is changed
    if (name && name !== product.name) {
      const newSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      const existingProduct = await Product.findOne({
        slug: newSlug,
        _id: { $ne: id },
      });
      if (existingProduct) {
        sendError(res, "Product with this name already exists", undefined, 409);
        return;
      }
      product.slug = newSlug;
    }

    // Update fields
    if (name) product.name = name;
    if (description !== undefined) product.description = description;
    if (shortDescription !== undefined)
      product.shortDescription = shortDescription;
    if (category) product.category = category;
    if (brand !== undefined) product.brand = brand;
    if (tags !== undefined) product.tags = tags;
    if (basePrice) product.basePrice = basePrice;
    if (images !== undefined) product.images = images;
    if (features !== undefined) product.features = features;
    if (materials !== undefined) product.materials = materials;
    if (careInstructions !== undefined)
      product.careInstructions = careInstructions;
    if (sizeChart !== undefined) product.sizeChart = sizeChart;
    if (isActive !== undefined) product.isActive = isActive;
    if (isFeatured !== undefined) product.isFeatured = isFeatured;
    if (metaTitle !== undefined) product.metaTitle = metaTitle;
    if (metaDescription !== undefined)
      product.metaDescription = metaDescription;

    await product.save();
    await product.populate("category", "name slug");

    sendSuccess(res, "Product updated successfully", product);
  } catch (error) {
    sendError(
      res,
      "Failed to update product",
      error instanceof Error ? error.message : "Unknown error",
      500
    );
  }
};

// Delete product
export const deleteProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      sendError(res, "Product not found", undefined, 404);
      return;
    }

    await Product.findByIdAndDelete(id);
    sendSuccess(res, "Product deleted successfully");
  } catch (error) {
    sendError(
      res,
      "Failed to delete product",
      error instanceof Error ? error.message : "Unknown error",
      500
    );
  }
};

// Add SKU to product
export const addProductSKU = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      sendError(res, "Validation failed", undefined, 400, errors.array());
      return;
    }

    const { id } = req.params;
    const { size, color, stock, price, compareAtPrice, weight, images } =
      req.body;

    const product = await Product.findById(id);
    if (!product) {
      sendError(res, "Product not found", undefined, 404);
      return;
    }

    // Generate SKU
    const category = await Category.findById(product.category);
    const categoryCode = category?.name.substring(0, 3).toUpperCase() || "GEN";
    const sku = product.generateSKU(size, color, categoryCode);

    // Check if SKU already exists
    const existingSKU = product.skus.find((s) => s.sku === sku);
    if (existingSKU) {
      sendError(
        res,
        "SKU already exists for this size and color combination",
        undefined,
        409
      );
      return;
    }

    // Add new SKU
    product.skus.push({
      sku,
      size,
      color,
      stock,
      price,
      compareAtPrice,
      weight,
      images: images || [],
      isActive: true,
    });

    await product.save();
    await product.populate("category", "name slug");

    sendSuccess(res, "SKU added successfully", product);
  } catch (error) {
    sendError(
      res,
      "Failed to add SKU",
      error instanceof Error ? error.message : "Unknown error",
      500
    );
  }
};

// Update SKU
export const updateProductSKU = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      sendError(res, "Validation failed", undefined, 400, errors.array());
      return;
    }

    const { id, skuId } = req.params;
    const {
      size,
      color,
      stock,
      price,
      compareAtPrice,
      weight,
      images,
      isActive,
    } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      sendError(res, "Product not found", undefined, 404);
      return;
    }

    const skuIndex = product.skus.findIndex((s) => s._id?.toString() === skuId);
    if (skuIndex === -1) {
      sendError(res, "SKU not found", undefined, 404);
      return;
    }

    // Update SKU fields
    if (size) product.skus[skuIndex].size = size;
    if (color) product.skus[skuIndex].color = color;
    if (stock !== undefined) product.skus[skuIndex].stock = stock;
    if (price) product.skus[skuIndex].price = price;
    if (compareAtPrice !== undefined)
      product.skus[skuIndex].compareAtPrice = compareAtPrice;
    if (weight) product.skus[skuIndex].weight = weight;
    if (images !== undefined) product.skus[skuIndex].images = images;
    if (isActive !== undefined) product.skus[skuIndex].isActive = isActive;

    await product.save();
    await product.populate("category", "name slug");

    sendSuccess(res, "SKU updated successfully", product);
  } catch (error) {
    sendError(
      res,
      "Failed to update SKU",
      error instanceof Error ? error.message : "Unknown error",
      500
    );
  }
};

// Delete SKU
export const deleteProductSKU = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id, skuId } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      sendError(res, "Product not found", undefined, 404);
      return;
    }

    const skuIndex = product.skus.findIndex((s) => s._id?.toString() === skuId);
    if (skuIndex === -1) {
      sendError(res, "SKU not found", undefined, 404);
      return;
    }

    product.skus.splice(skuIndex, 1);
    await product.save();
    await product.populate("category", "name slug");

    sendSuccess(res, "SKU deleted successfully", product);
  } catch (error) {
    sendError(
      res,
      "Failed to delete SKU",
      error instanceof Error ? error.message : "Unknown error",
      500
    );
  }
};
