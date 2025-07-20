const multer = require("multer");
const fs = require("fs");
const Recipe = require("../models/roomsModel"); // Keep the same file but model is now Recipe

// Create a new recipe
const createRecipe = async (req, res) => {
    try {
      const { 
        title, 
        description, 
        category, 
        difficulty, 
        prepTime, 
        cookTime, 
        servings,
        ingredients,
        steps,
        totalPrice
      } = req.body;
      
      const recipeImage = req.file ? req.file.path : ""; // Assuming you're using multer for file upload
  
      const newRecipe = new Recipe({
        title,
        description,
        category,
        difficulty,
        prepTime,
        cookTime,
        servings,
        ingredients: JSON.parse(ingredients), // Parse ingredients array
        steps: JSON.parse(steps), // Parse steps array
        totalPrice,
        recipeImage,
        user_id: req.user.id // Assuming you have user info in req.user
      });
  
      await newRecipe.save();
      res.status(201).json({ message: "Recipe added successfully", success: true, recipe: newRecipe });
    } catch (error) {
      res.status(500).json({ message: "Error adding recipe", success: false, error: error.message });
    }
  };
  
  // Get all recipes with filtering
  const getAllRecipes = async (req, res) => {
    try {
      const { category, difficulty, search, sortBy } = req.query;
      let query = {};
      
      // Apply filters
      if (category) query.category = category;
      if (difficulty) query.difficulty = difficulty;
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }
      
      let recipes = Recipe.find(query);
      
      // Apply sorting
      if (sortBy === 'price') recipes = recipes.sort({ totalPrice: 1 });
      else if (sortBy === 'time') recipes = recipes.sort({ prepTime: 1 });
      else if (sortBy === 'rating') recipes = recipes.sort({ rating: -1 });
      else recipes = recipes.sort({ createdAt: -1 }); // Default: newest first
      
      recipes = await recipes.populate('user_id', 'name');
      res.status(200).json(recipes);
    } catch (error) {
      res.status(500).json({ message: "Error fetching recipes", success: false, error: error.message });
    }
  };

  // Get recipes by category
  const getRecipesByCategory = async (req, res) => {
    try {
      const { category } = req.params;
      const recipes = await Recipe.find({ category })
        .populate('user_id', 'name')
        .sort({ createdAt: -1 });
      
      res.status(200).json(recipes);
    } catch (error) {
      res.status(500).json({ message: "Error fetching recipes by category", success: false, error: error.message });
    }
  };

  // Get all categories
  const getCategories = async (req, res) => {
    try {
      const categories = ['breakfast', 'lunch', 'dinner'];
      res.status(200).json(categories);
    } catch (error) {
      res.status(500).json({ message: "Error fetching categories", success: false, error: error.message });
    }
  };
  

// Get a single recipe by id
const getRecipeById = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id).populate('user_id', 'name');
    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }
    res.status(200).json(recipe);
  } catch (error) {
    res.status(500).json({ message: "Error fetching recipe", error: error.message });
  }
};

// Calculate price for specific servings
const calculatePriceForServings = async (req, res) => {
  try {
    const { servings } = req.body;
    const recipe = await Recipe.findById(req.params.id);
    
    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }
    
    const priceForServings = recipe.calculatePriceForServings(parseInt(servings));
    res.status(200).json({ 
      originalPrice: recipe.totalPrice,
      originalServings: recipe.servings,
      requestedServings: parseInt(servings),
      calculatedPrice: priceForServings
    });
  } catch (error) {
    res.status(500).json({ message: "Error calculating price", error: error.message });
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/";
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// Update recipe by id
const updateRecipe = async (req, res) => {
  try {
    // First handle the image upload
    const recipeImage = req.file ? req.file.path : undefined;  // Get the new image path, if uploaded

    const updateData = { ...req.body };
    if (req.body.ingredients) updateData.ingredients = JSON.parse(req.body.ingredients);
    if (req.body.steps) updateData.steps = JSON.parse(req.body.steps);
    if (recipeImage) updateData.recipeImage = recipeImage;

    // Now, update the recipe data including the image
    const updatedRecipe = await Recipe.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }  // This ensures the updated recipe is returned
    );

    if (!updatedRecipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }

    res.status(200).json({ message: "Recipe updated successfully", recipe: updatedRecipe });
  } catch (error) {
    res.status(500).json({ message: "Error updating recipe", error: error.message });
  }
};

// Delete recipe by id
const deleteRecipe = async (req, res) => {
  try {
    const deletedRecipe = await Recipe.findByIdAndDelete(req.params.id);
    if (!deletedRecipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }
    res.status(200).json({ message: "Recipe deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting recipe", error: error.message });
  }
};

module.exports = { 
  createRecipe, 
  getAllRecipes, 
  getRecipeById, 
  updateRecipe, 
  deleteRecipe, 
  calculatePriceForServings,
  getRecipesByCategory,
  getCategories,
  upload 
};
