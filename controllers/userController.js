// controllers/userController.js
const asyncHandler = require("../middleware/async");
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Recipe = require('../models/recipeModel');
const jwt = require('jsonwebtoken');

// Get user by ID
const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password')
            .populate('savedRecipes', 'title recipeImage category totalPrice');
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        res.status(200).json({ 
            success: true, 
            user 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching user',
            error: error.message 
        });
    }
};

// Get current user profile
const getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select('-password')
            .populate('savedRecipes', 'title recipeImage category totalPrice');
        
        res.status(200).json({ 
            success: true, 
            user 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching user profile',
            error: error.message 
        });
    }
};

// Get all users (admin only)
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        
        res.status(200).json({ 
            success: true, 
            users 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching users',
            error: error.message 
        });
    }
};

// Update user profile
const updateUser = async (req, res) => {
    const { name, email, address, phone } = req.body;
    const userId = req.params.id;
  
    try {
        // Find the user by ID
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
  
        // Update user fields
        if (name) user.name = name;
        if (email) user.email = email;
        if (address) user.address = address;
        if (phone) user.phone = phone;
  
        // Save the updated user
        await user.save();
  
        res.status(200).json({ success: true, message: 'User updated successfully', user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error updating user', error });
    }
};

// Save recipe to user's saved recipes
const saveRecipe = async (req, res) => {
    try {
        const { recipeId } = req.body;
        const userId = req.user.id;

        // Check if recipe exists
        const recipe = await Recipe.findById(recipeId);
        if (!recipe) {
            return res.status(404).json({ 
                success: false, 
                message: 'Recipe not found' 
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Check if recipe is already saved
        if (user.savedRecipes.includes(recipeId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Recipe already saved' 
            });
        }

        // Add recipe to saved recipes
        user.savedRecipes.push(recipeId);
        await user.save();

        await user.populate('savedRecipes', 'title recipeImage category totalPrice');

        res.status(200).json({ 
            success: true, 
            message: 'Recipe saved successfully',
            savedRecipes: user.savedRecipes
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error saving recipe', 
            error: error.message 
        });
    }
};

// Remove recipe from user's saved recipes
const removeSavedRecipe = async (req, res) => {
    try {
        const { recipeId } = req.params;
        const userId = req.user.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Remove recipe from saved recipes
        user.savedRecipes = user.savedRecipes.filter(
            id => id.toString() !== recipeId
        );
        await user.save();

        await user.populate('savedRecipes', 'title recipeImage category totalPrice');

        res.status(200).json({ 
            success: true, 
            message: 'Recipe removed from saved recipes',
            savedRecipes: user.savedRecipes
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error removing saved recipe', 
            error: error.message 
        });
    }
};

// Get user's saved recipes
const getSavedRecipes = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await User.findById(userId)
            .populate('savedRecipes', 'title recipeImage category totalPrice prepTime cookTime difficulty');

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        res.status(200).json({ 
            success: true, 
            savedRecipes: user.savedRecipes
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching saved recipes', 
            error: error.message 
        });
    }
};

// Check if recipe is saved by user
const checkSavedRecipe = async (req, res) => {
    try {
        const { recipeId } = req.params;
        const userId = req.user.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        const isSaved = user.savedRecipes.includes(recipeId);

        res.status(200).json({ 
            success: true, 
            isSaved
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error checking saved recipe', 
            error: error.message 
        });
    }
};

module.exports = {
    getUserById,
    getCurrentUser,
    getAllUsers,
    updateUser,
    saveRecipe,
    removeSavedRecipe,
    getSavedRecipes,
    checkSavedRecipe
};