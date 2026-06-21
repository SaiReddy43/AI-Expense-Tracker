import jwt from "jsonwebtoken";

export const protect = async (req, res, next) => {
    let token;
    const authHeader = req.headers.authorization;

    // 1. Check if authorization header exists and starts with "Bearer"
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Not authorized, no token" });
    }

    try {
        // 2. Extract the token from the "Bearer <token>" string
        token = authHeader.split(" ")[1];

        // 3. Verify the token using your environment secret
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 4. Attach the decoded user ID to the request object
        req.user_id = decoded.user_id;

        // 5. Move to the next middleware or route controller
        next();
    } catch (error) {
        // 6. Handle expired, invalid, or tampered tokens
        return res.status(401).json({ message: "Not authorized, token failed" });
    }
};

export default protect;
