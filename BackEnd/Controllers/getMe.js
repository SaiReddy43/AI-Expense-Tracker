import User from '../Models/User.js'; 

/**
 * @desc    Get current logged-in user profile data
 * @route   GET /api/auth/me
 * @access  Private (Requires protect middleware)
 */
export const getMe = async (req, res) => {
    try {
        // 1. FIXED: Adjusted the string projection parameter to match your updated schema naming layout
        // We look for 'passwordHash' or 'password_hash' based on what exists to strip it completely from responses.
        const user = await User.findById(req.user_id).select('-passwordHash -password_hash -__v');

        // 2. Enforce a straightforward document existence check
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // 3. Return the sanitized database document payload response back to the client
        res.status(200).json({
  user: {
    user_id: user._id,
    name: user.name,
    email: user.email,
    currency: user.currency
  }
});
        
    } catch (error) {
        console.error('GetMe error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
