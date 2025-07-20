const express = require("express");
const router = express.Router();
const { 
    getUserOrders,
    getOrderById,
    getAllOrders,
    updateOrderStatus,
    cancelOrder
} = require("../controllers/orderController");
const { protect, authorize } = require("../middleware/auth");

// All order routes require authentication
router.use(protect);

// User routes
router.get("/my-orders", getUserOrders);
router.get("/:id", getOrderById);
router.put("/:id/cancel", cancelOrder);

// Admin routes
router.get("/", authorize('admin'), getAllOrders);
router.put("/:id/status", authorize('admin'), updateOrderStatus);

module.exports = router; 