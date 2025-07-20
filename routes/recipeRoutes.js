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
} = require("../controllers/recipeController");
const { protect } = require("../middleware/auth"); // Fixed import

// Public routes
router.get("/", getAllRecipes);
router.get("/categories", getCategories);
router.get("/category/:category", getRecipesByCategory);
router.get("/:id", getRecipeById);
router.post("/:id/calculate-price", calculatePriceForServings);

// Protected routes (require authentication)
router.post("/", protect, upload.single('recipeImage'), createRecipe);
router.put("/:id", protect, upload.single('recipeImage'), updateRecipe);
router.delete("/:id", protect, deleteRecipe);

module.exports = router;