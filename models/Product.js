const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot be more than 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    maxlength: [5000, 'Description cannot be more than 5000 characters']
  },
  sku: {
    type: String,
    required: [true, 'SKU is required'],
    unique: true,
    uppercase: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'electronics',
      'clothing',
      'books',
      'home-garden',
      'sports',
      'beauty',
      'toys',
      'food-beverages',
      'digital-products',
      'services',
      'other'
    ]
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  comparePrice: {
    type: Number,
    min: [0, 'Compare price cannot be negative']
  },
  cost: {
    type: Number,
    min: [0, 'Cost cannot be negative']
  },
  stock: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  lowStockAlert: {
    type: Number,
    default: 10
  },
  images: [{
    url: String,
    alt: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  variants: [{
    name: String,
    options: [String],
    price: Number,
    stock: Number,
    sku: String
  }],
  tags: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  isDigital: {
    type: Boolean,
    default: false
  },
  weight: {
    type: Number,
    min: 0
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number
  },
  seo: {
    title: String,
    description: String,
    slug: String
  },
  metadata: mongoose.Schema.Types.Mixed,
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
productSchema.index({ category: 1 });
productSchema.index({ sku: 1 });
productSchema.index({ price: 1 });
productSchema.index({ stock: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ 'seo.slug': 1 });

// Update timestamp
productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Generate slug if not provided
  if (!this.seo.slug && this.name) {
    this.seo.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }
  
  next();
});

// Virtual for inStock
productSchema.virtual('inStock').get(function() {
  return this.stock > 0;
});

// Virtual for isLowStock
productSchema.virtual('isLowStock').get(function() {
  return this.stock <= this.lowStockAlert && this.stock > 0;
});

// Virtual for profit margin
productSchema.virtual('profitMargin').get(function() {
  if (!this.cost || this.cost === 0) return 0;
  return ((this.price - this.cost) / this.cost * 100).toFixed(2);
});

// Static method for inventory statistics
productSchema.statics.getInventoryStats = async function() {
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
              { $and: [
                { $lte: ['$stock', '$lowStockAlert'] },
                { $gt: ['$stock', 0] } 
              ]},
              1,
              0
            ]
          }
        },
        outOfStockCount: {
          $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] }
        }
      }
    }
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
              { $and: [
                { $lte: ['$stock', '$lowStockAlert'] },
                { $gt: ['$stock', 0] }
              ]},
              1,
              0
            ]
          }
        },
        outOfStockItems: {
          $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] }
        }
      }
    }
  ]);

  return {
    byCategory: stats,
    overview: overallStats[0] || {
      totalProducts: 0,
      activeProducts: 0,
      totalStockValue: 0,
      averagePrice: 0,
      lowStockItems: 0,
      outOfStockItems: 0
    }
  };
};

module.exports = mongoose.model('Product', productSchema);