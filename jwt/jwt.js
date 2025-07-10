const jwt = require('jsonwebtoken');

const JWT_SECRET = '';

function generateJWT(user) {
    // Log the user object to ensure uid is present
    //console.log('Generating JWT for user:', user);

    return jwt.sign(
        { username: user.username, uid: user.id }, // Ensure uid is present
        JWT_SECRET,
        { expiresIn: '30min' }
    );
}

function verifyJWT(req, res, next) {
    //const { token } = req.body;
    const token = req.cookies.token; // or wherever you're sending the token
    console.log("Token from cookie:", token);
    if (!token) return res.status(401).send({ message: 'No token provided' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET); // Ensure this is your JWT secret
        // Log the decoded token to verify contents
        console.log('Decoded JWT:', decoded);

        // Assign user details to req.user
        req.user = { username: decoded.username, uid: decoded.uid };
        // Log the assigned user details to verify
        //console.log('Assigned user details:', req.user);

        next();
    } catch (err) {
        console.error('Token verification error:', err);
        return res.status(401).send("Invalid token");
    }
}

module.exports = { generateJWT, verifyJWT };
