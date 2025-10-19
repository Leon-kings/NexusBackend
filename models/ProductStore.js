const mongoose = require('mongoose');

const specificationSchema = new mongoose.Schema({
  size: String,
  resolution: String,
  technology: String,
  features: String
});

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  brand: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  originalPrice: {
    type: Number,
    required: true
  },
  discount: {
    type: Number,
    default: 0
  },
  category: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  images: [String],
  description: String,
  features: [String],
  specifications: specificationSchema,
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  isNew: {
    type: Boolean,
    default: false
  },
  inStock: {
    type: Boolean,
    default: true
  },
  stock: {
    type: Number,
    default: 0
  },
  stockIn: {
    type: Number,
    default: 0
  },
  stockOut: {
    type: Number,
    default: 0
  },
  sold: {
    type: Number,
    default: 0
  },
  cloudinary_id: String
}, {
  timestamps: true
});

// Update stock when product is sold
productSchema.methods.sellProduct = function(quantity = 1) {
  if (this.stock >= quantity) {
    this.stock -= quantity;
    this.stockOut += quantity;
    this.sold += quantity;
    
    // Update inStock status
    this.inStock = this.stock > 0;
    
    return this.save();
  } else {
    throw new Error('Insufficient stock');
  }
};

// Add stock
productSchema.methods.addStock = function(quantity) {
  this.stock += quantity;
  this.stockIn += quantity;
  this.inStock = true;
  return this.save();
};

module.exports = mongoose.model('Product', productSchema);