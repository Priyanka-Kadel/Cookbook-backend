const multer = require("multer");
const fs = require("fs");
const Recipe = require("../models/recipeModel");

// Create a new recipe (Admin only)
const createRecipe = async (req, res) => {
    try {
      console.log("Creating recipe with data:", req.body);
      console.log("User:", req.user);
      
      const { 
        title, 
        description, 
        category, 
        prepTime, 
        cookTime, 
        servings,
        ingredients,
        steps,
        totalPrice
      } = req.body;
      
      const recipeImage = req.file ? req.file.path : ""; // Assuming you're using multer for file upload

      // Parse ingredients and steps with error handling
      let parsedIngredients = [];
      let parsedSteps = [];

      try {
        parsedIngredients = ingredients ? JSON.parse(ingredients) : [];
        console.log("Parsed ingredients:", parsedIngredients);
      } catch (error) {
        console.error("Error parsing ingredients:", error);
        return res.status(400).json({ 
          message: "Invalid ingredients format", 
          success: false, 
          error: error.message 
        });
      }

      try {
        parsedSteps = steps ? JSON.parse(steps) : [];
        console.log("Parsed steps:", parsedSteps);
      } catch (error) {
        console.error("Error parsing steps:", error);
        return res.status(400).json({ 
          message: "Invalid steps format", 
          success: false, 
          error: error.message 
        });
      }

      // Validate ingredients
      for (let i = 0; i < parsedIngredients.length; i++) {
        const ingredient = parsedIngredients[i];
        if (!ingredient.name || !ingredient.quantity || !ingredient.unit) {
          return res.status(400).json({
            message: `Ingredient ${i + 1} is missing required fields (name, quantity, unit)`,
            success: false,
            ingredient: ingredient
          });
        }
        
        // Validate unit
        const validUnits = ['g', 'kg', 'ml', 'l', 'tbsp', 'tsp', 'cup', 'piece', 'slice', 'clove', 'bunch', 'pinch', 'dash', 'whole', 'can', 'jar', 'packet'];
        if (!validUnits.includes(ingredient.unit)) {
          return res.status(400).json({
            message: `Invalid unit '${ingredient.unit}' for ingredient '${ingredient.name}'. Valid units: ${validUnits.join(', ')}`,
            success: false
          });
        }
      }

      // Validate steps
      for (let i = 0; i < parsedSteps.length; i++) {
        const step = parsedSteps[i];
        if (!step.stepNumber || !step.instruction) {
          return res.status(400).json({
            message: `Step ${i + 1} is missing required fields (stepNumber, instruction)`,
            success: false,
            step: step
          });
        }
      }

      // Create recipe object
      const recipeData = {
        title,
        description,
        category,
        prepTime: parseInt(prepTime),
        cookTime: parseInt(cookTime),
        servings: parseInt(servings),
        ingredients: parsedIngredients,
        steps: parsedSteps,
        totalPrice: parseFloat(totalPrice),
        recipeImage,
        user_id: req.user.id
      };

      console.log("Recipe data to save:", recipeData);
  
      const newRecipe = new Recipe(recipeData);
  
      await newRecipe.save();
      res.status(201).json({ message: "Recipe added successfully", success: true, recipe: newRecipe });
    } catch (error) {
      console.error("Error creating recipe:", error);
      
      // Handle mongoose validation errors
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message,
          value: err.value
        }));
        return res.status(400).json({ 
          message: "Recipe validation failed", 
          success: false, 
          errors: validationErrors 
        });
      }
      
      res.status(500).json({ message: "Error adding recipe", success: false, error: error.message });
    }
  };
  
  // Get all recipes with filtering (Public)
  const getAllRecipes = async (req, res) => {
    try {
      console.log("Getting all recipes");
      const { category, search, sortBy } = req.query;
      let query = {};
      
      // Apply filters
      if (category) query.category = category;
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
      console.error("Error fetching recipes:", error);
      res.status(500).json({ message: "Error fetching recipes", success: false, error: error.message });
    }
  };

  // Get recipes by category (Public)
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

  // Get all categories (Public)
  const getCategories = async (req, res) => {
    try {
      const categories = ['breakfast', 'lunch', 'dinner'];
      res.status(200).json(categories);
    } catch (error) {
      res.status(500).json({ message: "Error fetching categories", success: false, error: error.message });
    }
  };
  

// Get a single recipe by id (Public)
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

// Calculate price for specific servings (Public)
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

// Update recipe by id (Admin only)
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

// Delete recipe by id (Admin only)
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