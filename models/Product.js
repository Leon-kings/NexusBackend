// const mongoose = require('mongoose');

// const productSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: [true, 'Product name is required'],
//     trim: true,
//     maxlength: [200, 'Product name cannot be more than 200 characters'],
//   },
//   description: {
//     type: String,
//     required: [true, 'Product description is required'],
//     maxlength: [5000, 'Description cannot be more than 5000 characters'],
//   },
//   sku: {
//     type: String,
//     required: [true, 'SKU is required'],
//     unique: true,
//     uppercase: true,
//   },
//   category: {
//     type: String,
//     required: [true, 'Category is required'],
//     enum: [
//       'electronics', 'clothing', 'books', 'home-garden', 'sports', 'beauty',
//       'toys', 'food-beverages', 'digital-products', 'services', 'other',
//     ],
//   },
//   price: { type: Number, required: true, min: [0, 'Price cannot be negative'] },
//   comparePrice: { type: Number, min: [0, 'Compare price cannot be negative'] },
//   cost: { type: Number, min: [0, 'Cost cannot be negative'] },
//   stock: { type: Number, required: true, min: [0, 'Stock cannot be negative'], default: 0 },
//   lowStockAlert: { type: Number, default: 10 },
//   images: [
//     {
//       url: { type: String, required: true },
//       alt: String,
//       isPrimary: { type: Boolean, default: false },
//     },
//   ],
//   variants: [
//     {
//       name: String,
//       options: [String],
//       price: Number,
//       stock: Number,
//       sku: String,
//     },
//   ],
//   tags: [String],
//   isActive: { type: Boolean, default: true },
//   isDigital: { type: Boolean, default: false },
//   weight: { type: Number, min: [0, 'Weight cannot be negative'] },
//   dimensions: { length: Number, width: Number, height: Number },
//   seo: { title: String, description: String, slug: String },
//   metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
// }, { timestamps: true });

// // =======================
// // Indexes
// // =======================
// productSchema.index({ category: 1 });
// productSchema.index({ sku: 1 });
// productSchema.index({ price: 1 });
// productSchema.index({ stock: 1 });
// productSchema.index({ isActive: 1 });
// productSchema.index({ 'seo.slug': 1 });

// // =======================
// // Hooks
// // =======================
// productSchema.pre('save', function (next) {
//   if (!this.seo) this.seo = {};
//   if (!this.seo.slug && this.name) {
//     this.seo.slug = this.name
//       .toLowerCase()
//       .replace(/[^a-z0-9 -]/g, '')
//       .replace(/\s+/g, '-')
//       .replace(/-+/g, '-');
//   }
//   next();
// });

// // =======================
// // Virtuals
// // =======================
// productSchema.virtual('inStock').get(function () {
//   return this.stock > 0;
// });

// productSchema.virtual('isLowStock').get(function () {
//   return this.stock <= this.lowStockAlert && this.stock > 0;
// });

// productSchema.virtual('profitMargin').get(function () {
//   if (!this.cost || this.cost === 0) return 0;
//   return Number(((this.price - this.cost) / this.cost * 100).toFixed(2));
// });

// // =======================
// // Statics
// // =======================
// productSchema.statics.getInventoryStats = async function () {
//   const stats = await this.aggregate([
//     {
//       $group: {
//         _id: '$category',
//         totalProducts: { $sum: 1 },
//         totalStock: { $sum: '$stock' },
//         totalValue: { $sum: { $multiply: ['$price', '$stock'] } },
//         lowStockCount: {
//           $sum: {
//             $cond: [
//               { $and: [{ $lte: ['$stock', '$lowStockAlert'] }, { $gt: ['$stock', 0] }] },
//               1, 0,
//             ],
//           },
//         },
//         outOfStockCount: { $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] } },
//       },
//     },
//   ]);

//   const overallStats = await this.aggregate([
//     {
//       $group: {
//         _id: null,
//         totalProducts: { $sum: 1 },
//         activeProducts: { $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } },
//         totalStockValue: { $sum: { $multiply: ['$price', '$stock'] } },
//         averagePrice: { $avg: '$price' },
//         lowStockItems: {
//           $sum: {
//             $cond: [
//               { $and: [{ $lte: ['$stock', '$lowStockAlert'] }, { $gt: ['$stock', 0] }] },
//               1, 0,
//             ],
//           },
//         },
//         outOfStockItems: { $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] } },
//       },
//     },
//   ]);

//   return {
//     byCategory: stats,
//     overview: overallStats[0] || {
//       totalProducts: 0,
//       activeProducts: 0,
//       totalStockValue: 0,
//       averagePrice: 0,
//       lowStockItems: 0,
//       outOfStockItems: 0,
//     },
//   };
// };

// // =======================
// // Safe Export (Prevents “Cannot overwrite model” error)
// // =======================
// module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot be more than 200 characters'],
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    maxlength: [5000, 'Description cannot be more than 5000 characters'],
  },
  sku: {
    type: String,
    required: [true, 'SKU is required'],
    unique: true,
    uppercase: true,
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'electronics', 'clothing', 'books', 'home-garden', 'sports', 'beauty',
      'toys', 'food-beverages', 'digital-products', 'services', 'other',
    ],
    default: 'electronics'
  },
  price: { 
    type: Number, 
    required: true, 
    min: [0, 'Price cannot be negative'] 
  },
  originalPrice: { 
    type: Number, 
    min: [0, 'Original price cannot be negative'] 
  },
  comparePrice: { 
    type: Number, 
    min: [0, 'Compare price cannot be negative'] 
  },
  cost: { 
    type: Number, 
    min: [0, 'Cost cannot be negative'] 
  },
  discount: { 
    type: Number, 
    min: [0, 'Discount cannot be negative'],
    default: 0
  },
  stock: { 
    type: Number, 
    required: true, 
    min: [0, 'Stock cannot be negative'], 
    default: 0 
  },
  stockIn: { 
    type: Number, 
    min: [0, 'Stock cannot be negative'], 
    default: 0 
  },
  rating: { 
    type: Number, 
    min: [0, 'Rating cannot be negative'],
    max: [5, 'Rating cannot be more than 5'],
    default: 0
  },
  lowStockAlert: { 
    type: Number, 
    default: 10 
  },
  brand: {
    type: String,
    trim: true
  },
  model: {
    type: String,
    trim: true
  },
  warranty: {
    type: String,
    trim: true
  },
  vendor: {
    type: String,
    trim: true
  },
  // Main product image (Cloudinary URL)
  image: {
    type: String,
    required: [true, 'Main product image is required']
  },
  // Cloudinary public_id for main image
  cloudinary_id: {
    type: String,
    required: [true, 'Cloudinary ID is required']
  },
  // Additional images array (Cloudinary URLs)
  images: [String],
  // Cloudinary public_ids for additional images
  additional_cloudinary_ids: [String],
  // Product specifications
  specifications: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Product features array
  features: [String],
  variants: [
    {
      name: String,
      options: [String],
      price: Number,
      stock: Number,
      sku: String,
    },
  ],
  tags: [String],
  isActive: { 
    type: Boolean, 
    default: true 
  },
  isDigital: { 
    type: Boolean, 
    default: false 
  },
  isAvailable: { 
    type: Boolean, 
    default: true 
  },
  isFeatured: { 
    type: Boolean, 
    default: false 
  },
  weight: { 
    type: Number, 
    min: [0, 'Weight cannot be negative'] 
  },
  dimensions: { 
    length: Number, 
    width: Number, 
    height: Number 
  },
  seo: { 
    title: String, 
    description: String, 
    keywords: String,
    slug: String 
  },
  metadata: { 
    type: mongoose.Schema.Types.Mixed, 
    default: {} 
  },
}, { 
  timestamps: true 
});

// =======================
// Indexes
// =======================
productSchema.index({ category: 1 });
productSchema.index({ sku: 1 });
productSchema.index({ price: 1 });
productSchema.index({ stock: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ 'seo.slug': 1 });
productSchema.index({ brand: 1 });
productSchema.index({ tags: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ rating: -1 });

// =======================
// Hooks
// =======================
productSchema.pre('save', function (next) {
  // Auto-generate SEO slug if not provided
  if (!this.seo) this.seo = {};
  if (!this.seo.slug && this.name) {
    this.seo.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }
  
  // Set stockIn to match stock if not set
  if (!this.stockIn && this.stock !== undefined) {
    this.stockIn = this.stock;
  }
  
  // Set originalPrice to price if not provided
  if (!this.originalPrice && this.price !== undefined) {
    this.originalPrice = this.price;
  }
  
  // Calculate discount percentage if not provided
  if (this.originalPrice && this.price && !this.discount) {
    const discountAmount = this.originalPrice - this.price;
    if (discountAmount > 0) {
      this.discount = Number(((discountAmount / this.originalPrice) * 100).toFixed(2));
    }
  }
  
  next();
});

// =======================
// Virtuals
// =======================
productSchema.virtual('inStock').get(function () {
  return this.stock > 0;
});

productSchema.virtual('isLowStock').get(function () {
  return this.stock <= this.lowStockAlert && this.stock > 0;
});

productSchema.virtual('profitMargin').get(function () {
  if (!this.cost || this.cost === 0) return 0;
  return Number(((this.price - this.cost) / this.cost * 100).toFixed(2));
});

productSchema.virtual('discountAmount').get(function () {
  if (!this.originalPrice || !this.price) return 0;
  return this.originalPrice - this.price;
});

productSchema.virtual('totalImages').get(function () {
  return 1 + (this.images ? this.images.length : 0); // Main image + additional images
});

// =======================
// Methods
// =======================
productSchema.methods.sellProduct = async function(quantity = 1) {
  if (this.stock < quantity) {
    throw new Error(`Insufficient stock. Available: ${this.stock}, Requested: ${quantity}`);
  }
  
  this.stock -= quantity;
  await this.save();
  return this;
};

productSchema.methods.addStock = async function(quantity) {
  if (quantity <= 0) {
    throw new Error('Quantity must be greater than 0');
  }
  
  this.stock += quantity;
  this.stockIn += quantity; // Also update stockIn
  await this.save();
  return this;
};

productSchema.methods.updateStock = async function(newStock) {
  if (newStock < 0) {
    throw new Error('Stock cannot be negative');
  }
  
  this.stock = newStock;
  // Only update stockIn if it's less than the new stock
  if (this.stockIn < newStock) {
    this.stockIn = newStock;
  }
  await this.save();
  return this;
};

productSchema.methods.toggleActive = async function() {
  this.isActive = !this.isActive;
  await this.save();
  return this;
};

productSchema.methods.toggleFeatured = async function() {
  this.isFeatured = !this.isFeatured;
  await this.save();
  return this;
};

productSchema.methods.addImage = async function(imageUrl, cloudinaryId) {
  if (!this.images) {
    this.images = [];
  }
  if (!this.additional_cloudinary_ids) {
    this.additional_cloudinary_ids = [];
  }
  
  this.images.push(imageUrl);
  this.additional_cloudinary_ids.push(cloudinaryId);
  await this.save();
  return this;
};

productSchema.methods.removeImage = async function(imageIndex) {
  if (!this.images || this.images.length <= imageIndex) {
    throw new Error('Image not found');
  }
  
  this.images.splice(imageIndex, 1);
  if (this.additional_cloudinary_ids && this.additional_cloudinary_ids.length > imageIndex) {
    this.additional_cloudinary_ids.splice(imageIndex, 1);
  }
  await this.save();
  return this;
};

// =======================
// Statics
// =======================
productSchema.statics.getInventoryStats = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$category',
        totalProducts: { $sum: 1 },
        totalStock: { $sum: '$stock' },
        totalValue: { $sum: { $multiply: ['$price', '$stock'] } },
        lowStockCount: {
          $sum: {
            $cond: [
              { $and: [{ $lte: ['$stock', '$lowStockAlert'] }, { $gt: ['$stock', 0] }] },
              1, 0,
            ],
          },
        },
        outOfStockCount: { $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] } },
        averagePrice: { $avg: '$price' },
        featuredCount: { $sum: { $cond: [{ $eq: ['$isFeatured', true] }, 1, 0] } },
      },
    },
  ]);

  const overallStats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalProducts: { $sum: 1 },
        activeProducts: { $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } },
        totalStockValue: { $sum: { $multiply: ['$price', '$stock'] } },
        averagePrice: { $avg: '$price' },
        lowStockItems: {
          $sum: {
            $cond: [
              { $and: [{ $lte: ['$stock', '$lowStockAlert'] }, { $gt: ['$stock', 0] }] },
              1, 0,
            ],
          },
        },
        outOfStockItems: { $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] } },
        featuredProducts: { $sum: { $cond: [{ $eq: ['$isFeatured', true] }, 1, 0] } },
        digitalProducts: { $sum: { $cond: [{ $eq: ['$isDigital', true] }, 1, 0] } },
      },
    },
  ]);

  return {
    byCategory: stats,
    overview: overallStats[0] || {
      totalProducts: 0,
      activeProducts: 0,
      totalStockValue: 0,
      averagePrice: 0,
      lowStockItems: 0,
      outOfStockItems: 0,
      featuredProducts: 0,
      digitalProducts: 0,
    },
  };
};

productSchema.statics.getFeaturedProducts = async function(limit = 10) {
  return this.find({ 
    isFeatured: true, 
    isActive: true,
    stock: { $gt: 0 }
  })
  .sort({ createdAt: -1 })
  .limit(limit);
};

productSchema.statics.getLowStockProducts = async function() {
  return this.find({
    stock: { $lte: '$lowStockAlert', $gt: 0 },
    isActive: true
  }).sort({ stock: 1 });
};

productSchema.statics.getOutOfStockProducts = async function() {
  return this.find({
    stock: 0,
    isActive: true
  }).sort({ createdAt: -1 });
};

productSchema.statics.searchProducts = async function(searchTerm, category = null) {
  const searchQuery = {
    $and: [
      { isActive: true },
      {
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } },
          { sku: { $regex: searchTerm, $options: 'i' } },
          { brand: { $regex: searchTerm, $options: 'i' } },
          { tags: { $in: [new RegExp(searchTerm, 'i')] } }
        ]
      }
    ]
  };

  if (category) {
    searchQuery.$and.push({ category });
  }

  return this.find(searchQuery).sort({ createdAt: -1 });
};

// =======================
// Query Helpers
// =======================
productSchema.query.active = function() {
  return this.where({ isActive: true });
};

productSchema.query.inStock = function() {
  return this.where({ stock: { $gt: 0 } });
};

productSchema.query.byCategory = function(category) {
  return this.where({ category });
};

productSchema.query.featured = function() {
  return this.where({ isFeatured: true });
};

// =======================
// Safe Export (Prevents "Cannot overwrite model" error)
// =======================
module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);