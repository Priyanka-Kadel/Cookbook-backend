const express = require("express");
const router = express.Router();
const { 
  createRecipe, 
  getAllRecipes, 
  getRecipeById, 
  updateRecipe, 
  deleteRecipe, 
  calculatePriceForServings,
  getRecipesByCategory,
  getCategories,
  upload 
} = require("../controllers/roomController");
const { authenticateToken } = require("../middleware/auth");

// Public routes
router.get("/", getAllRecipes);
router.get("/categories", getCategories);
router.get("/category/:category", getRecipesByCategory);
router.get("/:id", getRecipeById);
router.post("/:id/calculate-price", calculatePriceForServings);

// Protected routes (require authentication)
router.post("/", authenticateToken, upload.single('recipeImage'), createRecipe);
router.put("/:id", authenticateToken, upload.single('recipeImage'), updateRecipe);
router.delete("/:id", authenticateToken, deleteRecipe);

module.exports = router;