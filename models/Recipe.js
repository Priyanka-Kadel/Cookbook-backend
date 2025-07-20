const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    required: true,
    enum: ['g', 'kg', 'ml', 'l', 'tbsp', 'tsp', 'cup', 'piece', 'slice', 'clove', 'bunch']
  },
  price: {
    type: Number,
    required: true,
    default: 0
  }
});

const stepSchema = new mongoose.Schema({
  stepNumber: {
    type: Number,
    required: true
  },
  instruction: {
    type: String,
    required: true
  },
  duration: {
    type: Number, // in minutes
    default: 0
  }
});

const recipeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  cuisine: {
    type: String,
    required: true,
    enum: ['Nepali', 'Italian', 'Chinese', 'Indian', 'Mexican', 'American', 'Thai', 'Japanese', 'Mediterranean', 'Other']
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['Easy', 'Medium', 'Hard']
  },
  prepTime: {
    type: Number, // in minutes
    required: true
  },
  cookTime: {
    type: Number, // in minutes
    required: true
  },
  servings: {
    type: Number,
    required: true,
    default: 2
  },
  ingredients: [ingredientSchema],
  steps: [stepSchema],
  totalPrice: {
    type: Number,
    required: true,
    default: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

// Calculate total price based on ingredients
recipeSchema.methods.calculateTotalPrice = function() {
  return this.ingredients.reduce((total, ingredient) => {
    return total + (ingredient.quantity * ingredient.price);
  }, 0);
};

// Calculate price for specific number of servings
recipeSchema.methods.calculatePriceForServings = function(servings) {
  const basePrice = this.calculateTotalPrice();
  const baseServings = this.servings;
  return (basePrice / baseServings) * servings;
};

const Recipe = mongoose.model('Recipe', recipeSchema);

module.exports = Recipe; 