//PROTECT THE MIDDLEWARE
const jwt = require("jsonwebtoken");
const asyncHandler = require("./async");
const User = require("../models/User");

//Protect routes
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(" ")[1];
  }

  //Make sure token exist
  if (!token) {
    return res
      .status(401)
      .json({ 
        message: "Not authorized to access this route - No token provided",
        code: "NO_TOKEN"
      });
  }

  try {
    //Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "SECRETHO");
    console.log("Decoded token:", decoded);
    
    req.user = await User.findById(decoded.id);
    
    if (!req.user) {
      return res
        .status(401)
        .json({ 
          message: "User not found",
          code: "USER_NOT_FOUND"
        });
    }
    
    // Check if token matches the one stored in database
    if (req.user.token !== token) {
      return res
        .status(401)
        .json({ 
          message: "Token has been invalidated",
          code: "TOKEN_INVALIDATED"
        });
    }
    
    console.log("User found:", { id: req.user._id, role: req.user.role });
    next();
  } catch (err) {
    console.error("Token verification error:", err);
    
    if (err.name === 'TokenExpiredError') {
      return res
        .status(401)
        .json({ 
          message: "Token has expired",
          code: "TOKEN_EXPIRED"
        });
    }
    
    return res
      .status(401)
      .json({ 
        message: "Not authorized to access this route - Invalid token",
        code: "INVALID_TOKEN"
      });
  }
});

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    console.log("Checking authorization for roles:", roles);
    console.log("User role:", req.user.role);
    
    if (!req.user) {
      return res.status(401).json({
        message: "User not authenticated",
        code: "NOT_AUTHENTICATED"
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `User role ${req.user.role} is not authorized to access this route. Required roles: ${roles.join(', ')}`,
        code: "INSUFFICIENT_PERMISSIONS"
      });
    }
    next();
  };
};
