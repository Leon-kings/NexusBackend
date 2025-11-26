// const Product = require('../models/ProductStore');
// const cloudinary = require('../cloudinary/cloudinary');
// const fs = require('fs');

// // Upload image to Cloudinary
// const uploadToCloudinary = async (filePath) => {
//   try {
//     const result = await cloudinary.uploader.upload(filePath, {
//       folder: 'Nexusproducts'
//     });
    
//     // Delete file from local storage
//     fs.unlinkSync(filePath);
    
//     return result;
//   } catch (error) {
//     // Delete file from local storage if upload fails
//     if (fs.existsSync(filePath)) {
//       fs.unlinkSync(filePath);
//     }
//     throw error;
//   }
// };

// // Create new product
// exports.createProduct = async (req, res) => {
//   try {
//     const files = req.files;
    
//     if (!files || !files.image) {
//       return res.status(400).json({ error: 'Main image is required' });
//     }

//     // Upload main image to Cloudinary
//     const mainImageResult = await uploadToCloudinary(files.image[0].path);
    
//     // Upload additional images if provided
//     let additionalImages = [];
//     if (files.images) {
//       for (const file of files.images) {
//         const result = await uploadToCloudinary(file.path);
//         additionalImages.push(result.secure_url);
//       }
//     }

//     const productData = {
//       ...req.body,
//       image: mainImageResult.secure_url,
//       images: additionalImages,
//       cloudinary_id: mainImageResult.public_id,
//       price: parseFloat(req.body.price),
//       originalPrice: parseFloat(req.body.originalPrice),
//       discount: parseFloat(req.body.discount),
//       stock: parseInt(req.body.stock) || 0,
//       stockIn: parseInt(req.body.stock) || 0,
//       rating: parseFloat(req.body.rating) || 0
//     };

//     // Parse specifications if provided as string
//     if (req.body.specifications) {
//       try {
//         productData.specifications = typeof req.body.specifications === 'string' 
//           ? JSON.parse(req.body.specifications) 
//           : req.body.specifications;
//       } catch (error) {
//         return res.status(400).json({ error: 'Invalid specifications format' });
//       }
//     }

//     // Parse features if provided as string
//     if (req.body.features) {
//       productData.features = typeof req.body.features === 'string'
//         ? JSON.parse(req.body.features)
//         : req.body.features;
//     }

//     const product = new Product(productData);
//     await product.save();

//     res.status(201).json({
//       success: true,
//       data: product
//     });
//   } catch (error) {
//     res.status(400).json({
//       success: false,
//       error: error.message
//     });
//   }
// };

// // Get all products
// exports.getAllProducts = async (req, res) => {
//   try {
//     const products = await Product.find();
//     res.json({
//       success: true,
//       count: products.length,
//       data: products
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       error: error.message
//     });
//   }
// };

// // Get single product
// exports.getProduct = async (req, res) => {
//   try {
//     const product = await Product.findById(req.params.id);
    
//     if (!product) {
//       return res.status(404).json({
//         success: false,
//         error: 'Product not found'
//       });
//     }

//     res.json({
//       success: true,
//       data: product
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       error: error.message
//     });
//   }
// };

// // Update product
// exports.updateProduct = async (req, res) => {
//   try {
//     const product = await Product.findById(req.params.id);
    
//     if (!product) {
//       return res.status(404).json({
//         success: false,
//         error: 'Product not found'
//       });
//     }

//     // Handle image updates if provided
//     if (req.files) {
//       if (req.files.image) {
//         // Delete old image from Cloudinary
//         if (product.cloudinary_id) {
//           await cloudinary.uploader.destroy(product.cloudinary_id);
//         }
        
//         // Upload new main image
//         const mainImageResult = await uploadToCloudinary(req.files.image[0].path);
//         req.body.image = mainImageResult.secure_url;
//         req.body.cloudinary_id = mainImageResult.public_id;
//       }

//       if (req.files.images) {
//         // Upload new additional images
//         const additionalImages = [];
//         for (const file of req.files.images) {
//           const result = await uploadToCloudinary(file.path);
//           additionalImages.push(result.secure_url);
//         }
//         req.body.images = [...product.images, ...additionalImages];
//       }
//     }

//     // Parse numeric fields
//     if (req.body.price) req.body.price = parseFloat(req.body.price);
//     if (req.body.originalPrice) req.body.originalPrice = parseFloat(req.body.originalPrice);
//     if (req.body.discount) req.body.discount = parseFloat(req.body.discount);
//     if (req.body.rating) req.body.rating = parseFloat(req.body.rating);

//     const updatedProduct = await Product.findByIdAndUpdate(
//       req.params.id,
//       req.body,
//       { new: true, runValidators: true }
//     );

//     res.json({
//       success: true,
//       data: updatedProduct
//     });
//   } catch (error) {
//     res.status(400).json({
//       success: false,
//       error: error.message
//     });
//   }
// };

// // Sell product (reduce stock)
// exports.sellProduct = async (req, res) => {
//   try {
//     const { quantity = 1 } = req.body;
//     const product = await Product.findById(req.params.id);
    
//     if (!product) {
//       return res.status(404).json({
//         success: false,
//         error: 'Product not found'
//       });
//     }

//     await product.sellProduct(parseInt(quantity));

//     res.json({
//       success: true,
//       message: `Sold ${quantity} item(s) of ${product.name}`,
//       data: product
//     });
//   } catch (error) {
//     res.status(400).json({
//       success: false,
//       error: error.message
//     });
//   }
// };

// // Add stock
// exports.addStock = async (req, res) => {
//   try {
//     const { quantity } = req.body;
    
//     if (!quantity || quantity <= 0) {
//       return res.status(400).json({
//         success: false,
//         error: 'Valid quantity is required'
//       });
//     }

//     const product = await Product.findById(req.params.id);
    
//     if (!product) {
//       return res.status(404).json({
//         success: false,
//         error: 'Product not found'
//       });
//     }

//     await product.addStock(parseInt(quantity));

//     res.json({
//       success: true,
//       message: `Added ${quantity} item(s) to stock`,
//       data: product
//     });
//   } catch (error) {
//     res.status(400).json({
//       success: false,
//       error: error.message
//     });
//   }
// };

// // Delete product
// exports.deleteProduct = async (req, res) => {
//   try {
//     const product = await Product.findById(req.params.id);
    
//     if (!product) {
//       return res.status(404).json({
//         success: false,
//         error: 'Product not found'
//       });
//     }

//     // Delete images from Cloudinary
//     if (product.cloudinary_id) {
//       await cloudinary.uploader.destroy(product.cloudinary_id);
//     }

//     // Delete additional images
//     if (product.images && product.images.length > 0) {
//       for (const imageUrl of product.images) {
//         const publicId = imageUrl.split('/').pop().split('.')[0];
//         await cloudinary.uploader.destroy(`products/${publicId}`);
//       }
//     }

//     await Product.findByIdAndDelete(req.params.id);

//     res.json({
//       success: true,
//       message: 'Product deleted successfully'
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       error: error.message
//     });
//   }
// };
const Product = require('../models/ProductStore');
const { cloudinary, upload } = require('../cloudinary/cloudinary');

// Configure multer for Cloudinary uploads
const productUpload = multer({
  storage: new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'Nexusproducts',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
      transformation: [{ width: 800, height: 800, crop: 'limit' }]
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Upload multiple images to Cloudinary
const uploadToCloudinary = async (files) => {
  try {
    console.log('Uploading files to Cloudinary:', files.length);
    
    const uploadResults = [];
    
    for (const file of files) {
      try {
        // Since we're using CloudinaryStorage, files are already uploaded
        // We just need to extract the Cloudinary result from the file object
        const result = {
          secure_url: file.path,
          public_id: file.filename
        };
        
        console.log('File uploaded to Cloudinary:', result.secure_url);
        uploadResults.push(result);
      } catch (fileError) {
        console.error('Failed to process file:', file.originalname, fileError);
        throw new Error(`Failed to upload ${file.originalname}: ${fileError.message}`);
      }
    }
    
    return uploadResults;
  } catch (error) {
    console.error('Cloudinary upload batch error:', error);
    throw error;
  }
};

// Create new product - UPDATED FOR CLOUDINARY
exports.createProduct = async (req, res) => {
  try {
    console.log('=== CREATE PRODUCT REQUEST ===');
    console.log('Request files:', req.files ? Object.keys(req.files) : 'No files');
    console.log('Request body keys:', Object.keys(req.body));
    
    const files = req.files;
    
    // Validate required files
    if (!files || !files.image || files.image.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Main image is required' 
      });
    }

    // Get main image (first image)
    const mainImageFile = files.image[0];
    
    console.log('Main image file info:', {
      originalname: mainImageFile.originalname,
      path: mainImageFile.path, // This is the Cloudinary URL
      size: mainImageFile.size,
      mimetype: mainImageFile.mimetype
    });

    // Process additional images
    let additionalImages = [];
    let additionalCloudinaryIds = [];
    
    if (files.images && files.images.length > 0) {
      console.log('Processing additional images:', files.images.length);
      
      for (const file of files.images) {
        additionalImages.push(file.path); // Cloudinary URL
        additionalCloudinaryIds.push(file.filename); // Cloudinary public_id
      }
    }

    // Parse and validate product data
    const productData = {
      name: req.body.name?.trim(),
      description: req.body.description?.trim(),
      sku: req.body.sku?.trim(),
      category: req.body.category?.trim() || 'electronics',
      price: parseFloat(req.body.price) || 0,
      originalPrice: parseFloat(req.body.originalPrice) || parseFloat(req.body.comparePrice) || 0,
      cost: parseFloat(req.body.cost) || 0,
      discount: parseFloat(req.body.discount) || 0,
      stock: parseInt(req.body.stock) || 0,
      stockIn: parseInt(req.body.stock) || 0,
      rating: parseFloat(req.body.rating) || 0,
      lowStockAlert: parseInt(req.body.lowStockAlert) || 10,
      brand: req.body.brand?.trim(),
      model: req.body.model?.trim(),
      warranty: req.body.warranty?.trim(),
      vendor: req.body.vendor?.trim(),
      weight: req.body.weight ? parseFloat(req.body.weight) : null,
      image: mainImageFile.path, // Cloudinary URL
      images: additionalImages,
      cloudinary_id: mainImageFile.filename, // Cloudinary public_id for main image
      additional_cloudinary_ids: additionalCloudinaryIds,
      isActive: req.body.isActive === 'true' || req.body.isActive === true || true,
      isDigital: req.body.isDigital === 'true' || req.body.isDigital === true || false,
      isAvailable: req.body.isAvailable === 'true' || req.body.isAvailable === true || true,
      isFeatured: req.body.isFeatured === 'true' || req.body.isFeatured === true || false
    };

    // Validate required fields
    if (!productData.name || !productData.sku) {
      return res.status(400).json({ 
        success: false, 
        error: 'Product name and SKU are required' 
      });
    }

    // Parse JSON fields with error handling
    if (req.body.features) {
      try {
        productData.features = typeof req.body.features === 'string' 
          ? JSON.parse(req.body.features) 
          : req.body.features;
        
        if (!Array.isArray(productData.features)) {
          productData.features = [];
        }
      } catch (error) {
        console.warn('Failed to parse features, using empty array:', error.message);
        productData.features = [];
      }
    } else {
      productData.features = [];
    }

    if (req.body.tags) {
      try {
        productData.tags = typeof req.body.tags === 'string'
          ? JSON.parse(req.body.tags)
          : req.body.tags;
        
        if (!Array.isArray(productData.tags)) {
          productData.tags = [];
        }
      } catch (error) {
        console.warn('Failed to parse tags, using empty array:', error.message);
        productData.tags = [];
      }
    } else {
      productData.tags = [];
    }

    if (req.body.dimensions) {
      try {
        productData.dimensions = typeof req.body.dimensions === 'string'
          ? JSON.parse(req.body.dimensions)
          : req.body.dimensions;
      } catch (error) {
        console.warn('Failed to parse dimensions:', error.message);
        productData.dimensions = {};
      }
    }

    if (req.body.seo) {
      try {
        productData.seo = typeof req.body.seo === 'string'
          ? JSON.parse(req.body.seo)
          : req.body.seo;
      } catch (error) {
        console.warn('Failed to parse seo:', error.message);
        productData.seo = {};
      }
    }

    if (req.body.specifications) {
      try {
        productData.specifications = typeof req.body.specifications === 'string'
          ? JSON.parse(req.body.specifications)
          : req.body.specifications;
      } catch (error) {
        console.warn('Failed to parse specifications:', error.message);
        productData.specifications = {};
      }
    }

    console.log('Creating product with data:', {
      name: productData.name,
      sku: productData.sku,
      price: productData.price,
      image: productData.image,
      imagesCount: productData.images.length
    });

    const product = new Product(productData);
    await product.save();

    console.log('Product created successfully:', product._id);

    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('Error getting products:', error);
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
    console.error('Error getting product:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update product - UPDATED FOR CLOUDINARY
exports.updateProduct = async (req, res) => {
  try {
    console.log('=== UPDATE PRODUCT REQUEST ===');
    console.log('Product ID:', req.params.id);
    console.log('Request files:', req.files ? Object.keys(req.files) : 'No files');
    
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    const updateData = { ...req.body };
    const files = req.files;

    // Handle image updates if provided
    if (files) {
      // Update main image if provided
      if (files.image && files.image.length > 0) {
        const newMainImage = files.image[0];
        
        // Delete old main image from Cloudinary if exists
        if (product.cloudinary_id) {
          try {
            await cloudinary.uploader.destroy(product.cloudinary_id);
            console.log('Deleted old main image from Cloudinary:', product.cloudinary_id);
          } catch (deleteError) {
            console.warn('Could not delete old main image:', deleteError.message);
          }
        }
        
        updateData.image = newMainImage.path;
        updateData.cloudinary_id = newMainImage.filename;
      }

      // Add new additional images if provided
      if (files.images && files.images.length > 0) {
        const newAdditionalImages = files.images.map(file => file.path);
        const newAdditionalIds = files.images.map(file => file.filename);
        
        updateData.images = [...(product.images || []), ...newAdditionalImages];
        updateData.additional_cloudinary_ids = [...(product.additional_cloudinary_ids || []), ...newAdditionalIds];
      }
    }

    // Parse numeric fields
    if (req.body.price) updateData.price = parseFloat(req.body.price);
    if (req.body.originalPrice) updateData.originalPrice = parseFloat(req.body.originalPrice);
    if (req.body.comparePrice) updateData.comparePrice = parseFloat(req.body.comparePrice);
    if (req.body.cost) updateData.cost = parseFloat(req.body.cost);
    if (req.body.discount) updateData.discount = parseFloat(req.body.discount);
    if (req.body.rating) updateData.rating = parseFloat(req.body.rating);
    if (req.body.stock) updateData.stock = parseInt(req.body.stock);
    if (req.body.lowStockAlert) updateData.lowStockAlert = parseInt(req.body.lowStockAlert);
    if (req.body.weight) updateData.weight = parseFloat(req.body.weight);

    // Parse boolean fields
    if (req.body.isActive !== undefined) {
      updateData.isActive = req.body.isActive === 'true' || req.body.isActive === true;
    }
    if (req.body.isDigital !== undefined) {
      updateData.isDigital = req.body.isDigital === 'true' || req.body.isDigital === true;
    }
    if (req.body.isAvailable !== undefined) {
      updateData.isAvailable = req.body.isAvailable === 'true' || req.body.isAvailable === true;
    }
    if (req.body.isFeatured !== undefined) {
      updateData.isFeatured = req.body.isFeatured === 'true' || req.body.isFeatured === true;
    }

    // Parse JSON fields
    const jsonFields = ['features', 'tags', 'dimensions', 'seo', 'specifications'];
    jsonFields.forEach(field => {
      if (req.body[field]) {
        try {
          updateData[field] = typeof req.body[field] === 'string' 
            ? JSON.parse(req.body[field]) 
            : req.body[field];
        } catch (error) {
          console.warn(`Failed to parse ${field}:`, error.message);
          // Keep existing value if parsing fails
          delete updateData[field];
        }
      }
    });

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    console.log('Product updated successfully:', updatedProduct._id);

    res.json({
      success: true,
      data: updatedProduct
    });
  } catch (error) {
    console.error('Error updating product:', error);
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

    // Use the sellProduct method from your model
    await product.sellProduct(parseInt(quantity));

    res.json({
      success: true,
      message: `Sold ${quantity} item(s) of ${product.name}`,
      data: product
    });
  } catch (error) {
    console.error('Error selling product:', error);
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

    // Use the addStock method from your model
    await product.addStock(parseInt(quantity));

    res.json({
      success: true,
      message: `Added ${quantity} item(s) to stock`,
      data: product
    });
  } catch (error) {
    console.error('Error adding stock:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Delete product - UPDATED FOR CLOUDINARY
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    console.log('Deleting product and its images from Cloudinary:', product._id);

    // Delete main image from Cloudinary
    if (product.cloudinary_id) {
      try {
        await cloudinary.uploader.destroy(product.cloudinary_id);
        console.log('Deleted main image from Cloudinary:', product.cloudinary_id);
      } catch (deleteError) {
        console.warn('Could not delete main image from Cloudinary:', deleteError.message);
      }
    }

    // Delete additional images from Cloudinary
    if (product.additional_cloudinary_ids && product.additional_cloudinary_ids.length > 0) {
      console.log('Deleting additional images:', product.additional_cloudinary_ids.length);
      
      for (const publicId of product.additional_cloudinary_ids) {
        try {
          await cloudinary.uploader.destroy(publicId);
          console.log('Deleted additional image from Cloudinary:', publicId);
        } catch (deleteError) {
          console.warn('Could not delete additional image:', publicId, deleteError.message);
        }
      }
    }

    await Product.findByIdAndDelete(req.params.id);

    console.log('Product deleted successfully:', req.params.id);

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Remove specific image from product
exports.removeProductImage = async (req, res) => {
  try {
    const { imageUrl, imageType } = req.body; // imageType: 'main' or 'additional'
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    if (imageType === 'main') {
      // Delete main image from Cloudinary
      if (product.cloudinary_id) {
        await cloudinary.uploader.destroy(product.cloudinary_id);
      }
      
      product.image = null;
      product.cloudinary_id = null;
      
    } else if (imageType === 'additional') {
      // Find and remove additional image
      const imageIndex = product.images.indexOf(imageUrl);
      if (imageIndex > -1) {
        // Get public_id from the additional_cloudinary_ids array
        const publicId = product.additional_cloudinary_ids[imageIndex];
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
        
        product.images.splice(imageIndex, 1);
        product.additional_cloudinary_ids.splice(imageIndex, 1);
      }
    }

    await product.save();

    res.json({
      success: true,
      message: 'Image removed successfully',
      data: product
    });
  } catch (error) {
    console.error('Error removing product image:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

module.exports.upload = productUpload;