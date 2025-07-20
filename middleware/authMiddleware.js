const jwt = require('jsonwebtoken');

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) {
        next();
        // return res.status(401).json({ message: 'Access Denied' });
    }
    try {
        const verified = jwt.verify(
            token.split(' ')[1], // Assuming the token is in the format "Bearer
            process.env.JWT_SECRET || 'SECRETHO'
        );
        // const verified = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
        req.user = verified; // Attach user info to request object
        next();
    } catch (err) {
       // console.log(err);
       next();
        // res.status(400).json({ message: 'Invalid Token' });
    }
};

// Middleware to authorize roles
const authorizeRole = (roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Forbidden: Access is restricted to specific roles' });
    }
    next();
};

module.exports = { verifyToken, authorizeRole };