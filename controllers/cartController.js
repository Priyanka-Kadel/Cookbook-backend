const Cart = require('../models/cartModel');
const Recipe = require('../models/recipeModel');

// Get user's cart
const getCart = async (req, res) => {
    try {
        let cart = await Cart.findOne({ user: req.user.id, isActive: true })
            .populate('items.recipe', 'title recipeImage totalPrice servings');

        if (!cart) {
            cart = new Cart({ user: req.user.id, items: [], totalAmount: 0 });
            await cart.save();
        }

        res.status(200).json({ 
            success: true, 
            cart 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching cart', 
            error: error.message 
        });
    }
};

// Add recipe to cart
const addToCart = async (req, res) => {
    try {
        const { recipeId, servings } = req.body;

        // Validate recipe exists
        const recipe = await Recipe.findById(recipeId);
        if (!recipe) {
            return res.status(404).json({ 
                success: false, 
                message: 'Recipe not found' 
            });
        }

        // Calculate price for requested servings
        const priceForServings = recipe.calculatePriceForServings(servings);

        let cart = await Cart.findOne({ user: req.user.id, isActive: true });

        if (!cart) {
            cart = new Cart({ user: req.user.id, items: [], totalAmount: 0 });
        }

        // Check if recipe already exists in cart
        const existingItemIndex = cart.items.findIndex(
            item => item.recipe.toString() === recipeId
        );

        if (existingItemIndex > -1) {
            // Update existing item
            cart.items[existingItemIndex].servings = servings;
            cart.items[existingItemIndex].totalPrice = priceForServings;
        } else {
            // Add new item
            cart.items.push({
                recipe: recipeId,
                servings: servings,
                totalPrice: priceForServings
            });
        }

        // Recalculate total
        cart.totalAmount = cart.calculateTotal();
        await cart.save();

        await cart.populate('items.recipe', 'title recipeImage totalPrice servings');

        res.status(200).json({ 
            success: true, 
            message: 'Recipe added to cart successfully',
            cart 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error adding to cart', 
            error: error.message 
        });
    }
};

// Update cart item quantity
const updateCartItem = async (req, res) => {
    try {
        const { itemId, servings } = req.body;

        const cart = await Cart.findOne({ user: req.user.id, isActive: true });
        if (!cart) {
            return res.status(404).json({ 
                success: false, 
                message: 'Cart not found' 
            });
        }

        const item = cart.items.id(itemId);
        if (!item) {
            return res.status(404).json({ 
                success: false, 
                message: 'Item not found in cart' 
            });
        }

        // Get recipe to calculate new price
        const recipe = await Recipe.findById(item.recipe);
        const newPrice = recipe.calculatePriceForServings(servings);

        item.servings = servings;
        item.totalPrice = newPrice;

        cart.totalAmount = cart.calculateTotal();
        await cart.save();

        await cart.populate('items.recipe', 'title recipeImage totalPrice servings');

        res.status(200).json({ 
            success: true, 
            message: 'Cart item updated successfully',
            cart 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error updating cart item', 
            error: error.message 
        });
    }
};

// Remove item from cart
const removeFromCart = async (req, res) => {
    try {
        const { itemId } = req.params;

        const cart = await Cart.findOne({ user: req.user.id, isActive: true });
        if (!cart) {
            return res.status(404).json({ 
                success: false, 
                message: 'Cart not found' 
            });
        }

        cart.items = cart.items.filter(item => item._id.toString() !== itemId);
        cart.totalAmount = cart.calculateTotal();
        await cart.save();

        await cart.populate('items.recipe', 'title recipeImage totalPrice servings');

        res.status(200).json({ 
            success: true, 
            message: 'Item removed from cart successfully',
            cart 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error removing from cart', 
            error: error.message 
        });
    }
};

// Clear cart
const clearCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user.id, isActive: true });
        if (!cart) {
            return res.status(404).json({ 
                success: false, 
                message: 'Cart not found' 
            });
        }

        cart.items = [];
        cart.totalAmount = 0;
        await cart.save();

        res.status(200).json({ 
            success: true, 
            message: 'Cart cleared successfully',
            cart 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error clearing cart', 
            error: error.message 
        });
    }
};

module.exports = {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart
}; 