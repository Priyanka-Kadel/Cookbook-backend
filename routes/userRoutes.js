// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { 
    updateUser,
    getAllUsers,
    getUserById,
    getCurrentUser,
    saveRecipe,
    removeSavedRecipe,
    getSavedRecipes,
    checkSavedRecipe
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');

// Public routes
router.get('/customer/:id', getUserById);

// Protected routes (require authentication)
router.use(protect);

// Debug route to check user authentication and role
router.get('/debug/me', (req, res) => {
    res.json({
        success: true,
        user: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role
        },
        message: "User is authenticated"
    });
});

// User profile routes
router.get('/profile', getCurrentUser);
router.put('/update/:id', updateUser);

// Saved recipes routes (normal users can save/favorite recipes)
router.get('/saved-recipes', getSavedRecipes);
router.post('/save-recipe', saveRecipe);
router.delete('/saved-recipes/:recipeId', removeSavedRecipe);
router.get('/saved-recipes/check/:recipeId', checkSavedRecipe);

// Admin only routes
router.get('/customer', authorize('admin'), getAllUsers);
router.delete('/delete/:id', authorize('admin'), async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error deleting user' });
    }
});

module.exports = router;