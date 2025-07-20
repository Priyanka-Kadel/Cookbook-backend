const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  recipe: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recipe',
    required: true
  },
  servings: {
    type: Number,
    required: true,
    min: 1
  },
  totalPrice: {
    type: Number,
    required: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [cartItemSchema],
  totalAmount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Calculate total amount
cartSchema.methods.calculateTotal = function() {
  return this.items.reduce((total, item) => {
    return total + item.totalPrice;
  }, 0);
};

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart; 