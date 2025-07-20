const Order = require('../models/orderModel');

// Get user's orders
const getUserOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.id })
            .populate('items.recipe', 'title recipeImage category')
            .sort({ createdAt: -1 });

        res.status(200).json({ 
            success: true, 
            orders 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching orders', 
            error: error.message 
        });
    }
};

// Get order by ID
const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('items.recipe', 'title recipeImage category ingredients steps')
            .populate('user', 'name email phone');

        if (!order) {
            return res.status(404).json({ 
                success: false, 
                message: 'Order not found' 
            });
        }

        // Check if user owns this order or is admin
        if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Not authorized to view this order' 
            });
        }

        res.status(200).json({ 
            success: true, 
            order 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching order', 
            error: error.message 
        });
    }
};

// Get all orders (admin only)
const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find({})
            .populate('items.recipe', 'title recipeImage category')
            .populate('user', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({ 
            success: true, 
            orders 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching orders', 
            error: error.message 
        });
    }
};

// Update order status (admin only)
const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ 
                success: false, 
                message: 'Order not found' 
            });
        }

        order.status = status;
        await order.save();

        res.status(200).json({ 
            success: true, 
            message: 'Order status updated successfully',
            order 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error updating order status', 
            error: error.message 
        });
    }
};

// Cancel order
const cancelOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ 
                success: false, 
                message: 'Order not found' 
            });
        }

        // Check if user owns this order or is admin
        if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Not authorized to cancel this order' 
            });
        }

        // Only allow cancellation if order is pending or confirmed
        if (!['pending', 'confirmed'].includes(order.status)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Order cannot be cancelled at this stage' 
            });
        }

        order.status = 'cancelled';
        await order.save();

        res.status(200).json({ 
            success: true, 
            message: 'Order cancelled successfully',
            order 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error cancelling order', 
            error: error.message 
        });
    }
};

module.exports = {
    getUserOrders,
    getOrderById,
    getAllOrders,
    updateOrderStatus,
    cancelOrder
}; 