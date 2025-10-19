const Product = require('../models/ProductStore');
const cloudinary = require('../cloudinary/cloudinary');
const fs = require('fs');

// Upload image to Cloudinary
const uploadToCloudinary = async (filePath) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'Nexusproducts'
    });
    
    // Delete file from local storage
    fs.unlinkSync(filePath);
    
    return result;
  } catch (error) {
    // Delete file from local storage if upload fails
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw error;
  }
};

// Create new product
exports.createProduct = async (req, res) => {
  try {
    const files = req.files;
    
    if (!files || !files.image) {
      return res.status(400).json({ error: 'Main image is required' });
    }

    // Upload main image to Cloudinary
    const mainImageResult = await uploadToCloudinary(files.image[0].path);
    
    // Upload additional images if provided
    let additionalImages = [];
    if (files.images) {
      for (const file of files.images) {
        const result = await uploadToCloudinary(file.path);
        additionalImages.push(result.secure_url);
      }
    }

    const productData = {
      ...req.body,
      image: mainImageResult.secure_url,
      images: additionalImages,
      cloudinary_id: mainImageResult.public_id,
      price: parseFloat(req.body.price),
      originalPrice: parseFloat(req.body.originalPrice),
      discount: parseFloat(req.body.discount),
      stock: parseInt(req.body.stock) || 0,
      stockIn: parseInt(req.body.stock) || 0,
      rating: parseFloat(req.body.rating) || 0
    };

    // Parse specifications if provided as string
    if (req.body.specifications) {
      try {
        productData.specifications = typeof req.body.specifications === 'string' 
          ? JSON.parse(req.body.specifications) 
          : req.body.specifications;
      } catch (error) {
        return res.status(400).json({ error: 'Invalid specifications format' });
      }
    }

    // Parse features if provided as string
    if (req.body.features) {
      productData.features = typeof req.body.features === 'string'
        ? JSON.parse(req.body.features)
        : req.body.features;
    }

    const product = new Product(productData);
    await product.save();

    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get single product
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Handle image updates if provided
    if (req.files) {
      if (req.files.image) {
        // Delete old image from Cloudinary
        if (product.cloudinary_id) {
          await cloudinary.uploader.destroy(product.cloudinary_id);
        }
        
        // Upload new main image
        const mainImageResult = await uploadToCloudinary(req.files.image[0].path);
        req.body.image = mainImageResult.secure_url;
        req.body.cloudinary_id = mainImageResult.public_id;
      }

      if (req.files.images) {
        // Upload new additional images
        const additionalImages = [];
        for (const file of req.files.images) {
          const result = await uploadToCloudinary(file.path);
          additionalImages.push(result.secure_url);
        }
        req.body.images = [...product.images, ...additionalImages];
      }
    }

    // Parse numeric fields
    if (req.body.price) req.body.price = parseFloat(req.body.price);
    if (req.body.originalPrice) req.body.originalPrice = parseFloat(req.body.originalPrice);
    if (req.body.discount) req.body.discount = parseFloat(req.body.discount);
    if (req.body.rating) req.body.rating = parseFloat(req.body.rating);

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: updatedProduct
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Sell product (reduce stock)
exports.sellProduct = async (req, res) => {
  try {
    const { quantity = 1 } = req.body;
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    await product.sellProduct(parseInt(quantity));

    res.json({
      success: true,
      message: `Sold ${quantity} item(s) of ${product.name}`,
      data: product
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Add stock
exports.addStock = async (req, res) => {
  try {
    const { quantity } = req.body;
    
    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid quantity is required'
      });
    }

    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    await product.addStock(parseInt(quantity));

    res.json({
      success: true,
      message: `Added ${quantity} item(s) to stock`,
      data: product
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Delete images from Cloudinary
    if (product.cloudinary_id) {
      await cloudinary.uploader.destroy(product.cloudinary_id);
    }

    // Delete additional images
    if (product.images && product.images.length > 0) {
      for (const imageUrl of product.images) {
        const publicId = imageUrl.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`products/${publicId}`);
      }
    }

    await Product.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};