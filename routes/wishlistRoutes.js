const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');

// Add recipe to wishlist (saved recipes)
router.post('/wishlist/add/:recipeId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Ensure savedRecipes is an array (for older users without the field)
    if (!Array.isArray(user.savedRecipes)) {
      user.savedRecipes = [];
    }

    if (!user.savedRecipes.includes(req.params.recipeId)) {
      user.savedRecipes.push(req.params.recipeId);
      await user.save();
    }
    res.status(200).json({ message: "Added to saved recipes" });
  } catch (error) {
    console.error('Wishlist add error:', error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

// Get user's saved recipes (wishlist)
router.get('/wishlist', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('savedRecipes', 'title recipeImage category totalPrice prepTime cookTime difficulty');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user.savedRecipes || []);
  } catch (error) {
    console.error('Wishlist get error:', error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

// Remove recipe from wishlist (saved recipes)
router.delete('/wishlist/remove/:recipeId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.savedRecipes = user.savedRecipes.filter(id => id.toString() !== req.params.recipeId);
    await user.save();
    res.status(200).json({ message: "Removed from saved recipes" });
  } catch (error) {
    console.error('Wishlist remove error:', error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

// Check if recipe is in wishlist
router.get('/wishlist/check/:recipeId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const isInWishlist = user.savedRecipes.includes(req.params.recipeId);
    res.status(200).json({ isInWishlist });
  } catch (error) {
    console.error('Wishlist check error:', error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

module.exports = router;