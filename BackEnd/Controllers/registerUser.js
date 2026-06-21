import User from '../Models/User.js';
import Category from '../Models/Category.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import defaultCategories from '../Utils/defaultCategories.js'; 

/**
 * @desc    Register a new user, seed default categories, and issue auth token
 * @route   POST /api/auth/register
 * @access  Public
 */
export const registerUser = async (req, res) => {
    try {
        // 1. Extract values from request body (including optional currency input)
        const { name, email, password, currency } = req.body;

        // 2. Validate basic input requirements before querying database
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please provide name, email, and password' });
        }

        // 3. Check if user already exists in the system
        const userExists = await User.findOne({ email: email.toLowerCase() });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // 4. Securely hash the plain text password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 5. Create new User document in MongoDB
        const newUser = await User.create({
            name,
            email: email.toLowerCase(),
            passwordHash: hashedPassword, // Matches camelCase from your User model
            currency                     // If undefined, Mongoose sets fallback to "USD"
        });

        // 6. Automatically seed user-specific system categories
        const userSpecificCategories = defaultCategories.map(cat => ({
            ...cat,
            user_id: newUser._id,        // Links category to this new user account
            is_default: true             // System template tag
        }));

        // Batch insert seeded categories to save database roundtrips
        await Category.insertMany(userSpecificCategories);

        // 7. Generate JWT signed payload matching your protect middleware expectations
        const token = jwt.sign(
            { user_id: newUser._id }, 
            process.env.JWT_SECRET, 
            { expiresIn: '30d' }
        );
        
        // 8. Send structured payload response back to the client
        res.status(201).json({
            success: true,
            message: "Registration successful!",
            token,
            user: { 
                user_id: newUser._id, 
                name: newUser.name, 
                email: newUser.email,
                currency: newUser.currency // Returns "USD" or the client's preferred currency
            }
        });

    } catch (error) {
        // Return structured 500 error if any database operations fail
        res.status(500).json({ success: false, message: error.message });
    }
};
